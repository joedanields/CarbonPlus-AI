/**
 * CarbonPulse AI — Input Validation Module
 *
 * Runtime type guards and validation functions for all user-facing inputs.
 * Enforces boundaries on numeric ranges, validates string enums against
 * allowed lists, and provides schema validation for persisted data.
 *
 * Security: prevents injection via localStorage tampering, NaN propagation,
 * and out-of-range values that could corrupt downstream calculations.
 */

import type {
  TransportMode,
  DietType,
  ActivityLog,
  ActivityFormValues,
  UserSettings,
} from "./types";
import { INPUT_LIMITS, DEFAULT_DAILY_BASELINE_KG, DEFAULT_WEEKLY_TARGET_KG } from "./constants";

// ─── Allowed Values ───────────────────────────────────────────────────────────

const VALID_TRANSPORT_MODES: readonly TransportMode[] = [
  "walk", "cycle", "bus", "train", "car", "bike",
] as const;

const VALID_DIET_TYPES: readonly DietType[] = [
  "vegan", "vegetarian", "mixed", "high_meat",
] as const;

// ─── Type Guards ──────────────────────────────────────────────────────────────

/** Checks if a value is a valid TransportMode. */
export function isValidTransportMode(value: unknown): value is TransportMode {
  return typeof value === "string" && VALID_TRANSPORT_MODES.includes(value as TransportMode);
}

/** Checks if a value is a valid DietType. */
export function isValidDietType(value: unknown): value is DietType {
  return typeof value === "string" && VALID_DIET_TYPES.includes(value as DietType);
}

/** Checks if a value is a finite, non-NaN number. */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// ─── Input Sanitization ───────────────────────────────────────────────────────

/**
 * Clamps a numeric value to the specified range.
 * Returns `fallback` if the input is not a finite number.
 */
export function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number = 0
): number {
  if (!isFiniteNumber(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

/** Sanitizes transport mode input, defaulting to "walk" for invalid values. */
export function sanitizeTransportMode(value: unknown): TransportMode {
  return isValidTransportMode(value) ? value : "walk";
}

/** Sanitizes diet type input, defaulting to "mixed" for invalid values. */
export function sanitizeDietType(value: unknown): DietType {
  return isValidDietType(value) ? value : "mixed";
}

// ─── Form Validation ──────────────────────────────────────────────────────────

/** Validation result with per-field error messages. */
export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ActivityFormValues, string>>;
}

/**
 * Validates activity form values and returns per-field error messages.
 * Returns `{ valid: true, errors: {} }` when all fields pass.
 */
export function validateFormValues(values: ActivityFormValues): ValidationResult {
  const errors: Partial<Record<keyof ActivityFormValues, string>> = {};

  if (!isValidTransportMode(values.transportMode)) {
    errors.transportMode = "Please select a valid transport mode.";
  }

  if (!isValidDietType(values.diet)) {
    errors.diet = "Please select a valid diet type.";
  }

  if (!isFiniteNumber(values.distanceKm)) {
    errors.distanceKm = "Please enter a valid distance.";
  } else if (values.distanceKm < INPUT_LIMITS.DISTANCE_KM_MIN) {
    errors.distanceKm = "Distance cannot be negative.";
  } else if (values.distanceKm > INPUT_LIMITS.DISTANCE_KM_MAX) {
    errors.distanceKm = `Distance cannot exceed ${INPUT_LIMITS.DISTANCE_KM_MAX} km.`;
  }

  if (!isFiniteNumber(values.homeEnergyKwh)) {
    errors.homeEnergyKwh = "Please enter a valid energy value.";
  } else if (values.homeEnergyKwh < INPUT_LIMITS.HOME_ENERGY_KWH_MIN) {
    errors.homeEnergyKwh = "Energy usage cannot be negative.";
  } else if (values.homeEnergyKwh > INPUT_LIMITS.HOME_ENERGY_KWH_MAX) {
    errors.homeEnergyKwh = `Energy usage cannot exceed ${INPUT_LIMITS.HOME_ENERGY_KWH_MAX} kWh.`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── Storage Schema Validation ────────────────────────────────────────────────

/**
 * Validates and sanitizes a single ActivityLog entry restored from storage.
 * Returns `null` if the entry is irrecoverably malformed.
 */
function validateLogEntry(entry: unknown): ActivityLog | null {
  if (typeof entry !== "object" || entry === null) return null;

  const log = entry as Record<string, unknown>;

  // Required string fields
  if (typeof log["id"] !== "string" || typeof log["date"] !== "string") return null;

  // Validate date is parseable
  const dateMs = Date.parse(log["date"] as string);
  if (!Number.isFinite(dateMs)) return null;

  // Validate nested transport object
  if (typeof log["transport"] !== "object" || log["transport"] === null) return null;
  const transport = log["transport"] as Record<string, unknown>;
  if (!isValidTransportMode(transport["mode"])) return null;
  if (!isFiniteNumber(transport["distanceKm"])) return null;

  // Validate diet
  if (!isValidDietType(log["diet"])) return null;

  // Validate numeric emission fields (permissive: default to 0 if missing)
  const safeNum = (key: string): number => {
    const val = log[key];
    return isFiniteNumber(val) ? val : 0;
  };

  return {
    id: log["id"] as string,
    date: log["date"] as string,
    transport: {
      mode: transport["mode"] as TransportMode,
      distanceKm: transport["distanceKm"] as number,
    },
    diet: log["diet"] as DietType,
    homeEnergyKwh: safeNum("homeEnergyKwh"),
    transportEmissionsKg: safeNum("transportEmissionsKg"),
    dietEmissionsKg: safeNum("dietEmissionsKg"),
    homeEnergyEmissionsKg: safeNum("homeEnergyEmissionsKg"),
    totalEmissionsKg: safeNum("totalEmissionsKg"),
    carbonDeltaKg: safeNum("carbonDeltaKg"),
    carbonSavedKg: safeNum("carbonSavedKg"),
    pointsEarned: safeNum("pointsEarned"),
    breakdown: Array.isArray(log["breakdown"])
      ? (log["breakdown"] as unknown[]).filter(
          (b): b is { label: string; valueKg: number; percentage: number } =>
            typeof b === "object" &&
            b !== null &&
            typeof (b as Record<string, unknown>)["label"] === "string" &&
            isFiniteNumber((b as Record<string, unknown>)["valueKg"]) &&
            isFiniteNumber((b as Record<string, unknown>)["percentage"])
        )
      : [],
  };
}

/**
 * Validates an array of activity logs parsed from localStorage.
 * Filters out malformed entries and caps at maxEntries.
 */
export function validateStoredLogs(
  data: unknown,
  maxEntries: number
): ActivityLog[] {
  if (!Array.isArray(data)) return [];

  const validated: ActivityLog[] = [];
  for (const entry of data) {
    const log = validateLogEntry(entry);
    if (log !== null) validated.push(log);
  }

  return validated.slice(-maxEntries);
}

/**
 * Validates user settings parsed from localStorage.
 * Returns defaults if the data is malformed.
 */
export function validateStoredSettings(data: unknown): UserSettings {
  const defaults: UserSettings = {
    dailyTargetKg: DEFAULT_DAILY_BASELINE_KG,
    weeklyTargetKg: DEFAULT_WEEKLY_TARGET_KG,
    persona: "pragmatic",
    onboardingCompleted: false,
    missionState: {
      activeMissionId: null,
      startedAt: null,
      completedMissionIds: [],
    },
    unlockedBadges: [],
  };

  if (typeof data !== "object" || data === null) return defaults;

  const settings = data as Record<string, unknown>;

  // Basic validation of persona
  const validPersonas = ["competitive", "analytical", "sensitive", "pragmatic"];
  const rawPersona = settings["persona"] as string;
  const persona = validPersonas.includes(rawPersona) ? rawPersona : "pragmatic";

  return {
    dailyTargetKg: clampNumber(
      settings["dailyTargetKg"],
      INPUT_LIMITS.DAILY_TARGET_KG_MIN,
      INPUT_LIMITS.DAILY_TARGET_KG_MAX,
      DEFAULT_DAILY_BASELINE_KG
    ),
    weeklyTargetKg: clampNumber(
      settings["weeklyTargetKg"],
      INPUT_LIMITS.DAILY_TARGET_KG_MIN * 7,
      INPUT_LIMITS.DAILY_TARGET_KG_MAX * 7,
      DEFAULT_WEEKLY_TARGET_KG
    ),
    persona: persona as any,
    onboardingCompleted: typeof settings["onboardingCompleted"] === "boolean"
      ? settings["onboardingCompleted"]
      : false,
    missionState: typeof settings["missionState"] === "object" && settings["missionState"] !== null
      ? (settings["missionState"] as any)
      : { activeMissionId: null, startedAt: null, completedMissionIds: [] },
    unlockedBadges: Array.isArray(settings["unlockedBadges"])
      ? settings["unlockedBadges"]
      : [],
  };
}
