// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { geocode, MAX_PLACES, weather, type ApiDeps } from "./openweather";

const KEY = "secret-key-123";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** A fetch that records the URL it was called with. */
function recordingFetch(response: Response) {
  const fetchFn = vi.fn<typeof fetch>(async () => response);
  const calledUrl = () => new URL(String(fetchFn.mock.calls[0][0]));
  return { fetchFn, calledUrl };
}

const params = (init: Record<string, string>) => new URLSearchParams(init);

afterEach(() => vi.restoreAllMocks());

describe("geocode", () => {
  it("asks OpenWeatherMap for up to five places, with the key on the server side", async () => {
    const { fetchFn, calledUrl } = recordingFetch(jsonResponse([{ name: "Bogotá" }]));

    const result = await geocode("GET", params({ city: "Bogotá", country: "CO" }), {
      apiKey: KEY,
      fetchFn,
    });

    expect(result.status).toBe(200);
    expect(result.body).toEqual([{ name: "Bogotá" }]);
    const url = calledUrl();
    expect(url.origin + url.pathname).toBe("https://api.openweathermap.org/geo/1.0/direct");
    expect(url.searchParams.get("q")).toBe("Bogotá,CO");
    expect(url.searchParams.get("limit")).toBe(String(MAX_PLACES));
    expect(url.searchParams.get("appid")).toBe(KEY);
  });

  it("keeps characters such as & and # inside the query", async () => {
    const { fetchFn, calledUrl } = recordingFetch(jsonResponse([]));

    await geocode("GET", params({ city: "A&B#C", country: "DE" }), { apiKey: KEY, fetchFn });

    expect(calledUrl().searchParams.get("q")).toBe("A&B#C,DE");
    expect(calledUrl().hash).toBe("");
  });

  it("trims the city", async () => {
    const { fetchFn, calledUrl } = recordingFetch(jsonResponse([]));

    await geocode("GET", params({ city: "  Lima  ", country: "PE" }), { apiKey: KEY, fetchFn });

    expect(calledUrl().searchParams.get("q")).toBe("Lima,PE");
  });

  it("lets the CDN cache the answer for a day", async () => {
    const { fetchFn } = recordingFetch(jsonResponse([]));

    const result = await geocode("GET", params({ city: "Lima", country: "PE" }), {
      apiKey: KEY,
      fetchFn,
    });

    expect(result.headers["Cache-Control"]).toContain("s-maxage=86400");
  });

  it.each([
    ["a missing city", { country: "CO" }],
    ["a blank city", { city: "   ", country: "CO" }],
    ["a city over 100 characters", { city: "a".repeat(101), country: "CO" }],
    ["a missing country", { city: "Lima" }],
    ["a lowercase country", { city: "Lima", country: "pe" }],
    ["a three-letter country", { city: "Lima", country: "PER" }],
    ["a country with a symbol", { city: "Lima", country: "P&" }],
  ])("answers 400 for %s and does not call OpenWeatherMap", async (_name, query) => {
    const fetchFn = vi.fn<typeof fetch>();

    const result = await geocode("GET", params(query), { apiKey: KEY, fetchFn });

    expect(result.status).toBe(400);
    expect(result.headers["Cache-Control"]).toBe("no-store");
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe("weather", () => {
  it("asks OpenWeatherMap for metric units at the given coordinates", async () => {
    const { fetchFn, calledUrl } = recordingFetch(jsonResponse({ name: "Bogotá" }));

    const result = await weather("GET", params({ lat: "4.61", lon: "-74.08" }), {
      apiKey: KEY,
      fetchFn,
    });

    expect(result.status).toBe(200);
    const url = calledUrl();
    expect(url.origin + url.pathname).toBe("https://api.openweathermap.org/data/2.5/weather");
    expect(url.searchParams.get("lat")).toBe("4.61");
    expect(url.searchParams.get("lon")).toBe("-74.08");
    expect(url.searchParams.get("units")).toBe("metric");
    expect(url.searchParams.get("appid")).toBe(KEY);
    expect(result.headers["Cache-Control"]).toContain("s-maxage=300");
  });

  it.each([
    ["a missing latitude", { lon: "10" }],
    ["a missing longitude", { lat: "10" }],
    ["an empty value", { lat: "", lon: "10" }],
    ["text", { lat: "north", lon: "10" }],
    ["Infinity", { lat: "Infinity", lon: "10" }],
    ["a latitude over 90", { lat: "91", lon: "10" }],
    ["a longitude under -180", { lat: "10", lon: "-181" }],
  ])("answers 400 for %s", async (_name, query) => {
    const fetchFn = vi.fn<typeof fetch>();

    const result = await weather("GET", params(query), { apiKey: KEY, fetchFn });

    expect(result.status).toBe(400);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("accepts the limits of the ranges", async () => {
    const { fetchFn } = recordingFetch(jsonResponse({}));

    const result = await weather("GET", params({ lat: "-90", lon: "180" }), {
      apiKey: KEY,
      fetchFn,
    });

    expect(result.status).toBe(200);
  });
});

describe.each([
  ["geocode", geocode, { city: "Lima", country: "PE" }],
  ["weather", weather, { lat: "1", lon: "1" }],
] as const)("%s, shared rules", (_name, endpoint, validQuery) => {
  const deps = (fetchFn: typeof fetch): ApiDeps => ({ apiKey: KEY, fetchFn });

  it.each(["POST", "PUT", "DELETE", undefined])("answers 405 to %s", async (method) => {
    const fetchFn = vi.fn<typeof fetch>();

    const result = await endpoint(method, params(validQuery), deps(fetchFn));

    expect(result.status).toBe(405);
    expect(result.headers.Allow).toBe("GET");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("answers 500 without leaking anything when the key is not configured", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchFn = vi.fn<typeof fetch>();

    const result = await endpoint("GET", params(validQuery), { apiKey: undefined, fetchFn });

    expect(result.status).toBe(500);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("treats an empty key as not configured", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await endpoint("GET", params(validQuery), { apiKey: "", fetchFn: vi.fn() });

    expect(result.status).toBe(500);
  });

  it("answers 429 with Retry-After when OpenWeatherMap limits the key", async () => {
    const result = await endpoint(
      "GET",
      params(validQuery),
      deps(async () => jsonResponse({ message: "limit" }, 429)),
    );

    expect(result.status).toBe(429);
    expect(result.headers["Retry-After"]).toBe("60");
  });

  it.each([401, 404, 500, 503])(
    "answers 502 and never shows the upstream body or the key when OpenWeatherMap answers %i",
    async (status) => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);

      const result = await endpoint(
        "GET",
        params(validQuery),
        deps(async () => jsonResponse({ cod: status, message: `Invalid API key ${KEY}` }, status)),
      );

      expect(result.status).toBe(502);
      expect(JSON.stringify(result)).not.toContain(KEY);
      expect(JSON.stringify(result)).not.toContain("Invalid API key");
    },
  );

  it("answers 502 when the request fails or times out", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await endpoint(
      "GET",
      params(validQuery),
      deps(async () => {
        throw new DOMException("timed out", "TimeoutError");
      }),
    );

    expect(result.status).toBe(502);
    expect(result.headers["Cache-Control"]).toBe("no-store");
  });

  it("answers 502 when the answer is not JSON", async () => {
    const result = await endpoint(
      "GET",
      params(validQuery),
      deps(async () => new Response("<html>oops</html>", { status: 200 })),
    );

    expect(result.status).toBe(502);
  });
});
