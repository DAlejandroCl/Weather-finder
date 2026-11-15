import { act, renderHook, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "../test/server";
import { GEO_URL, WEATHER_URL, geoResponse, ok, weatherResponse } from "../test/fixtures";
import useWeather from "./useWeather";

const bogota = { country: "CO", city: "Bogotá" };

describe("useWeather", () => {
  it("returns the weather after the two requests succeed", async () => {
    server.use(
      http.get(GEO_URL, () => ok(geoResponse)),
      http.get(WEATHER_URL, () => ok(weatherResponse)),
    );
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.fetchWeather(bogota));

    expect(result.current.weather?.name).toBe("Bogotá");
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("asks the weather API for the coordinates of the first place", async () => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get(GEO_URL, () => ok(geoResponse)),
      http.get(WEATHER_URL, ({ request }) => {
        query = new URL(request.url).searchParams;
        return ok(weatherResponse);
      }),
    );
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.fetchWeather(bogota));

    expect(query?.get("lat")).toBe("4.61");
    expect(query?.get("lon")).toBe("-74.08");
    expect(query?.get("units")).toBe("metric");
  });

  it("sets a not-found message when the list of places is empty", async () => {
    server.use(http.get(GEO_URL, () => ok([])));
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.fetchWeather(bogota));

    expect(result.current.weather).toBeNull();
    expect(result.current.error).toMatch(/No information was found/);
    expect(result.current.loading).toBe(false);
  });

  it("sets a generic message when the network fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    server.use(http.get(GEO_URL, () => HttpResponse.error()));
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.fetchWeather(bogota));

    expect(result.current.weather).toBeNull();
    expect(result.current.error).toMatch(/An error occurred/);
  });

  it("sets a generic message when the response does not match the schema", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    server.use(
      http.get(GEO_URL, () => ok(geoResponse)),
      http.get(WEATHER_URL, () => ok({ name: "Bogotá" })),
    );
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.fetchWeather(bogota));

    expect(result.current.weather).toBeNull();
    expect(result.current.error).toMatch(/An error occurred/);
  });

  it("encodes the city, so characters such as & and # stay inside the query", async () => {
    let rawUrl = "";
    let q: string | null = null;
    server.use(
      http.get(GEO_URL, ({ request }) => {
        rawUrl = request.url;
        q = new URL(request.url).searchParams.get("q");
        return ok([]);
      }),
    );
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.fetchWeather({ country: "DE", city: "A&B#C" }));

    expect(q).toBe("A&B#C,DE");
    expect(rawUrl).toContain("A%26B%23C");
    expect(new URL(rawUrl).hash).toBe("");
  });

  it("keeps the result of the newest search when an older one answers later", async () => {
    server.use(
      http.get(GEO_URL, async ({ request }) => {
        const city = new URL(request.url).searchParams.get("q")?.split(",")[0];
        if (city === "Slow") {
          await delay(150);
          return ok([{ lat: 1, lon: 1 }]);
        }
        return ok([{ lat: 2, lon: 2 }]);
      }),
      http.get(WEATHER_URL, ({ request }) => {
        const lat = new URL(request.url).searchParams.get("lat");
        return ok({ ...weatherResponse, name: lat === "1" ? "Slow City" : "Fast City" });
      }),
    );
    const { result } = renderHook(() => useWeather());

    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.fetchWeather({ country: "CO", city: "Slow" });
    });
    await act(() => result.current.fetchWeather({ country: "CO", city: "Fast" }));
    await act(() => first);

    await waitFor(() => expect(result.current.weather?.name).toBe("Fast City"));
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("does not show an error for a search that was cancelled", async () => {
    server.use(
      http.get(GEO_URL, async () => {
        await delay(100);
        return ok(geoResponse);
      }),
    );
    const { result, unmount } = renderHook(() => useWeather());

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.fetchWeather(bogota);
    });
    unmount();

    await expect(pending).resolves.toBeUndefined();
  });
});
