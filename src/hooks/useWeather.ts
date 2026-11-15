import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { GeoSchema, WeatherSchema } from "../schemas/weatherSchemas";
import type { Place, SearchType, WeatherData } from "../types";

// The API key stays on the server: the browser only talks to these two endpoints.
const GEOCODE_URL = "/api/geocode";
const WEATHER_URL = "/api/weather";

const NOT_FOUND = "No information was found for that city in the selected country.";
const TOO_MANY = "Too many requests. Try again in a moment.";
const FAILED = "An error occurred while checking the weather. Please try again.";

export default function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  // Several places can share a name; when they do, the person chooses one.
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The request in flight, so a newer one (or leaving the page) can cancel it.
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  /** Starts a new task: cancels the previous one and clears what it left on screen. */
  const run = async (task: (signal: AbortSignal) => Promise<void>): Promise<void> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;

    try {
      setLoading(true);
      setError(null);
      setWeather(null);
      setPlaces([]);

      await task(signal);
    } catch (err) {
      // A cancelled request was replaced by a newer one, which owns the state now.
      if (axios.isCancel(err) || signal.aborted) return;

      console.error("Error fetching weather:", err);
      setError(axios.isAxiosError(err) && err.response?.status === 429 ? TOO_MANY : FAILED);
    } finally {
      if (controllerRef.current === controller) setLoading(false);
    }
  };

  const loadWeatherOf = async (place: Place, signal: AbortSignal): Promise<void> => {
    const { data } = await axios.get(WEATHER_URL, {
      params: { lat: place.lat, lon: place.lon },
      signal,
    });

    setWeather(WeatherSchema.parse(data));
  };

  const fetchWeather = (search: SearchType): Promise<void> =>
    run(async (signal) => {
      // axios encodes `params`, so a city such as "Frankfurt & Main" cannot change the query.
      const { data } = await axios.get(GEOCODE_URL, {
        params: { city: search.city, country: search.country },
        signal,
      });

      const found = GeoSchema.parse(data);

      if (found.length === 0) {
        setError(NOT_FOUND);
        return;
      }

      if (found.length === 1) {
        await loadWeatherOf(found[0], signal);
        return;
      }

      setPlaces(found);
    });

  const selectPlace = (place: Place): Promise<void> =>
    run((signal) => loadWeatherOf(place, signal));

  return {
    weather,
    places,
    loading,
    error,
    fetchWeather,
    selectPlace,
  };
}
