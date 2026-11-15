import { z } from "zod";
import { SearchSchema } from "../schemas/searchSchema";
import { WeatherSchema, GeoSchema, PlaceSchema } from "../schemas/weatherSchemas";

export type SearchType = z.infer<typeof SearchSchema>;
export type WeatherData = z.infer<typeof WeatherSchema>;
export type GeoData = z.infer<typeof GeoSchema>;
export type Place = z.infer<typeof PlaceSchema>;

export type Country = {
  code: string;
  name: string;
};
