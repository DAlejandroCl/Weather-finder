import { HttpResponse, type JsonBodyType } from "msw";

// The app talks to its own server, which holds the API key.
export const GEO_URL = "/api/geocode";
export const WEATHER_URL = "/api/weather";

export const geoResponse = [{ name: "Bogotá", lat: 4.61, lon: -74.08, country: "CO" }];

/** Two places that share a name, as OpenWeatherMap returns them. */
export const springfieldResponse = [
  { name: "Springfield", state: "Illinois", lat: 39.8, lon: -89.65, country: "US" },
  { name: "Springfield", state: "Massachusetts", lat: 42.1, lon: -72.59, country: "US" },
];

/** A valid OpenWeather response. Sunrise 11:00 UTC and sunset 23:00 UTC, five hours behind UTC. */
export const weatherResponse = {
  name: "Bogotá",
  weather: [{ description: "scattered clouds", icon: "03d" }],
  main: { temp: 17.4, feels_like: 16.9, humidity: 72, pressure: 1020 },
  wind: { speed: 2.1 },
  sys: { country: "CO", sunrise: 1_700_000_000, sunset: 1_700_043_200 },
  timezone: -18_000,
};

/** A JSON response. The app calls its own origin now, so no CORS header is needed. */
export const ok = (body: JsonBodyType, status = 200) => HttpResponse.json(body, { status });
