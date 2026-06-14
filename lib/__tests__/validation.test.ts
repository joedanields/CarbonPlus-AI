import { describe, it, expect } from "vitest";
import { validateFormValues, clampNumber, isValidTransportMode } from "../validation";
import type { ActivityFormValues } from "../types";

describe("validateFormValues", () => {
  const validValues: ActivityFormValues = {
    transportMode: "car",
    distanceKm: 10,
    diet: "mixed",
    homeEnergyKwh: 5,
  };

  it("returns valid for correct inputs", () => {
    const result = validateFormValues(validValues);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("detects invalid transport mode", () => {
    const values = { ...validValues, transportMode: "spaceship" as any };
    const result = validateFormValues(values);
    expect(result.valid).toBe(false);
    expect(result.errors.transportMode).toBeDefined();
  });

  it("detects negative distance", () => {
    const values = { ...validValues, distanceKm: -1 };
    const result = validateFormValues(values);
    expect(result.valid).toBe(false);
    expect(result.errors.distanceKm).toContain("cannot be negative");
  });

  it("detects excessive distance", () => {
    const values = { ...validValues, distanceKm: 10001 };
    const result = validateFormValues(values);
    expect(result.valid).toBe(false);
    expect(result.errors.distanceKm).toContain("cannot exceed");
  });

  it("detects invalid home energy", () => {
    const values = { ...validValues, homeEnergyKwh: 501 };
    const result = validateFormValues(values);
    expect(result.valid).toBe(false);
    expect(result.errors.homeEnergyKwh).toContain("cannot exceed");
  });
});

describe("Utility guards", () => {
  it("isValidTransportMode correctly identifies modes", () => {
    expect(isValidTransportMode("car")).toBe(true);
    expect(isValidTransportMode("walk")).toBe(true);
    expect(isValidTransportMode("fly")).toBe(false);
    expect(isValidTransportMode(123)).toBe(false);
  });

  it("clampNumber restricts values to range", () => {
    expect(clampNumber(5, 0, 10)).toBe(5);
    expect(clampNumber(-5, 0, 10)).toBe(0);
    expect(clampNumber(15, 0, 10)).toBe(10);
    expect(clampNumber(NaN, 0, 10, 5)).toBe(5);
  });
});
