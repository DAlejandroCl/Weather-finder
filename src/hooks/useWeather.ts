import axios from "axios";
import { GeoSchema, WeatherSchema } from "../schemas/weatherSchemas";
import type { SearchType, WeatherData } from "../types";
import { useState } from "react";

export default function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (search: SearchType): Promise<void> => {
    const appID = import.meta.env.VITE_OPENWEATHER_API_KEY;

    try {
      setLoading(true);
      setError(null);
      setWeather(null);

      const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${search.city},${search.country}&appid=${appID}`;
      const { data: geoRaw } = await axios.get(geoUrl);

      const geo = GeoSchema.parse(geoRaw);

      if (geo.length === 0) {
        setError("No information was found for that city in the selected country.");
        return;
      }

      const { lat, lon } = geo[0];

      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${appID}&units=metric`;
      const { data: weatherRaw } = await axios.get(weatherUrl);

      const weather = WeatherSchema.parse(weatherRaw);
      setWeather(weather);

    } catch (err) {
      console.error("Error fetching weather:", err);
      setError("An error occurred while checking the weather. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    weather,
    loading,
    error,
    fetchWeather,
  };
}
