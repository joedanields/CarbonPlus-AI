import { describe, it, expect } from "vitest";
import { getRelatableEquivalency } from "../equivalencies";

describe("getRelatableEquivalency", () => {
  // ─── Zero case ────────────────────────────────────────────────────────────
  it("returns 'Zero carbon impact!' for 0 kg", () => {
    expect(getRelatableEquivalency(0)).toBe("Zero carbon impact!");
  });

  // ─── Small values (< 1 kg) → smartphone charges ──────────────────────────
  it("returns smartphone charges for values under 1 kg", () => {
    const result = getRelatableEquivalency(0.5);
    expect(result).toContain("smartphone charges");
    // 0.5 * 30 = 15
    expect(result).toContain("15");
  });

  it("returns smartphone charges for very small values", () => {
    const result = getRelatableEquivalency(0.1);
    expect(result).toContain("smartphone charges");
    // 0.1 * 30 = 3
    expect(result).toContain("3");
  });

  // ─── Medium values (1–10 kg) → car km ────────────────────────────────────
  it("returns car km for values between 1 and 10 kg", () => {
    const result = getRelatableEquivalency(5);
    expect(result).toContain("km driven in a petrol car");
    // 5 * 5 = 25
    expect(result).toContain("25");
  });

  it("returns car km at the 1 kg boundary", () => {
    const result = getRelatableEquivalency(1);
    expect(result).toContain("km driven in a petrol car");
  });

  // ─── Large values (10–50 kg) → paper sheets ──────────────────────────────
  it("returns paper sheets for values between 10 and 50 kg", () => {
    const result = getRelatableEquivalency(20);
    expect(result).toContain("A4 paper sheets");
    // 20 * 100 = 2000
    expect(result).toContain("2000");
  });

  it("returns paper sheets at the 10 kg boundary", () => {
    const result = getRelatableEquivalency(10);
    expect(result).toContain("A4 paper sheets");
  });

  // ─── Very large values (>= 50 kg) → forest m² ────────────────────────────
  it("returns forest absorption for values >= 50 kg", () => {
    const result = getRelatableEquivalency(100);
    expect(result).toContain("m² of forest absorption/year");
    // 100 * 0.4 = 40.0
    expect(result).toContain("40.0");
  });

  it("returns forest absorption at the 50 kg boundary", () => {
    const result = getRelatableEquivalency(50);
    expect(result).toContain("m² of forest absorption/year");
  });

  // ─── Negative values (carbon saved) ───────────────────────────────────────
  it("handles negative values by using absolute value", () => {
    const positiveResult = getRelatableEquivalency(5);
    const negativeResult = getRelatableEquivalency(-5);
    expect(negativeResult).toBe(positiveResult);
  });

  // ─── Boundary precision ───────────────────────────────────────────────────
  it("rounds smartphone charges to whole numbers", () => {
    // 0.33 * 30 = 9.9, should round to 10
    const result = getRelatableEquivalency(0.33);
    expect(result).toContain("10");
  });

  it("rounds car km to whole numbers", () => {
    // 3.3 * 5 = 16.5, should round to 17
    const result = getRelatableEquivalency(3.3);
    expect(result).toContain("17");
  });
});
