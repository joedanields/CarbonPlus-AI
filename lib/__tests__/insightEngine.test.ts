import { describe, it, expect } from "vitest";
import { generateDailyNudge } from "../insightEngine";
import type { ActivityLog } from "../types";

describe("generateDailyNudge", () => {
  it("returns null for empty logs", () => {
    expect(generateDailyNudge([])).toBeNull();
  });

  it("fires meatless nudge after 2+ high-meat days", () => {
    const logs = [
      { date: "2026-06-14", transport: { mode: "walk", distanceKm: 0 }, diet: "high_meat", carbonSavedKg: 0 },
      { date: "2026-06-13", transport: { mode: "walk", distanceKm: 0 }, diet: "high_meat", carbonSavedKg: 0 },
      { date: "2026-06-12", transport: { mode: "walk", distanceKm: 0 }, diet: "vegan", carbonSavedKg: 10 },
    ] as ActivityLog[];
    const nudge = generateDailyNudge(logs);
    expect(nudge).not.toBeNull();
    expect(nudge?.id).toEqual(expect.stringContaining("nudge_meatless_monday"));
  });

  it("fires subway nudge for repeated short car trips", () => {
    const logs = [
      { date: "2026-06-14", transport: { mode: "car", distanceKm: 5 }, diet: "mixed", carbonSavedKg: 0 },
      { date: "2026-06-13", transport: { mode: "car", distanceKm: 8 }, diet: "mixed", carbonSavedKg: 0 },
      { date: "2026-06-12", transport: { mode: "walk", distanceKm: 1 }, diet: "mixed", carbonSavedKg: 2 },
    ] as ActivityLog[];
    const nudge = generateDailyNudge(logs);
    expect(nudge).not.toBeNull();
    expect(nudge?.id).toEqual(expect.stringContaining("nudge_subway_substitution"));
  });

  it("fires bus default nudge for exclusive car use", () => {
    const logs = [
      { date: "2026-06-14", transport: { mode: "car", distanceKm: 20 }, diet: "mixed", carbonSavedKg: 0 },
      { date: "2026-06-13", transport: { mode: "car", distanceKm: 15 }, diet: "mixed", carbonSavedKg: 0 },
      { date: "2026-06-12", transport: { mode: "car", distanceKm: 10 }, diet: "mixed", carbonSavedKg: 0 },
    ] as ActivityLog[];
    const nudge = generateDailyNudge(logs);
    expect(nudge).not.toBeNull();
    expect(nudge?.id).toEqual(expect.stringContaining("nudge_bus_transit_default"));
  });

  it("does NOT fire bus nudge when green modes are present", () => {
    const logs = [
      { date: "2026-06-14", transport: { mode: "car", distanceKm: 20 }, diet: "mixed", carbonSavedKg: 0 },
      { date: "2026-06-13", transport: { mode: "walk", distanceKm: 2 }, diet: "mixed", carbonSavedKg: 5 },
      { date: "2026-06-12", transport: { mode: "car", distanceKm: 10 }, diet: "mixed", carbonSavedKg: 0 },
    ] as ActivityLog[];
    const nudge = generateDailyNudge(logs);
    // It might still fire a subway nudge if there are 2 short car trips, but not the bus default one
    if (nudge) {
      expect(nudge.id).not.toBe("nudge_bus_transit_default");
    }
  });
});
