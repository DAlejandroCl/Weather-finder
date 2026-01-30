import { z } from "zod";

export const GeoSchema = z.array(
  z.object({
    lat: z.number(),
    lon: z.number(),
  })
);

export type GeoType = z.infer<typeof GeoSchema>;

export const WeatherSchema = z.object({
  name: z.string(),

  weather: z.array(
    z.object({
      description: z.string(),
      icon: z.string(),
    })
  ),

  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    humidity: z.number(),
    pressure: z.number(),
  }),

  wind: z.object({
    speed: z.number(),
  }),

  sys: z.object({
    country: z.string(),
    sunrise: z.number(),
    sunset: z.number(),
  }),
});

export type WeatherType = z.infer<typeof WeatherSchema>;