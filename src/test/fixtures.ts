import { HttpResponse, type JsonBodyType } from "msw";

export const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
export const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";

export const geoResponse = [{ name: "Bogotá", lat: 4.61, lon: -74.08, country: "CO" }];

/** A valid OpenWeather response. Sunrise 11:00 UTC and sunset 23:00 UTC, five hours behind UTC. */
export const weatherResponse = {
  name: "Bogotá",
  weather: [{ description: "scattered clouds", icon: "03d" }],
  main: { temp: 17.4, feels_like: 16.9, humidity: 72, pressure: 1020 },
  wind: { speed: 2.1 },
  sys: { country: "CO", sunrise: 1_700_000_000, sunset: 1_700_043_200 },
  timezone: -18_000,
};

/**
 * A JSON response with the CORS header that OpenWeather sends. The tests run in
 * jsdom, whose XMLHttpRequest enforces CORS like a browser does.
 */
export const ok = (body: JsonBodyType) =>
  HttpResponse.json(body, { headers: { "Access-Control-Allow-Origin": "*" } });
