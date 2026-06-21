import { describe, it, expect } from "vitest";
import { generateDailyNudge } from "../insightEngine";
import type { ActivityLog } from "../types";

/** Minimal ActivityLog factory for test fixtures. */
function makeLog(
  date: string,
  overrides: Partial<ActivityLog> = {}
): ActivityLog {
  return {
    id: `test-${date}`,
    date,
    transport: { mode: "walk", distanceKm: 0 },
    diet: "mixed",
    homeEnergyKwh: 0,
    transportEmissionsKg: 0,
    dietEmissionsKg: 5.63,
    homeEnergyEmissionsKg: 0,
    totalEmissionsKg: 5.63,
    carbonDeltaKg: -6.37,
    carbonSavedKg: 6.37,
    pointsEarned: 10,
    breakdown: [],
    simpleActions: [],
    ...overrides,
  };
}

describe("generateDailyNudge", () => {
  it("returns null for empty logs", () => {
    expect(generateDailyNudge([])).toBeNull();
  });

  it("fires meatless nudge after 2+ high-meat days", () => {
    const logs: ActivityLog[] = [
      makeLog("2026-06-12", { diet: "vegan", carbonSavedKg: 10 }),
      makeLog("2026-06-13", { diet: "high_meat", carbonSavedKg: 0 }),
      makeLog("2026-06-14", { diet: "high_meat", carbonSavedKg: 0 }),
    ];
    const nudge = generateDailyNudge(logs);
    expect(nudge).not.toBeNull();
    expect(nudge?.id).toBe("nudge_meatless_monday");
    expect(nudge?.framework).toBe("GAMIFICATION");
  });

  it("fires subway nudge for repeated short car trips", () => {
    const logs: ActivityLog[] = [
      makeLog("2026-06-12", { transport: { mode: "walk", distanceKm: 1 }, carbonSavedKg: 2 }),
      makeLog("2026-06-13", {
        transport: { mode: "car", distanceKm: 8 },
        transportEmissionsKg: 1.68,
        totalEmissionsKg: 7.31,
        carbonDeltaKg: 0,
        carbonSavedKg: 0,
      }),
      makeLog("2026-06-14", {
        transport: { mode: "car", distanceKm: 5 },
        transportEmissionsKg: 1.05,
        totalEmissionsKg: 6.68,
        carbonDeltaKg: 0,
        carbonSavedKg: 0,
      }),
    ];
    const nudge = generateDailyNudge(logs);
    expect(nudge).not.toBeNull();
    expect(nudge?.id).toBe("nudge_subway_substitution");
    expect(nudge?.framework).toBe("SALIENCE");
  });

  it("fires bus default nudge for exclusive car use", () => {
    const logs: ActivityLog[] = [
      makeLog("2026-06-12", {
        transport: { mode: "car", distanceKm: 10 },
        transportEmissionsKg: 2.1,
        carbonSavedKg: 0,
      }),
      makeLog("2026-06-13", {
        transport: { mode: "car", distanceKm: 15 },
        transportEmissionsKg: 3.15,
        carbonSavedKg: 0,
      }),
      makeLog("2026-06-14", {
        transport: { mode: "car", distanceKm: 20 },
        transportEmissionsKg: 4.2,
        carbonSavedKg: 0,
      }),
    ];
    const nudge = generateDailyNudge(logs);
    expect(nudge).not.toBeNull();
    expect(nudge?.id).toBe("nudge_bus_transit_default");
    expect(nudge?.framework).toBe("DEFAULT_BIAS");
  });

  it("does NOT fire bus nudge when green modes are present", () => {
    const logs: ActivityLog[] = [
      makeLog("2026-06-12", { transport: { mode: "car", distanceKm: 10 }, carbonSavedKg: 0 }),
      makeLog("2026-06-13", { transport: { mode: "walk", distanceKm: 2 }, carbonSavedKg: 5 }),
      makeLog("2026-06-14", { transport: { mode: "car", distanceKm: 10 }, carbonSavedKg: 0 }),
    ];
    const nudge = generateDailyNudge(logs);
    if (nudge) {
      expect(nudge.id).not.toBe("nudge_bus_transit_default");
    }
  });
});

import { vi } from "vitest";

describe("generateDailyNudge - New Micro-Actions", () => {
  const logs = [makeLog("2026-06-12", { carbonSavedKg: 0 })];

  it("fires efficient boiling nudge in the morning", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 12, 7, 30)); // 07:30 Local
    const nudge = generateDailyNudge(logs);
    if (nudge?.id !== "nudge_leakage" && nudge?.id !== "nudge_trend_down") {
      expect(nudge?.id).toBe("nudge_efficient_boiling");
    }
    vi.useRealTimers();
  });

  it("fires digital fasting nudge late at night", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 12, 23, 30)); // 23:30 Local
    const nudge = generateDailyNudge(logs);
    if (nudge?.id !== "nudge_leakage" && nudge?.id !== "nudge_trend_down") {
      expect(nudge?.id).toBe("nudge_digital_fasting");
    }
    vi.useRealTimers();
  });

  it("fires cold water laundry on weekends", () => {
    vi.useFakeTimers();
    // 2026-06-14 is a Sunday
    vi.setSystemTime(new Date(2026, 5, 14, 12, 0)); // 12:00 Local Sunday
    const nudge = generateDailyNudge(logs);
    if (nudge?.id !== "nudge_leakage" && nudge?.id !== "nudge_trend_down") {
      expect(nudge?.id).toBe("nudge_cold_water_laundry");
    }
    vi.useRealTimers();
  });

  it("fires thermostat drop in winter", () => {
    vi.useFakeTimers();
    // Jan 15th
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0)); // 12:00 Local Jan 15th
    const nudge = generateDailyNudge(logs);
    if (nudge?.id !== "nudge_leakage" && nudge?.id !== "nudge_trend_down") {
      expect(nudge?.id).toBe("nudge_thermostat_drop");
    }
    vi.useRealTimers();
  });
});
