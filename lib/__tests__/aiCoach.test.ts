import { describe, it, expect } from "vitest";
import { buildWeeklyCoachPrompt, CARBON_COACH_SYSTEM_PROMPT } from "../aiCoach";
import type { WeeklyCoachData, DailyLogSummary } from "../types";

/** Factory for a minimal DailyLogSummary test fixture. */
function makeDayLog(
  date: string,
  overrides: Partial<DailyLogSummary> = {}
): DailyLogSummary {
  return {
    date,
    transportEmissionsKg: 2.1,
    dietEmissionsKg: 5.63,
    homeEnergyEmissionsKg: 0.82,
    totalEmissionsKg: 8.55,
    carbonSavedKg: 3.45,
    transport: { mode: "car", distanceKm: 10 },
    diet: "mixed",
    pointsEarned: 40,
    ...overrides,
  };
}

/** Factory for a minimal WeeklyCoachData fixture. */
function makeWeeklyData(
  overrides: Partial<WeeklyCoachData> = {}
): WeeklyCoachData {
  return {
    userId: "test-user",
    weekStartDate: "2026-06-09",
    weekEndDate: "2026-06-15",
    dailyLogs: [
      makeDayLog("2026-06-09"),
      makeDayLog("2026-06-10"),
      makeDayLog("2026-06-11"),
    ],
    weeklyTotals: {
      transportEmissionsKg: 6.3,
      dietEmissionsKg: 16.89,
      homeEnergyEmissionsKg: 2.46,
      totalEmissionsKg: 25.65,
      totalCarbonSavedKg: 10.35,
      totalPointsEarned: 120,
    },
    streak: 5,
    baselineFootprintKgPerDay: 12,
    weeklyBaselineKg: 84,
    ...overrides,
  };
}

// ─── System Prompt Tests ──────────────────────────────────────────────────────

describe("CARBON_COACH_SYSTEM_PROMPT", () => {
  it("is a non-empty string", () => {
    expect(typeof CARBON_COACH_SYSTEM_PROMPT).toBe("string");
    expect(CARBON_COACH_SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it("enforces exactly 3 sentences in the output rules", () => {
    expect(CARBON_COACH_SYSTEM_PROMPT).toContain("EXACTLY 3 sentences");
  });

  it("includes hallucination prevention rules", () => {
    expect(CARBON_COACH_SYSTEM_PROMPT).toContain("HALLUCINATION PREVENTION");
  });

  it("references the PULSE persona", () => {
    expect(CARBON_COACH_SYSTEM_PROMPT).toContain("PULSE");
  });
});

// ─── buildWeeklyCoachPrompt Tests ─────────────────────────────────────────────

describe("buildWeeklyCoachPrompt", () => {
  it("returns an error JSON when dailyLogs is empty", () => {
    const data = makeWeeklyData({ dailyLogs: [] });
    const result = buildWeeklyCoachPrompt(data);
    const parsed = JSON.parse(result) as { error: string; message: string };
    expect(parsed.error).toBe("NO_LOGS");
    expect(parsed.message).toContain("No activity logs");
  });

  it("includes the analyse instruction prefix for valid data", () => {
    const data = makeWeeklyData();
    const result = buildWeeklyCoachPrompt(data);
    expect(result).toContain("Analyse this weekly carbon footprint JSON");
  });

  it("includes period, streak, and weeklyTotals in the payload", () => {
    const data = makeWeeklyData();
    const result = buildWeeklyCoachPrompt(data);
    expect(result).toContain('"period"');
    expect(result).toContain('"streak"');
    expect(result).toContain('"weeklyTotals"');
  });

  it("correctly identifies the worst emission category", () => {
    const data = makeWeeklyData({
      weeklyTotals: {
        transportEmissionsKg: 50,
        dietEmissionsKg: 10,
        homeEnergyEmissionsKg: 5,
        totalEmissionsKg: 65,
        totalCarbonSavedKg: 0,
        totalPointsEarned: 100,
      },
    });
    const result = buildWeeklyCoachPrompt(data);
    expect(result).toContain('"transport"');
    // The worst category should be transport at 50kg
    const jsonPart = result.split("\n\n")[1] as string;
    const parsed = JSON.parse(jsonPart) as { worstEmissionCategory: { label: string; kg: number } };
    expect(parsed.worstEmissionCategory.label).toBe("transport");
    expect(parsed.worstEmissionCategory.kg).toBe(50);
  });

  it("correctly calculates baselineDeltaKg", () => {
    const data = makeWeeklyData({
      weeklyTotals: {
        transportEmissionsKg: 10,
        dietEmissionsKg: 10,
        homeEnergyEmissionsKg: 5,
        totalEmissionsKg: 25,
        totalCarbonSavedKg: 59,
        totalPointsEarned: 200,
      },
      weeklyBaselineKg: 84,
    });
    const result = buildWeeklyCoachPrompt(data);
    const jsonPart = result.split("\n\n")[1] as string;
    const parsed = JSON.parse(jsonPart) as { baselineDeltaKg: number };
    // 25 - 84 = -59
    expect(parsed.baselineDeltaKg).toBe(-59);
  });

  it("includes daily summary with transport mode and diet", () => {
    const data = makeWeeklyData({
      dailyLogs: [
        makeDayLog("2026-06-09", { transport: { mode: "walk", distanceKm: 2 }, diet: "vegan" }),
      ],
    });
    const result = buildWeeklyCoachPrompt(data);
    expect(result).toContain('"transportMode":"walk"');
    expect(result).toContain('"diet":"vegan"');
  });

  it("handles a single-day log without crashing", () => {
    const data = makeWeeklyData({
      dailyLogs: [makeDayLog("2026-06-09")],
    });
    expect(() => buildWeeklyCoachPrompt(data)).not.toThrow();
    const result = buildWeeklyCoachPrompt(data);
    expect(result).toContain('"daysLogged":1');
  });

  it("handles zero-emission data without crashing", () => {
    const data = makeWeeklyData({
      dailyLogs: [
        makeDayLog("2026-06-09", {
          transportEmissionsKg: 0,
          dietEmissionsKg: 0,
          homeEnergyEmissionsKg: 0,
          totalEmissionsKg: 0,
          carbonSavedKg: 12,
          pointsEarned: 100,
        }),
      ],
      weeklyTotals: {
        transportEmissionsKg: 0,
        dietEmissionsKg: 0,
        homeEnergyEmissionsKg: 0,
        totalEmissionsKg: 0,
        totalCarbonSavedKg: 12,
        totalPointsEarned: 100,
      },
    });
    expect(() => buildWeeklyCoachPrompt(data)).not.toThrow();
  });
});
