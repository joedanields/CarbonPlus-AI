/**
 * CarbonPulse AI — Telemetry Processing Service
 *
 * Processes raw daily activity input, calculates kg CO2e, compares against
 * the user's baseline, and returns gamification points for the session.
 *
 * Sourced from DEFRA 2024/2025, EPA, and Scarborough et al. (2014).
 * Zero external dependencies — native TypeScript/JS only.
 */

import type {
  ActivityInput,
  ProcessedActivity,
  BreakdownItem,
  TransportMode,
  DietType,
} from "./types";
import {
  TRANSPORT_FACTORS_KG_KM,
  DIET_FACTORS_KG_DAY,
  DEFAULT_GRID_INTENSITY_KG_KWH,
  POINTS,
} from "./constants";

// ─── Core Processing Function ─────────────────────────────────────────────────

/**
 * Processes a single day's raw activity telemetry.
 *
 * @param input - Raw user-submitted daily activity data
 * @returns A fully typed `ProcessedActivity` result ready for persistence
 */
export function processActivity(input: ActivityInput): ProcessedActivity {
  const {
    transport,
    diet,
    homeEnergyKwh = 0,
    gridIntensityKgPerKwh = DEFAULT_GRID_INTENSITY_KG_KWH,
    currentStreak,
    baselineFootprint,
  } = input;

  // ── 1. Transport emissions ─────────────────────────────────────────────────
  const safeDistanceKm = Math.max(
    0,
    Number.isFinite(transport.distanceKm) ? transport.distanceKm : 0
  );
  const safeHomeEnergyKwh = Math.max(
    0,
    Number.isFinite(homeEnergyKwh) ? homeEnergyKwh : 0
  );
  const safeBaseline = Math.max(
    0,
    Number.isFinite(baselineFootprint) ? baselineFootprint : 0
  );
  const efMode = TRANSPORT_FACTORS_KG_KM[transport.mode] ?? 0.21;
  const transportEmissionsKg = roundTo4(safeDistanceKm * efMode);

  // ── 2. Diet emissions ──────────────────────────────────────────────────────
  const dietEmissionsKg = roundTo4(
    DIET_FACTORS_KG_DAY[diet] ?? DIET_FACTORS_KG_DAY.mixed
  );

  // ── 3. Home energy emissions (E_elec = C_kWh × EF_grid) ───────────────────
  const homeEnergyEmissionsKg = roundTo4(
    safeHomeEnergyKwh * gridIntensityKgPerKwh
  );

  // ── 4. Totals and delta ────────────────────────────────────────────────────
  const totalEmissionsKg = roundTo4(
    transportEmissionsKg + dietEmissionsKg + homeEnergyEmissionsKg
  );
  const carbonDeltaKg = roundTo4(totalEmissionsKg - safeBaseline);
  const carbonSavedKg =
    carbonDeltaKg < 0 ? roundTo4(Math.abs(carbonDeltaKg)) : 0;

  // ── 5. Breakdown for SVG donut chart ──────────────────────────────────────
  const breakdown = buildBreakdown(
    transportEmissionsKg,
    dietEmissionsKg,
    homeEnergyEmissionsKg,
    totalEmissionsKg
  );

  // ── 6. Gamification points ────────────────────────────────────────────────
  const pointsEarned = calculatePoints(
    transport.mode,
    diet,
    carbonDeltaKg,
    currentStreak
  );

  return {
    transportEmissionsKg,
    dietEmissionsKg,
    homeEnergyEmissionsKg,
    totalEmissionsKg,
    carbonDeltaKg,
    carbonSavedKg,
    pointsEarned,
    breakdown,
  };
}

// ─── Gamification Points Calculator ──────────────────────────────────────────

/**
 * Calculates gamification points earned for a single activity log.
 * Rewards green transport, plant-based diets, below-baseline days, and streaks.
 */
function calculatePoints(
  mode: TransportMode,
  diet: DietType,
  carbonDeltaKg: number,
  streak: number
): number {
  let points = POINTS.BASE_LOG;

  // Diet bonus
  if (diet === "vegan") points += POINTS.VEGAN_BONUS;
  else if (diet === "vegetarian") points += POINTS.VEGETARIAN_BONUS;

  // Zero-emission transport bonus
  if (mode === "walk" || mode === "cycle" || mode === "train") {
    points += POINTS.ZERO_EMISSION_TRIP;
  }

  // Below-baseline bonus
  if (carbonDeltaKg < 0) points += POINTS.BELOW_BASELINE_BONUS;

  // Streak multiplier (capped to prevent runaway accumulation; floored at 0 for safety)
  const cappedStreak = Math.min(Math.max(0, streak), POINTS.MAX_STREAK_DAYS);
  points += cappedStreak * POINTS.STREAK_MULTIPLIER;

  return points;
}

// ─── Breakdown Builder ────────────────────────────────────────────────────────

/**
 * Builds the emissions breakdown for the SVG donut chart.
 * Returns zeroed percentages when total is 0 to prevent division by zero.
 */
function buildBreakdown(
  transport: number,
  diet: number,
  energy: number,
  total: number
): BreakdownItem[] {
  if (total === 0) {
    return [
      { label: "Transport", valueKg: 0, percentage: 0 },
      { label: "Diet", valueKg: 0, percentage: 0 },
      { label: "Home Energy", valueKg: 0, percentage: 0 },
    ];
  }

  const pct = (v: number) => roundTo4((v / total) * 100);

  return [
    { label: "Transport", valueKg: transport, percentage: pct(transport) },
    { label: "Diet", valueKg: diet, percentage: pct(diet) },
    { label: "Home Energy", valueKg: energy, percentage: pct(energy) },
  ];
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Rounds a float to 4 decimal places to avoid floating-point drift. */
function roundTo4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
