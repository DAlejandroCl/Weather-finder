import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { GeoSchema, WeatherSchema } from "../schemas/weatherSchemas";
import type { SearchType, WeatherData } from "../types";

const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";

export default function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The search in flight, so a newer search (or leaving the page) can cancel it.
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const fetchWeather = async (search: SearchType): Promise<void> => {
    const appID = import.meta.env.VITE_OPENWEATHER_API_KEY;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;

    try {
      setLoading(true);
      setError(null);
      setWeather(null);

      // axios encodes `params`, so a city such as "Frankfurt & Main" or "São Paulo"
      // cannot change the query string.
      const { data: geoRaw } = await axios.get(GEO_URL, {
        params: { q: `${search.city},${search.country}`, appid: appID },
        signal,
      });

      const geo = GeoSchema.parse(geoRaw);

      if (geo.length === 0) {
        setError("No information was found for that city in the selected country.");
        return;
      }

      const { lat, lon } = geo[0];

      const { data: weatherRaw } = await axios.get(WEATHER_URL, {
        params: { lat, lon, appid: appID, units: "metric" },
        signal,
      });

      setWeather(WeatherSchema.parse(weatherRaw));
    } catch (err) {
      // A cancelled search was replaced by a newer one, which owns the state now.
      if (axios.isCancel(err) || signal.aborted) return;

      console.error("Error fetching weather:", err);
      setError("An error occurred while checking the weather. Please try again.");
    } finally {
      if (controllerRef.current === controller) setLoading(false);
    }
  };

  return {
    weather,
    loading,
    error,
    fetchWeather,
  };
}
