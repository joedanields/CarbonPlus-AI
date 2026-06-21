/**
 * CarbonPulse AI — Shared Type Definitions
 *
 * Single source of truth for all domain types used across the application.
 * Keeps component, processing, and storage layers in sync.
 */

// ─── Transport ────────────────────────────────────────────────────────────────

/** All supported transport modes in the application. */
export type TransportMode = "walk" | "cycle" | "bus" | "train" | "car" | "bike";

/** User-facing label map for transport modes. */
export const TRANSPORT_LABELS: Record<TransportMode, string> = {
  walk: "Walking",
  cycle: "Cycling",
  bus: "Bus",
  train: "Train / Metro",
  bike: "Motorbike",
  car: "Car",
} as const;

// ─── Diet ─────────────────────────────────────────────────────────────────────

/** All supported diet classifications. */
export type DietType = "vegan" | "vegetarian" | "mixed" | "high_meat";

/** User-facing label map for diet types. */
export const DIET_LABELS: Record<DietType, string> = {
  vegan: "Plant-based",
  vegetarian: "Vegetarian",
  mixed: "Mixed diet",
  high_meat: "High-meat diet",
} as const;

// ─── Simple Actions ───────────────────────────────────────────────────────────

/** Quick actions a user can log for immediate carbon savings. */
export type SimpleActionType =
  | "thermostat_drop"
  | "cold_water_wash"
  | "efficient_boiling"
  | "digital_fasting";

// ─── Psychological Frameworks ─────────────────────────────────────────────────

/** Behavioral nudge psychological frameworks (Fogg B=MAP, Nudge Theory). */
export type PsychologicalFramework =
  | "GAMIFICATION"
  | "SALIENCE"
  | "LOSS_AVERSION"
  | "COMMITMENT_CONSISTENCY"
  | "SOCIAL_PROOF"
  | "DEFAULT_BIAS";

// ─── Activity Processing ──────────────────────────────────────────────────────

/** Raw input from the activity form before processing. */
export interface ActivityFormValues {
  transportMode: TransportMode;
  distanceKm: number;
  diet: DietType;
  homeEnergyKwh: number;
  simpleActions: SimpleActionType[];
}

/** Input shape for the emissions processing engine. */
export interface ActivityInput {
  transport: {
    mode: TransportMode;
    distanceKm: number;
  };
  diet: DietType;
  /** Optional — grid electricity consumed in kWh. */
  homeEnergyKwh?: number;
  /** Optional — from Emissions.dev API; falls back to India avg. */
  gridIntensityKgPerKwh?: number;
  /** Consecutive days with a logged activity. */
  currentStreak: number;
  /** User's personal daily baseline in kg CO2e. */
  baselineFootprint: number;
  /** Array of simple actions completed today. */
  simpleActions: SimpleActionType[];
}

/** Breakdown entry for SVG donut chart. */
export interface BreakdownItem {
  label: string;
  valueKg: number;
  percentage: number;
}

/** Result of processing a single day's activity. */
export interface ProcessedActivity {
  transportEmissionsKg: number;
  dietEmissionsKg: number;
  homeEnergyEmissionsKg: number;
  totalEmissionsKg: number;
  /** Negative = saved vs baseline; positive = exceeded. */
  carbonDeltaKg: number;
  /** Clamped to 0 when delta is positive. */
  carbonSavedKg: number;
  pointsEarned: number;
  breakdown: BreakdownItem[];
}

/** A complete activity log entry with metadata. */
export interface ActivityLog extends ProcessedActivity {
  id: string;
  date: string;
  transport: { mode: TransportMode; distanceKm: number };
  diet: DietType;
  homeEnergyKwh: number;
  simpleActions: SimpleActionType[];
}

// ─── Insight Engine ───────────────────────────────────────────────────────────

/** Shape of a single stored activity log for nudge evaluation. */
export interface RecentLog {
  date: string | Date;
  transport: {
    mode: TransportMode;
    distanceKm: number;
  };
  diet: DietType;
  totalCarbonSaved: number;
}

/** A behavioral nudge returned by the insight engine. */
export interface BehavioralNudge {
  id: string;
  headline: string;
  message: string;
  framework: PsychologicalFramework;
  potentialSavingsKg: number;
  /** Data-driven context used to compose the nudge (useful for logging/A-B testing). */
  triggerContext: Record<string, unknown>;
}

// ─── AI Coach ─────────────────────────────────────────────────────────────────

/** Summary of a single day's log for the weekly coach prompt. */
export interface DailyLogSummary {
  date: string;
  transportEmissionsKg: number;
  dietEmissionsKg: number;
  homeEnergyEmissionsKg: number;
  totalEmissionsKg: number;
  carbonSavedKg: number;
  transport: {
    mode: string;
    distanceKm: number;
  };
  diet: string;
  pointsEarned: number;
}

/** Aggregated weekly data for the AI coach prompt builder. */
export interface WeeklyCoachData {
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  dailyLogs: DailyLogSummary[];
  weeklyTotals: {
    transportEmissionsKg: number;
    dietEmissionsKg: number;
    homeEnergyEmissionsKg: number;
    totalEmissionsKg: number;
    totalCarbonSavedKg: number;
    totalPointsEarned: number;
  };
  streak: number;
  baselineFootprintKgPerDay: number;
  /** baselineFootprintKgPerDay × 7. */
  weeklyBaselineKg: number;
}

// ─── User Persona ────────────────────────────────────────────────────────────

/** Behavioral profile that determines the tone and framing of AI nudges. */
export type UserPersona = "competitive" | "analytical" | "sensitive" | "pragmatic";

/** Map of persona labels for the onboarding quiz. */
export const PERSONA_LABELS: Record<UserPersona, string> = {
  competitive: "The Achiever",
  analytical: "The Data Scientist",
  sensitive: "The Eco-Guardian",
  pragmatic: "The Efficiency Expert",
} as const;

// ─── Missions & Rewards ──────────────────────────────────────────────────────────

/** A behavioral challenge a user can commit to. */
export interface Mission {
  id: string;
  title: string;
  description: string;
  criteria: (logs: ActivityLog[]) => number; // Returns progress from 0.0 to 1.0
  rewardPoints: number;
  badgeId: string;
  durationDays: number;
}

/** A reward earned by completing a mission. */
export interface Badge {
  id: string;
  name: string;
  icon: string;
  unlockedAt: string;
}

/** State of a user's current engagement with missions. */
export interface MissionState {
  activeMissionId: string | null;
  startedAt: string | null;
  completedMissionIds: string[];
}

// ─── User Settings ────────────────────────────────────────────────────────────

/** Persisted user settings including customizable daily target and persona. */
export interface UserSettings {
  dailyTargetKg: number;
  weeklyTargetKg: number;
  persona: UserPersona;
  onboardingCompleted: boolean;
  missionState: MissionState;
  unlockedBadges: string[];
}

