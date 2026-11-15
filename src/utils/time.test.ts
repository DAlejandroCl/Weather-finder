import { describe, expect, it } from "vitest";
import { formatLocalTime } from "./time";

describe("formatLocalTime", () => {
  it("shows UTC when the offset is zero", () => {
    expect(formatLocalTime(0, 0)).toBe("00:00");
  });

  it("adds a positive offset", () => {
    expect(formatLocalTime(0, 3600)).toBe("01:00");
  });

  it("subtracts a negative offset and crosses midnight", () => {
    expect(formatLocalTime(3600, -18_000)).toBe("20:00");
  });

  it("keeps the minutes", () => {
    expect(formatLocalTime(45 * 60, 0)).toBe("00:45");
  });
});
