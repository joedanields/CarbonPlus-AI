/**
 * CarbonPulse AI — Application Constants
 *
 * Single source of truth for emission factors, gamification values,
 * storage keys, and comparison benchmarks.
 *
 * Emission factors sourced from DEFRA 2024/2025, EPA, and Scarborough et al. (2014).
 */

import type { TransportMode, DietType } from "./types";

// ─── Emission Factor Constants ────────────────────────────────────────────────

/** kg CO2e per km (includes Tank-to-Wheel + Well-to-Tank). Source: DEFRA 2024/2025. */
export const TRANSPORT_FACTORS_KG_KM: Readonly<Record<TransportMode, number>> = {
  walk:  0.00,
  cycle: 0.00,
  car:   0.21,   // Average petrol/diesel
  bus:   0.13,   // Post-COVID occupancy-adjusted
  train: 0.02,   // Electrified metro/light rail
  bike:  0.11,   // Average motorbike estimate
} as const;

/** kg CO2e per day. Source: Scarborough et al. (2014), normalised to 2,000 kcal. */
export const DIET_FACTORS_KG_DAY: Readonly<Record<DietType, number>> = {
  high_meat:  7.19,
  mixed:      5.63,
  vegetarian: 3.81,
  vegan:      2.89,
} as const;

/**
 * India national average grid intensity (kg CO2e/kWh).
 * Falls back to this when no real-time figure is provided.
 * Source: Consumer Ecology, CEA 2024/2025.
 */
export const DEFAULT_GRID_INTENSITY_KG_KWH = 0.82;

// ─── Simple Actions Constants ─────────────────────────────────────────────────

export const SIMPLE_ACTIONS_KG_SAVINGS: Record<string, number> = {
  thermostat_drop: 0.50,
  cold_water_wash: 0.40,
  efficient_boiling: 0.03,
  digital_fasting: 0.10,
} as const;

export const SIMPLE_ACTIONS_LABELS: Record<string, string> = {
  thermostat_drop: "Lowered thermostat by 1°C",
  cold_water_wash: "Washed laundry on cold",
  efficient_boiling: "Boiled only needed water",
  digital_fasting: "Digital fasting (No HD streaming after 10PM)",
} as const;

// ─── Gamification Constants ───────────────────────────────────────────────────

export const POINTS = {
  BASE_LOG:            10,
  VEGAN_BONUS:         25,
  VEGETARIAN_BONUS:    15,
  ZERO_EMISSION_TRIP:  20,
  STREAK_MULTIPLIER:    5,
  BELOW_BASELINE_BONUS: 30,
  MAX_STREAK_DAYS:      30,
} as const;

// ─── Application Defaults ─────────────────────────────────────────────────────

/** Default daily baseline in kg CO2e for new users. */
export const DEFAULT_DAILY_BASELINE_KG = 12;

/** Default weekly carbon budget in kg CO2e. */
export const DEFAULT_WEEKLY_TARGET_KG = 70;

/** Maximum number of log entries retained in localStorage. */
export const MAX_STORAGE_ENTRIES = 30;

// ─── Storage Keys ─────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  ACTIVITY_LOGS: "carbonpulse.activity-logs.v1",
  USER_SETTINGS: "carbonpulse.user-settings.v1",
} as const;

// ─── Chart Constants ──────────────────────────────────────────────────────────

/** Colors for the emissions breakdown donut chart: [Transport, Diet, Home Energy]. */
export const CATEGORY_COLORS = ["#42e8a5", "#8cb4ff", "#f8be5b"] as const;

// ─── Comparison Benchmarks ────────────────────────────────────────────────────

/**
 * National/global daily per-capita carbon footprint averages (kg CO2e/day).
 * Derived from annual figures divided by 365.
 * Sources: Global Carbon Project 2024, World Bank.
 */
export const BENCHMARKS_KG_PER_DAY = {
  global:       13.2,   // ~4.8 tonnes/year globally
  india:         5.5,   // ~2.0 tonnes/year
  uk:           13.7,   // ~5.0 tonnes/year
  usa:          38.4,   // ~14.0 tonnes/year
  eu:           17.0,   // ~6.2 tonnes/year
} as const;

// ─── Validation Limits ────────────────────────────────────────────────────────

export const INPUT_LIMITS = {
  DISTANCE_KM_MIN: 0,
  DISTANCE_KM_MAX: 1000,
  HOME_ENERGY_KWH_MIN: 0,
  HOME_ENERGY_KWH_MAX: 500,
  DAILY_TARGET_KG_MIN: 1,
  DAILY_TARGET_KG_MAX: 100,
} as const;
