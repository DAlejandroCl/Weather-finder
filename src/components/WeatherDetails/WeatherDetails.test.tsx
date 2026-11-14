import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { WeatherSchema } from "../../schemas/weatherSchemas";
import { weatherResponse } from "../../test/fixtures";
import WeatherDetails from "./WeatherDetails";

const weather = WeatherSchema.parse(weatherResponse);

describe("WeatherDetails", () => {
  it("shows the place and each measurement", () => {
    render(<WeatherDetails weather={weather} />);

    expect(screen.getByRole("heading", { level: 2, name: "Bogotá, CO" })).toBeInTheDocument();
    expect(screen.getByText("17.4 °C")).toBeInTheDocument();
    expect(screen.getByText("16.9 °C")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByText("2.1 m/s")).toBeInTheDocument();
    expect(screen.getByText("1020 hPa")).toBeInTheDocument();
  });

  it("shows sunrise and sunset in the local time of the city", () => {
    render(<WeatherDetails weather={weather} />);

    // 1,700,000,000 s is 22:13 UTC; five hours behind UTC it is 17:13.
    expect(screen.getByText("17:13")).toBeInTheDocument();
    // Twelve hours later: 05:13 the next day.
    expect(screen.getByText("05:13")).toBeInTheDocument();
  });

  it("describes the icon with the weather description", () => {
    render(<WeatherDetails weather={weather} />);
    expect(screen.getByRole("img", { name: "scattered clouds" })).toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(<WeatherDetails weather={weather} />);
    expect((await axe(container)).violations).toEqual([]);
  });
});
