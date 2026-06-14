import { describe, it, expect } from "vitest";
import { processActivity } from "../activityProcessing";

describe("processActivity", () => {
  const baseline = 12.0;
  const streak = 0;

  it("calculates zero emissions for walking 0km", () => {
    const result = processActivity({
      transport: { mode: "walk", distanceKm: 0 },
      diet: "vegan",
      currentStreak: streak,
      baselineFootprint: baseline,
    });
    expect(result.transportEmissionsKg).toBe(0);
  });

  it("calculates correct emissions for car travel (0.21 kg/km)", () => {
    const result = processActivity({
      transport: { mode: "car", distanceKm: 10 },
      diet: "mixed",
      currentStreak: streak,
      baselineFootprint: baseline,
    });
    expect(result.transportEmissionsKg).toBe(2.1);
  });

  it("calculates correct emissions for vegan diet (2.89 kg/day)", () => {
    const result = processActivity({
      transport: { mode: "walk", distanceKm: 0 },
      diet: "vegan",
      currentStreak: streak,
      baselineFootprint: baseline,
    });
    expect(result.dietEmissionsKg).toBe(2.89);
  });

  it("calculates correct emissions for high-meat diet (7.19 kg/day)", () => {
    const result = processActivity({
      transport: { mode: "walk", distanceKm: 0 },
      diet: "high_meat",
      currentStreak: streak,
      baselineFootprint: baseline,
    });
    expect(result.dietEmissionsKg).toBe(7.19);
  });

  it("awards points for vegan diet and zero-emission transport", () => {
    const result = processActivity({
      transport: { mode: "walk", distanceKm: 0 },
      diet: "vegan",
      currentStreak: streak,
      baselineFootprint: baseline,
    });
    // BASE_LOG (10) + VEGAN_BONUS (25) + ZERO_EMISSION_TRIP (20) = 55
    // Plus below baseline bonus since total (2.89) < 12
    // 55 + BELOW_BASELINE_BONUS (30) = 85
    expect(result.pointsEarned).toBe(85);
  });

  it("applies streak multiplier (capped at 30 days)", () => {
    const result = processActivity({
      transport: { mode: "walk", distanceKm: 0 },
      diet: "mixed",
      currentStreak: 45, // should be capped at 30
      baselineFootprint: baseline,
    });
    // BASE_LOG (10) + ZERO_EMISSION (20) + BELOW_BASELINE (30) + 30 * STREAK_MULT (5) = 60 + 150 = 210
    expect(result.pointsEarned).toBe(210);
  });

  it("handles NaN and negative inputs gracefully", () => {
    const result = processActivity({
      transport: { mode: "car", distanceKm: -10 },
      diet: "mixed",
      currentStreak: -5,
      baselineFootprint: -1,
    });
    expect(result.transportEmissionsKg).toBe(0);
    expect(result.totalEmissionsKg).toBeGreaterThanOrEqual(0);
    expect(result.pointsEarned).toBeGreaterThanOrEqual(0);
  });

  it("correctly generates breakdown percentages", () => {
    const result = processActivity({
      transport: { mode: "car", distanceKm: 10 }, // 2.1
      diet: "vegan", // 2.89
      homeEnergyKwh: 1, // 0.82
      currentStreak: 0,
      baselineFootprint: 12,
    });
    // Total = 2.1 + 2.89 + 0.82 = 5.81
    const total = result.totalEmissionsKg;
    const transportPct = (2.1 / total) * 100;
    const dietPct = (2.89 / total) * 100;
    const energyPct = (0.82 / total) * 100;

    expect(result.breakdown.find(b => b.label === "Transport")?.percentage).toBeCloseTo(transportPct, 4);
    expect(result.breakdown.find(b => b.label === "Diet")?.percentage).toBeCloseTo(dietPct, 4);
    expect(result.breakdown.find(b => b.label === "Home Energy")?.percentage).toBeCloseTo(energyPct, 4);
  });
});
