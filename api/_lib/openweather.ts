/**
 * The server side of Weather Finder: two small endpoints that call OpenWeatherMap with the
 * API key, so the key never reaches the browser. The logic does not depend on any server
 * framework: it takes the request method and query and returns a status, headers and body.
 */

export type ApiResult = {
  status: number;
  headers: Record<string, string>;
  body: unknown;
};

export type ApiDeps = {
  /** The OpenWeatherMap key, read from the server environment. */
  apiKey: string | undefined;
  /** Replaceable in tests. */
  fetchFn?: typeof fetch;
};

const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";

/** How many places the geocoding request may return for one search. */
export const MAX_PLACES = 5;
const UPSTREAM_TIMEOUT_MS = 8000;
const MAX_CITY_LENGTH = 100;

const BASE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

const fail = (status: number, error: string, extra: Record<string, string> = {}): ApiResult => ({
  status,
  headers: { ...BASE_HEADERS, "Cache-Control": "no-store", ...extra },
  body: { error },
});

const succeed = (body: unknown, cacheSeconds: number): ApiResult => ({
  status: 200,
  headers: {
    ...BASE_HEADERS,
    // The CDN may answer repeated searches itself, which also spares the key's quota.
    "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}`,
  },
  body,
});

/** Calls OpenWeatherMap and turns every failure into an error that says nothing about the upstream. */
async function callUpstream(
  url: URL,
  deps: ApiDeps,
  cacheSeconds: number,
): Promise<ApiResult> {
  const doFetch = deps.fetchFn ?? fetch;

  let response: Response;
  try {
    response = await doFetch(url, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  } catch (err) {
    console.error("OpenWeatherMap request failed:", err instanceof Error ? err.name : "unknown");
    return fail(502, "The weather service is not available right now.");
  }

  if (response.status === 429) {
    return fail(429, "Too many requests. Try again in a moment.", { "Retry-After": "60" });
  }
  if (!response.ok) {
    // 401 means the key is wrong; it is logged here, never sent to the browser.
    console.error("OpenWeatherMap answered with status", response.status);
    return fail(502, "The weather service is not available right now.");
  }

  try {
    return succeed(await response.json(), cacheSeconds);
  } catch {
    return fail(502, "The weather service is not available right now.");
  }
}

function checkRequest(method: string | undefined, deps: ApiDeps): ApiResult | null {
  if (method !== "GET") return fail(405, "Method not allowed.", { Allow: "GET" });
  if (!deps.apiKey) {
    console.error("OPENWEATHER_API_KEY is not set");
    return fail(500, "The server is not configured.");
  }
  return null;
}

/** GET /api/geocode?city=Bogotá&country=CO */
export async function geocode(
  method: string | undefined,
  query: URLSearchParams,
  deps: ApiDeps,
): Promise<ApiResult> {
  const rejected = checkRequest(method, deps);
  if (rejected) return rejected;

  const city = (query.get("city") ?? "").trim();
  const country = query.get("country") ?? "";

  if (city === "" || city.length > MAX_CITY_LENGTH) {
    return fail(400, `city is required and at most ${MAX_CITY_LENGTH} characters.`);
  }
  if (!/^[A-Z]{2}$/.test(country)) {
    return fail(400, "country must be a two-letter ISO code in capitals.");
  }

  const url = new URL(GEO_URL);
  url.searchParams.set("q", `${city},${country}`);
  url.searchParams.set("limit", String(MAX_PLACES));
  url.searchParams.set("appid", deps.apiKey as string);

  return callUpstream(url, deps, 86_400);
}

/** GET /api/weather?lat=4.61&lon=-74.08 */
export async function weather(
  method: string | undefined,
  query: URLSearchParams,
  deps: ApiDeps,
): Promise<ApiResult> {
  const rejected = checkRequest(method, deps);
  if (rejected) return rejected;

  const lat = parseCoordinate(query.get("lat"), 90);
  const lon = parseCoordinate(query.get("lon"), 180);
  if (lat === null || lon === null) {
    return fail(400, "lat must be between -90 and 90 and lon between -180 and 180.");
  }

  const url = new URL(WEATHER_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("units", "metric");
  url.searchParams.set("appid", deps.apiKey as string);

  return callUpstream(url, deps, 300);
}

function parseCoordinate(value: string | null, limit: number): number | null {
  if (value === null || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}
