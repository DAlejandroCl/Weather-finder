import { describe, expect, it } from "vitest";
import { SearchSchema } from "./searchSchema";
import { GeoSchema, WeatherSchema } from "./weatherSchemas";
import { geoResponse, weatherResponse } from "../test/fixtures";

describe("SearchSchema", () => {
  it("accepts a country and a city", () => {
    expect(SearchSchema.safeParse({ country: "CO", city: "Bogotá" }).success).toBe(true);
  });

  it("asks for the country first when both are empty", () => {
    const result = SearchSchema.safeParse({ country: "", city: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Country is required");
  });

  it("asks for the city when only it is missing", () => {
    const result = SearchSchema.safeParse({ country: "CO", city: "" });
    expect(result.error?.issues[0].message).toBe("City is required");
  });
});

describe("GeoSchema", () => {
  it("accepts a list of places and an empty list", () => {
    expect(GeoSchema.safeParse(geoResponse).success).toBe(true);
    expect(GeoSchema.safeParse([]).success).toBe(true);
  });

  it("rejects a place whose coordinates are not numbers", () => {
    expect(GeoSchema.safeParse([{ lat: "4.6", lon: -74 }]).success).toBe(false);
  });
});

describe("WeatherSchema", () => {
  it("accepts a complete response", () => {
    expect(WeatherSchema.safeParse(weatherResponse).success).toBe(true);
  });

  it.each(["name", "weather", "main", "wind", "sys", "timezone"] as const)(
    "rejects a response without %s",
    (field) => {
      const incomplete: Record<string, unknown> = { ...weatherResponse };
      delete incomplete[field];
      expect(WeatherSchema.safeParse(incomplete).success).toBe(false);
    },
  );

  it("rejects a temperature that is a string", () => {
    const wrong = { ...weatherResponse, main: { ...weatherResponse.main, temp: "17" } };
    expect(WeatherSchema.safeParse(wrong).success).toBe(false);
  });
});
