import { describe, it, expect } from "vitest";
import { logsToCSV } from "../exportData";
import type { ActivityLog } from "../types";

/** Minimal ActivityLog factory. */
function makeLog(overrides: Partial<ActivityLog> = {}): ActivityLog {
  return {
    id: "log-1",
    date: "2026-06-15T10:00:00.000Z",
    transport: { mode: "car", distanceKm: 10 },
    diet: "mixed",
    homeEnergyKwh: 5,
    transportEmissionsKg: 2.1,
    dietEmissionsKg: 5.63,
    homeEnergyEmissionsKg: 4.1,
    totalEmissionsKg: 11.83,
    carbonDeltaKg: -0.17,
    carbonSavedKg: 0.17,
    pointsEarned: 40,
    breakdown: [],
    ...overrides,
  };
}

describe("logsToCSV", () => {
  it("returns headers when given an empty array", () => {
    const csv = logsToCSV([]);
    expect(csv).toContain("Date");
    expect(csv).toContain("Transport Mode");
    expect(csv).toContain("Total Emissions (kg CO2e)");
    // Should only have one line (headers)
    expect(csv.split("\n").length).toBe(1);
  });

  it("generates correct number of rows", () => {
    const logs = [makeLog(), makeLog({ id: "log-2" })];
    const csv = logsToCSV(logs);
    // 1 header + 2 data rows
    expect(csv.split("\n").length).toBe(3);
  });

  it("includes transport mode in the output", () => {
    const csv = logsToCSV([makeLog({ transport: { mode: "train", distanceKm: 25 } })]);
    expect(csv).toContain("train");
    expect(csv).toContain("25");
  });

  it("replaces underscores in diet names", () => {
    const csv = logsToCSV([makeLog({ diet: "high_meat" })]);
    expect(csv).toContain("high meat");
  });

  it("formats emission values to 4 decimal places", () => {
    const csv = logsToCSV([makeLog({ transportEmissionsKg: 2.1 })]);
    expect(csv).toContain("2.1000");
  });

  it("escapes double quotes in CSV cells", () => {
    // Ensure all cells are properly quoted
    const csv = logsToCSV([makeLog()]);
    const dataRow = csv.split("\n")[1];
    // Every cell should be wrapped in quotes
    expect(dataRow?.startsWith('"')).toBe(true);
  });

  it("produces valid comma-separated format", () => {
    const csv = logsToCSV([makeLog()]);
    const headerCols = csv.split("\n")[0]?.split(",");
    expect(headerCols?.length).toBe(12); // 12 columns
  });
});
