import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { springfieldResponse } from "../../test/fixtures";
import PlacePicker from "./PlacePicker";

describe("PlacePicker", () => {
  it("counts the places and lists each with its state and country", () => {
    render(<PlacePicker places={springfieldResponse} onSelect={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "2 places match" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Springfield, Illinois, US/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Springfield, Massachusetts, US/ }),
    ).toBeInTheDocument();
  });

  it("shows the coordinates, so two places without a state can still be told apart", () => {
    render(
      <PlacePicker
        places={[
          { name: "Santa Cruz", country: "BO", lat: -17.78, lon: -63.18 },
          { name: "Santa Cruz", country: "BO", lat: -18.1, lon: -65.2 },
        ]}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Santa Cruz, BO -17.78°, -63.18°" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Santa Cruz, BO -18.10°, -65.20°" })).toBeInTheDocument();
  });

  it("moves focus to the heading when it appears", () => {
    render(<PlacePicker places={springfieldResponse} onSelect={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "2 places match" })).toHaveFocus();
  });

  it("calls onSelect with the chosen place", async () => {
    const onSelect = vi.fn();
    render(<PlacePicker places={springfieldResponse} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: /Massachusetts/ }));

    expect(onSelect).toHaveBeenCalledWith(springfieldResponse[1]);
  });

  it("can be used with the keyboard alone", async () => {
    const onSelect = vi.fn();
    render(<PlacePicker places={springfieldResponse} onSelect={onSelect} />);

    await userEvent.tab();
    expect(screen.getByRole("button", { name: /Illinois/ })).toHaveFocus();
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledWith(springfieldResponse[1]);
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(<PlacePicker places={springfieldResponse} onSelect={vi.fn()} />);
    expect((await axe(container)).violations).toEqual([]);
  });
});
