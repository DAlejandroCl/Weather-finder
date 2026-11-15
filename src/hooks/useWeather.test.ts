import { act, renderHook, waitFor } from "@testing-library/react";
import { delay, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "../test/server";
import {
  GEO_URL,
  WEATHER_URL,
  geoResponse,
  ok,
  springfieldResponse,
  weatherResponse,
} from "../test/fixtures";
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
    expect(result.current.places).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("sends the city and the country to the geocoding endpoint, and never an API key", async () => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get(GEO_URL, ({ request }) => {
        query = new URL(request.url).searchParams;
        return ok([]);
      }),
    );
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.fetchWeather(bogota));

    expect(query?.get("city")).toBe("Bogotá");
    expect(query?.get("country")).toBe("CO");
    expect([...(query?.keys() ?? [])].sort()).toEqual(["city", "country"]);
  });

  it("asks the weather endpoint for the coordinates of the only place", async () => {
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
    expect([...(query?.keys() ?? [])].sort()).toEqual(["lat", "lon"]);
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
    server.use(http.get(GEO_URL, () => ok({ error: "down" }, 502)));
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.fetchWeather(bogota));

    expect(result.current.weather).toBeNull();
    expect(result.current.error).toMatch(/An error occurred/);
  });

  it("tells the person to wait when the server answers 429", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    server.use(http.get(GEO_URL, () => ok({ error: "limit" }, 429)));
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.fetchWeather(bogota));

    expect(result.current.error).toMatch(/Too many requests/);
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
    let city: string | null = null;
    server.use(
      http.get(GEO_URL, ({ request }) => {
        rawUrl = request.url;
        city = new URL(request.url).searchParams.get("city");
        return ok([]);
      }),
    );
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.fetchWeather({ country: "DE", city: "A&B#C" }));

    expect(city).toBe("A&B#C");
    expect(rawUrl).toContain("A%26B%23C");
    expect(new URL(rawUrl).hash).toBe("");
  });

  describe("when several places share the name", () => {
    it("offers the places and does not ask for weather yet", async () => {
      const weatherRequests = vi.fn();
      server.use(
        http.get(GEO_URL, () => ok(springfieldResponse)),
        http.get(WEATHER_URL, () => {
          weatherRequests();
          return ok(weatherResponse);
        }),
      );
      const { result } = renderHook(() => useWeather());

      await act(() => result.current.fetchWeather({ country: "US", city: "Springfield" }));

      expect(result.current.places).toHaveLength(2);
      expect(result.current.weather).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(weatherRequests).not.toHaveBeenCalled();
    });

    it("loads the weather of the chosen place and hides the list", async () => {
      let query: URLSearchParams | undefined;
      server.use(
        http.get(GEO_URL, () => ok(springfieldResponse)),
        http.get(WEATHER_URL, ({ request }) => {
          query = new URL(request.url).searchParams;
          return ok({ ...weatherResponse, name: "Springfield" });
        }),
      );
      const { result } = renderHook(() => useWeather());
      await act(() => result.current.fetchWeather({ country: "US", city: "Springfield" }));

      await act(() => result.current.selectPlace(springfieldResponse[1]));

      expect(query?.get("lat")).toBe("42.1");
      expect(query?.get("lon")).toBe("-72.59");
      expect(result.current.weather?.name).toBe("Springfield");
      expect(result.current.places).toEqual([]);
    });

    it("shows an error when loading the chosen place fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      server.use(
        http.get(GEO_URL, () => ok(springfieldResponse)),
        http.get(WEATHER_URL, () => ok({ error: "down" }, 502)),
      );
      const { result } = renderHook(() => useWeather());
      await act(() => result.current.fetchWeather({ country: "US", city: "Springfield" }));

      await act(() => result.current.selectPlace(springfieldResponse[0]));

      expect(result.current.error).toMatch(/An error occurred/);
      expect(result.current.weather).toBeNull();
    });

    it("clears the list when a new search starts", async () => {
      server.use(
        http.get(GEO_URL, ({ request }) =>
          new URL(request.url).searchParams.get("city") === "Springfield"
            ? ok(springfieldResponse)
            : ok([]),
        ),
      );
      const { result } = renderHook(() => useWeather());
      await act(() => result.current.fetchWeather({ country: "US", city: "Springfield" }));
      expect(result.current.places).toHaveLength(2);

      await act(() => result.current.fetchWeather({ country: "US", city: "Nowhere" }));

      expect(result.current.places).toEqual([]);
      expect(result.current.error).toMatch(/No information was found/);
    });
  });

  it("keeps the result of the newest search when an older one answers later", async () => {
    server.use(
      http.get(GEO_URL, async ({ request }) => {
        const city = new URL(request.url).searchParams.get("city");
        if (city === "Slow") {
          await delay(150);
          return ok([{ name: "Slow", country: "CO", lat: 1, lon: 1 }]);
        }
        return ok([{ name: "Fast", country: "CO", lat: 2, lon: 2 }]);
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
