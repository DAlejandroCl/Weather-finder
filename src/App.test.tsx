import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http } from "msw";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { server } from "./test/server";
import { GEO_URL, WEATHER_URL, geoResponse, ok, weatherResponse } from "./test/fixtures";

async function search(city: string) {
  await userEvent.selectOptions(screen.getByLabelText("Country:"), "CO");
  await userEvent.type(screen.getByLabelText("City:"), city);
  await userEvent.click(screen.getByRole("button", { name: "Check weather" }));
}

describe("App", () => {
  it("searches for a city and shows its weather card", async () => {
    server.use(
      http.get(GEO_URL, () => ok(geoResponse)),
      http.get(WEATHER_URL, () => ok(weatherResponse)),
    );
    const { container } = render(<App />);

    await search("Bogotá");

    expect(await screen.findByRole("heading", { level: 2, name: "Bogotá, CO" })).toBeInTheDocument();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("shows an announced alert when the city is not found", async () => {
    server.use(http.get(GEO_URL, () => ok([])));
    const { container } = render(<App />);

    await search("Nowhere");

    expect(await screen.findByRole("alert")).toHaveTextContent("No information was found");
    expect((await axe(container)).violations).toEqual([]);
  });

  it("shows an announced alert when the request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    server.use(http.get(GEO_URL, () => ok({ message: "wrong" })));
    render(<App />);

    await search("Bogotá");

    expect(await screen.findByRole("alert")).toHaveTextContent("An error occurred");
  });
});
