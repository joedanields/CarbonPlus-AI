import { describe, it, expect } from "vitest";
import { generateDailyNudge } from "../insightEngine";
import type { RecentLog } from "../types";

describe("generateDailyNudge", () => {
  it("returns null for empty logs", () => {
    expect(generateDailyNudge([])).toBeNull();
  });

  it("fires meatless nudge after 2+ high-meat days", () => {
    const logs: RecentLog[] = [
      { date: "2026-06-14", transport: { mode: "walk", distanceKm: 0 }, diet: "high_meat", totalCarbonSaved: 0 },
      { date: "2026-06-13", transport: { mode: "walk", distanceKm: 0 }, diet: "high_meat", totalCarbonSaved: 0 },
      { date: "2026-06-12", transport: { mode: "walk", distanceKm: 0 }, diet: "vegan", totalCarbonSaved: 10 },
    ];
    const nudge = generateDailyNudge(logs);
    expect(nudge).not.toBeNull();
    expect(nudge?.id).toBe("nudge_meatless_monday");
    expect(nudge?.framework).toBe("GAMIFICATION");
  });

  it("fires subway nudge for repeated short car trips", () => {
    const logs: RecentLog[] = [
      { date: "2026-06-14", transport: { mode: "car", distanceKm: 5 }, diet: "mixed", totalCarbonSaved: 0 },
      { date: "2026-06-13", transport: { mode: "car", distanceKm: 8 }, diet: "mixed", totalCarbonSaved: 0 },
      { date: "2026-06-12", transport: { mode: "walk", distanceKm: 1 }, diet: "mixed", totalCarbonSaved: 2 },
    ];
    const nudge = generateDailyNudge(logs);
    expect(nudge).not.toBeNull();
    expect(nudge?.id).toBe("nudge_subway_substitution");
    expect(nudge?.framework).toBe("SALIENCE");
  });

  it("fires bus default nudge for exclusive car use", () => {
    const logs: RecentLog[] = [
      { date: "2026-06-14", transport: { mode: "car", distanceKm: 20 }, diet: "mixed", totalCarbonSaved: 0 },
      { date: "2026-06-13", transport: { mode: "car", distanceKm: 15 }, diet: "mixed", totalCarbonSaved: 0 },
      { date: "2026-06-12", transport: { mode: "car", distanceKm: 10 }, diet: "mixed", totalCarbonSaved: 0 },
    ];
    const nudge = generateDailyNudge(logs);
    expect(nudge).not.toBeNull();
    expect(nudge?.id).toBe("nudge_bus_transit_default");
    expect(nudge?.framework).toBe("DEFAULT_BIAS");
  });

  it("does NOT fire bus nudge when green modes are present", () => {
    const logs: RecentLog[] = [
      { date: "2026-06-14", transport: { mode: "car", distanceKm: 20 }, diet: "mixed", totalCarbonSaved: 0 },
      { date: "2026-06-13", transport: { mode: "walk", distanceKm: 2 }, diet: "mixed", totalCarbonSaved: 5 },
      { date: "2026-06-12", transport: { mode: "car", distanceKm: 10 }, diet: "mixed", totalCarbonSaved: 0 },
    ];
    const nudge = generateDailyNudge(logs);
    // It might still fire a subway nudge if there are 2 short car trips, but not the bus default one
    if (nudge) {
      expect(nudge.id).not.toBe("nudge_bus_transit_default");
    }
  });
});
