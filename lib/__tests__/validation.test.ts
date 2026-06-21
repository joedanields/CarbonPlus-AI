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
    // @ts-expect-error — intentionally passing an invalid mode to test the validator
    const values: ActivityFormValues = { ...validValues, transportMode: "spaceship" };
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

import { sanitizeTransportMode, sanitizeDietType, validateStoredLogs, validateStoredSettings } from "../validation";

describe("Sanitization", () => {
  it("sanitizeTransportMode", () => {
    expect(sanitizeTransportMode("car")).toBe("car");
    expect(sanitizeTransportMode("invalid")).toBe("walk");
  });
  it("sanitizeDietType", () => {
    expect(sanitizeDietType("vegan")).toBe("vegan");
    expect(sanitizeDietType("invalid")).toBe("mixed");
  });
});

describe("validateStoredLogs", () => {
  it("returns empty array for invalid input", () => {
    expect(validateStoredLogs(null, 10)).toEqual([]);
    expect(validateStoredLogs("string", 10)).toEqual([]);
  });

  it("filters out invalid entries", () => {
    const data = [
      { id: "1", date: "invalid-date", transport: { mode: "car", distanceKm: 10 }, diet: "vegan" }, // invalid date
      { id: "2", date: "2026-06-09T00:00:00Z", transport: { mode: "invalid", distanceKm: 10 }, diet: "vegan" }, // invalid mode
      { id: "3", date: "2026-06-09T00:00:00Z", transport: { mode: "car", distanceKm: "10" }, diet: "vegan" }, // invalid distance
      { id: "4", date: "2026-06-09T00:00:00Z", transport: null, diet: "vegan" }, // no transport
      { id: "5", date: "2026-06-09T00:00:00Z", transport: { mode: "car", distanceKm: 10 }, diet: "invalid" }, // invalid diet
      { id: "6", date: "2026-06-09T00:00:00Z", transport: { mode: "car", distanceKm: 10 }, diet: "vegan" }, // VALID
      null,
      "not an object"
    ];
    const result = validateStoredLogs(data, 10);
    expect(result.length).toBe(1);
    expect(result[0]?.id).toBe("6");
  });

  it("caps at maxEntries", () => {
    const data = [
      { id: "1", date: "2026-06-09T00:00:00Z", transport: { mode: "car", distanceKm: 10 }, diet: "vegan" },
      { id: "2", date: "2026-06-09T00:00:00Z", transport: { mode: "car", distanceKm: 10 }, diet: "vegan" },
    ];
    const result = validateStoredLogs(data, 1);
    expect(result.length).toBe(1);
    expect(result[0]?.id).toBe("2");
  });
});

describe("validateStoredSettings", () => {
  it("returns defaults for malformed data", () => {
    const result = validateStoredSettings(null);
    expect(result.persona).toBe("pragmatic");
    expect(result.onboardingCompleted).toBe(false);
  });

  it("clamps target weights", () => {
    const data = {
      dailyTargetKg: -100,
      weeklyTargetKg: 100000,
      persona: "analytical",
      onboardingCompleted: true,
      missionState: {
        activeMissionId: null,
        startedAt: null,
        completedMissionIds: []
      },
      unlockedBadges: []
    };
    const result = validateStoredSettings(data);
    expect(result.dailyTargetKg).toBe(1); // INPUT_LIMITS.DAILY_TARGET_KG_MIN
    expect(result.weeklyTargetKg).toBe(700); // INPUT_LIMITS.DAILY_TARGET_KG_MAX * 7
    expect(result.persona).toBe("analytical");
    expect(result.onboardingCompleted).toBe(true);
  });
});
