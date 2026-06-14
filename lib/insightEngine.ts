/**
 * CarbonPulse AI — Behavioral Nudge Engine
 *
 * Evaluates the last 3 days of user activity telemetry and emits a single,
 * contextually relevant behavioral nudge using Fogg's B=MAP model.
 *
 * Psychological frameworks: Nudge Theory (Thaler & Sunstein),
 * Fogg Behavior Model, and the micro-action matrix from the blueprint.
 * Zero external dependencies.
 */

import type {
  RecentLog,
  BehavioralNudge,
  TransportMode,
} from "./types";
import {
  DIET_FACTORS_KG_DAY,
  TRANSPORT_FACTORS_KG_KM,
} from "./constants";

// ─── Core Nudge Engine ────────────────────────────────────────────────────────

/**
 * Evaluates up to the last 3 activity logs and returns the single highest-
 * priority nudge. Returns `null` if no trigger condition is met.
 *
 * Priority order (first match wins):
 *   1. Consecutive high-meat logging → "Meatless Monday" challenge
 *   2. Repeated short car trips → subway substitution
 *   3. Any car usage with available greener mode → transit default-bias nudge
 *
 * @param recentLogs - Array of the user's most recent activity logs (newest first)
 */
export function generateDailyNudge(
  recentLogs: RecentLog[]
): BehavioralNudge | null {
  const logs = recentLogs.slice(0, 3);

  if (logs.length === 0) return null;

  // ── Trigger 1: Consecutive High-Meat Days ─────────────────────────────────
  const meatlessNudge = evaluateMeatlessMonday(logs);
  if (meatlessNudge) return meatlessNudge;

  // ── Trigger 2: Repeated Short Car Trips (< 15 km) ─────────────────────────
  const subwayNudge = evaluateSubwaySubstitution(logs);
  if (subwayNudge) return subwayNudge;

  // ── Trigger 3: Any Car Usage → Bus Transit Default ────────────────────────
  const transitNudge = evaluateBusTransitDefault(logs);
  if (transitNudge) return transitNudge;

  return null;
}

// ─── Trigger Evaluators ───────────────────────────────────────────────────────

/**
 * TRIGGER 1 — "Meatless Monday" Challenge
 * Framework: Gamification + Commitment Consistency
 *
 * Fires when the user has logged `high_meat` for 2+ of the last 3 days.
 * Savings = high_meat daily factor − vegan daily factor (4.30 kg CO2e/day).
 */
function evaluateMeatlessMonday(logs: RecentLog[]): BehavioralNudge | null {
  const highMeatDays = logs.filter((l) => l.diet === "high_meat").length;

  if (highMeatDays < 2) return null;

  const savingsKg = roundTo2(DIET_FACTORS_KG_DAY.high_meat - DIET_FACTORS_KG_DAY.vegan);

  return {
    id: "nudge_meatless_monday",
    headline: "Meatless Monday — Unlock a Carbon Badge",
    message:
      `You've logged a high-meat diet ${highMeatDays} days in a row. ` +
      `Swapping tomorrow's meals to plant-based could save you ${savingsKg} kg CO2e — ` +
      `enough to completely offset your last car commute. ` +
      `Complete the challenge and earn +50 bonus points.`,
    framework: "GAMIFICATION",
    potentialSavingsKg: savingsKg,
    triggerContext: { highMeatDays, logsEvaluated: logs.length },
  };
}

/**
 * TRIGGER 2 — Subway Substitution (Short Car Trips)
 * Framework: Salience / Choice Architecture
 *
 * Fires when at least 2 of the last 3 logs show a car trip under 15 km.
 * Savings per trip = distance × (car EF − train EF).
 */
function evaluateSubwaySubstitution(logs: RecentLog[]): BehavioralNudge | null {
  const shortCarTrips = logs.filter(
    (l) => l.transport.mode === "car" && l.transport.distanceKm < 15
  );

  if (shortCarTrips.length < 2) return null;

  const latestTrip = shortCarTrips[0];
  if (!latestTrip) return null;

  const savingsKg = roundTo2(
    latestTrip.transport.distanceKm *
      (TRANSPORT_FACTORS_KG_KM.car - TRANSPORT_FACTORS_KG_KM.train)
  );
  const avgDistanceKm = roundTo2(
    shortCarTrips.reduce((sum, l) => sum + l.transport.distanceKm, 0) /
      shortCarTrips.length
  );

  return {
    id: "nudge_subway_substitution",
    headline: "Switch Lanes — Your Commute Carbon Is Stacking Up",
    message:
      `You've driven ${shortCarTrips.length} short trips (avg ${avgDistanceKm} km) this week. ` +
      `Taking the subway instead of your car on a ${latestTrip.transport.distanceKm} km route ` +
      `avoids ${savingsKg} kg CO2e — that's enough energy to charge a smartphone every day for a year.`,
    framework: "SALIENCE",
    potentialSavingsKg: savingsKg,
    triggerContext: {
      shortCarTripCount: shortCarTrips.length,
      avgDistanceKm,
      latestDistanceKm: latestTrip.transport.distanceKm,
    },
  };
}

/**
 * TRIGGER 3 — Bus Transit Default Bias
 * Framework: Default Bias
 *
 * Fires when any log shows car usage and no greener mode in the same window.
 * Savings = 10 km × (car EF − bus EF) = 0.80 kg CO2e.
 */
function evaluateBusTransitDefault(logs: RecentLog[]): BehavioralNudge | null {
  const hasCarUsage = logs.some((l) => l.transport.mode === "car");
  const greenModes: TransportMode[] = ["train", "bus", "walk", "cycle"];
  const hasGreenMode = logs.some((l) =>
    greenModes.includes(l.transport.mode)
  );

  if (!hasCarUsage || hasGreenMode) return null;

  const REFERENCE_DISTANCE_KM = 10;
  const savingsKg = roundTo2(
    REFERENCE_DISTANCE_KM *
      (TRANSPORT_FACTORS_KG_KM.car - TRANSPORT_FACTORS_KG_KM.bus)
  );

  return {
    id: "nudge_bus_transit_default",
    headline: "Make Transit Your Default — Cut 40% Off Your Commute Footprint",
    message:
      `All of your recent trips have been by car. ` +
      `Choosing the bus for a ${REFERENCE_DISTANCE_KM} km route cuts your transit ` +
      `carbon footprint by nearly 40%, saving ${savingsKg} kg CO2e per trip. ` +
      `Set transit as your default and watch your streak climb.`,
    framework: "DEFAULT_BIAS",
    potentialSavingsKg: savingsKg,
    triggerContext: {
      exclusiveCarDays: logs.filter((l) => l.transport.mode === "car").length,
      referenceDistanceKm: REFERENCE_DISTANCE_KM,
    },
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Rounds a float to 2 decimal places. */
function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}
