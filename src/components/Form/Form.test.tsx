import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import Form from "./Form";

describe("Form", () => {
  it("announces a validation message and does not search when the form is empty", async () => {
    const fetchWeather = vi.fn();
    render(<Form fetchWeather={fetchWeather} />);

    await userEvent.click(screen.getByRole("button", { name: "Check weather" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Country is required");
    expect(fetchWeather).not.toHaveBeenCalled();
  });

  it("asks for the city when only the country is chosen", async () => {
    render(<Form fetchWeather={vi.fn()} />);

    await userEvent.selectOptions(screen.getByLabelText("Country:"), "CO");
    await userEvent.click(screen.getByRole("button", { name: "Check weather" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("City is required");
  });

  it("searches with the chosen country and the typed city", async () => {
    const fetchWeather = vi.fn().mockResolvedValue(undefined);
    render(<Form fetchWeather={fetchWeather} />);

    await userEvent.selectOptions(screen.getByLabelText("Country:"), "CO");
    await userEvent.type(screen.getByLabelText("City:"), "Bogotá");
    await userEvent.click(screen.getByRole("button", { name: "Check weather" }));

    expect(fetchWeather).toHaveBeenCalledWith({ country: "CO", city: "Bogotá" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("has no detectable accessibility violations, with and without the alert", async () => {
    const { container } = render(<Form fetchWeather={vi.fn()} />);
    expect((await axe(container)).violations).toEqual([]);

    await userEvent.click(screen.getByRole("button", { name: "Check weather" }));
    await screen.findByRole("alert");
    expect((await axe(container)).violations).toEqual([]);
  });
});
