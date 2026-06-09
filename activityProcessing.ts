/**
 * CarbonPulse AI — Telemetry Processing Service
 * Processes raw daily activity input, calculates kg CO2e, compares against
 * the user's baseline, and returns gamification points for the session.
 *
 * Sourced from DEFRA 2024/2025, EPA, and Scarborough et al. (2014).
 * Zero external dependencies — native TypeScript/JS only.
 */

// ─── Emission Factor Constants ────────────────────────────────────────────────

/** kg CO2e per km (includes Tank-to-Wheel + Well-to-Tank) */
const TRANSPORT_FACTORS_KG_KM: Record<string, number> = {
  walk:  0.00,
  cycle: 0.00,
  car:   0.21, // Average petrol/diesel — DEFRA 2024/2025
  bus:   0.13, // Post-COVID occupancy-adjusted — DEFRA 2024/2025
  train: 0.02, // Electrified metro/light rail — DEFRA 2024/2025
  bike:  0.00, // Motorbike — treated as 0 here; override if needed
} as const;

/** kg CO2e per day — Scarborough et al. (2014), normalised to 2,000 kcal */
const DIET_FACTORS_KG_DAY: Record<string, number> = {
  high_meat:  7.19,
  mixed:      5.63, // maps to "medium meat" in the blueprint
  vegetarian: 3.81,
  vegan:      2.89,
} as const;

// ─── Gamification Constants ───────────────────────────────────────────────────

const POINTS = {
  BASE_LOG:            10,  // awarded for any completed daily log
  VEGAN_BONUS:         25,  // vegan meal choice
  VEGETARIAN_BONUS:    15,
  ZERO_EMISSION_TRIP:  20,  // walk / cycle / train
  STREAK_MULTIPLIER:    5,  // extra points per streak day (capped at 30 days)
  BELOW_BASELINE_BONUS: 30, // day's total is under the user's personal baseline
} as const;

// ─── Input / Output Types ─────────────────────────────────────────────────────

export interface ActivityInput {
  transport: {
    mode: "walk" | "cycle" | "bus" | "train" | "car" | "bike";
    distanceKm: number;
  };
  diet: "vegan" | "vegetarian" | "mixed" | "high_meat";
  homeEnergyKwh?: number;       // optional — grid electricity consumed
  gridIntensityKgPerKwh?: number; // optional — from Emissions.dev API; falls back to India avg
  currentStreak: number;         // consecutive days with a logged activity
  baselineFootprint: number;     // user's personal daily baseline in kg CO2e
}

export interface ProcessedActivity {
  transportEmissionsKg: number;
  dietEmissionsKg: number;
  homeEnergyEmissionsKg: number;
  totalEmissionsKg: number;
  carbonDeltaKg: number;        // negative = saved vs baseline; positive = exceeded
  carbonSavedKg: number;        // clamped to 0 when delta is positive
  pointsEarned: number;
  breakdown: {
    label: string;
    valueKg: number;
    percentage: number;
  }[];
}

// ─── Grid Energy Default ──────────────────────────────────────────────────────

/**
 * Falls back to the India national average (0.82 kg CO2e/kWh) when no
 * real-time figure is provided, per the blueprint's specification for
 * coal-heavy grids (Consumer Ecology, CEA 2024/2025).
 */
const DEFAULT_GRID_INTENSITY_KG_KWH = 0.82;

// ─── Core Processing Function ─────────────────────────────────────────────────

/**
 * Processes a single day's raw activity telemetry.
 *
 * @param input - Raw user-submitted daily activity data
 * @returns A fully typed `ProcessedActivity` result ready for DB persistence
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
  const modeKey = transport.mode.toLowerCase();
  const efMode = TRANSPORT_FACTORS_KG_KM[modeKey] ?? 0.21; // default to car if unknown
  const transportEmissionsKg = roundTo4(transport.distanceKm * efMode);

  // ── 2. Diet emissions ──────────────────────────────────────────────────────
  const dietEmissionsKg = roundTo4(DIET_FACTORS_KG_DAY[diet] ?? DIET_FACTORS_KG_DAY.mixed);

  // ── 3. Home energy emissions (E_elec = C_kWh × EF_grid) ───────────────────
  const homeEnergyEmissionsKg = roundTo4(homeEnergyKwh * gridIntensityKgPerKwh);

  // ── 4. Totals and delta ────────────────────────────────────────────────────
  const totalEmissionsKg = roundTo4(
    transportEmissionsKg + dietEmissionsKg + homeEnergyEmissionsKg
  );
  const carbonDeltaKg = roundTo4(totalEmissionsKg - baselineFootprint);
  const carbonSavedKg = carbonDeltaKg < 0 ? roundTo4(Math.abs(carbonDeltaKg)) : 0;

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

function calculatePoints(
  mode: ActivityInput["transport"]["mode"],
  diet: ActivityInput["diet"],
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

  // Streak multiplier (capped at 30 days to prevent runaway accumulation)
  const cappedStreak = Math.min(streak, 30);
  points += cappedStreak * POINTS.STREAK_MULTIPLIER;

  return points;
}

// ─── Breakdown Builder ────────────────────────────────────────────────────────

function buildBreakdown(
  transport: number,
  diet: number,
  energy: number,
  total: number
): ProcessedActivity["breakdown"] {
  if (total === 0) {
    return [
      { label: "Transport",   valueKg: 0, percentage: 0 },
      { label: "Diet",        valueKg: 0, percentage: 0 },
      { label: "Home Energy", valueKg: 0, percentage: 0 },
    ];
  }

  const pct = (v: number) => roundTo4((v / total) * 100);

  return [
    { label: "Transport",   valueKg: transport, percentage: pct(transport) },
    { label: "Diet",        valueKg: diet,      percentage: pct(diet) },
    { label: "Home Energy", valueKg: energy,    percentage: pct(energy) },
  ];
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Rounds a float to 4 decimal places to avoid floating-point drift in DB. */
function roundTo4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
