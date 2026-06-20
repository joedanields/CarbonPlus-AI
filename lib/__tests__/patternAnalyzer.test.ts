import { describe, it, expect } from "vitest";
import { analyzeCarbonTrends } from "../patternAnalyzer";
import type { ActivityLog } from "../types";

/** Minimal ActivityLog factory. */
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
    transportEmissionsKg: 1,
    dietEmissionsKg: 5,
    homeEnergyEmissionsKg: 1,
    totalEmissionsKg: 7,
    carbonDeltaKg: -5,
    carbonSavedKg: 5,
    pointsEarned: 10,
    breakdown: [],
    ...overrides,
  };
}

describe("analyzeCarbonTrends", () => {
  it("returns default values when fewer than 14 logs exist", () => {
    const logs = Array.from({ length: 10 }, (_, i) =>
      makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`)
    );
    const result = analyzeCarbonTrends(logs);
    expect(result.velocity).toBe(0);
    expect(result.isImproving).toBe(false);
    expect(result.leakageDetected).toBe(false);
    expect(result.leakageMessage).toBeNull();
  });

  it("returns zero velocity when exactly 13 logs exist", () => {
    const logs = Array.from({ length: 13 }, (_, i) =>
      makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`)
    );
    const result = analyzeCarbonTrends(logs);
    expect(result.velocity).toBe(0);
  });

  it("detects improving trend when last 7 days emit less than previous 7", () => {
    const prev7 = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`, { totalEmissionsKg: 10 })
    );
    const last7 = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-06-${String(i + 8).padStart(2, "0")}`, { totalEmissionsKg: 5 })
    );
    const result = analyzeCarbonTrends([...prev7, ...last7]);
    expect(result.velocity).toBeLessThan(0);
    expect(result.isImproving).toBe(true);
  });

  it("detects worsening trend when last 7 days emit more", () => {
    const prev7 = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`, { totalEmissionsKg: 5 })
    );
    const last7 = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-06-${String(i + 8).padStart(2, "0")}`, { totalEmissionsKg: 10 })
    );
    const result = analyzeCarbonTrends([...prev7, ...last7]);
    expect(result.velocity).toBeGreaterThan(0);
    expect(result.isImproving).toBe(false);
  });

  it("reports zero velocity when emissions are stable", () => {
    const logs = Array.from({ length: 14 }, (_, i) =>
      makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`, { totalEmissionsKg: 7 })
    );
    const result = analyzeCarbonTrends(logs);
    expect(result.velocity).toBe(0);
  });

  it("detects carbon leakage: transport down + diet up", () => {
    const prev7 = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`, {
        transportEmissionsKg: 5,
        dietEmissionsKg: 3,
        totalEmissionsKg: 8,
      })
    );
    const last7 = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-06-${String(i + 8).padStart(2, "0")}`, {
        transportEmissionsKg: 2, // dropped > 20%
        dietEmissionsKg: 6,      // rose > 20%
        totalEmissionsKg: 8,
      })
    );
    const result = analyzeCarbonTrends([...prev7, ...last7]);
    expect(result.leakageDetected).toBe(true);
    expect(result.leakageMessage).toContain("diet emissions");
  });

  it("does NOT detect leakage when categories move in the same direction", () => {
    const prev7 = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`, {
        transportEmissionsKg: 5,
        dietEmissionsKg: 5,
        totalEmissionsKg: 10,
      })
    );
    const last7 = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-06-${String(i + 8).padStart(2, "0")}`, {
        transportEmissionsKg: 3,
        dietEmissionsKg: 3,
        totalEmissionsKg: 6,
      })
    );
    const result = analyzeCarbonTrends([...prev7, ...last7]);
    expect(result.leakageDetected).toBe(false);
  });

  it("calculates correct velocity percentage", () => {
    const prev7 = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`, { totalEmissionsKg: 10 })
    );
    const last7 = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-06-${String(i + 8).padStart(2, "0")}`, { totalEmissionsKg: 5 })
    );
    const result = analyzeCarbonTrends([...prev7, ...last7]);
    // (5 - 10) / 10 * 100 = -50%
    expect(result.velocity).toBe(-50);
  });
});
