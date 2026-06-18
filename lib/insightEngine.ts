/**
 * CarbonPulse AI — Behavioral Insight Engine 2.0
 *
 * Transforms carbon telemetry into high-impact behavioral nudges using
 * longitudinal pattern analysis, relatable equivalencies, and persona-based framing.
 */

import type {
  RecentLog,
  BehavioralNudge,
  TransportMode,
  UserPersona,
  ActivityLog,
} from "./types";
import {
  DIET_FACTORS_KG_DAY,
  TRANSPORT_FACTORS_KG_KM,
} from "./constants";
import { analyzeCarbonTrends, CarbonTrend } from "./patternAnalyzer";
import { getRelatableEquivalency } from "./equivalencies";

// ─── Persona Templates ────────────────────────────────────────────────────────────

type Template = {
  headline: string;
  message: (v: string, eq: string) => string;
  framework: string;
};

const PERSONA_FRAMES: Record<UserPersona, Record<string, Template>> = {
  competitive: {
    trend_down: {
      headline: "🚀 Speeding Towards Zero",
      message: (v: string, eq: string) => `Your footprint is down ${v}. You're outperforming your previous self by ${eq}. Keep the streak alive!`,
      framework: "GAMIFICATION",
    },
    leakage: {
      headline: "⚠️ Efficiency Leak Detected",
      message: (v: string, eq: string) => `You're winning on transport, but losing ground on diet. Plug the leak to maximize your score.`,
      framework: "LOSS_AVERSION",
    },
    default: {
      headline: "Level Up Your Impact",
      message: (v: string, eq: string) => `A simple change today could save ${eq}. Ready to beat your best?`,
      framework: "SALIENCE",
    },
  },
  analytical: {
    trend_down: {
      headline: "📉 Statistical Improvement",
      message: (v: string, eq: string) => `Average emissions decreased by ${v}. This represents a tangible saving of ${eq} relative to last week.`,
      framework: "SALIENCE",
    },
    leakage: {
      headline: "📊 Imbalance Warning",
      message: (v: string, eq: string) => `Data shows an inverse correlation between transport and diet. Recalibrate both to optimize reduction.`,
      framework: "SALIENCE",
    },
    default: {
      headline: "Data-Driven Optimization",
      message: (v: string, eq: string) => `Current metrics suggest that optimizing your primary source could save ${eq}.`,
      framework: "SALIENCE",
    },
  },
  sensitive: {
    trend_down: {
      headline: "🌿 A Lighter Footprint",
      message: (v: string, eq: string) => `You're creating a gentler impact on the planet, reducing your load by ${v}. That's like ${eq} for nature.`,
      framework: "COMMITMENT_CONSISTENCY",
    },
    leakage: {
      headline: "🌍 Holistic Balance",
      message: (v: string, eq: string) => `While your travel is greener, your diet is heavier. A balanced approach helps the earth most.`,
      framework: "SALIENCE",
    },
    default: {
      headline: "A Small Act of Kindness",
      message: (v: string, eq: string) => `By making one small shift today, you could save ${eq}. Every bit counts.`,
      framework: "COMMITMENT_CONSISTENCY",
    },
  },
  pragmatic: {
    trend_down: {
      headline: "✅ Efficient Progress",
      message: (v: string, eq: string) => `Your footprint is down ${v}. This is a practical win, equivalent to ${eq}.`,
      framework: "SALIENCE",
    },
    leakage: {
      headline: "🔄 Trade-off Alert",
      message: (v: string, eq: string) => `You've swapped car trips for more meat. The net gain is minimal. Focus on both for real results.`,
      framework: "SALIENCE",
    },
    default: {
      headline: "Quick Win Available",
      message: (v: string, eq: string) => `A simple shift in your routine today could save ${eq}. It's a low-effort, high-impact move.`,
      framework: "SALIENCE",
    },
  },
};

// ─── Core Nudge Engine ───────────────────────────────────────────────────────────

export function generateDailyNudge(
  logs: ActivityLog[],
  persona: UserPersona = "pragmatic"
): BehavioralNudge | null {
  if (logs.length === 0) return null;

  const trend = analyzeCarbonTrends(logs);
  const lastLog = logs[logs.length - 1];
  const savingsValue = lastLog?.carbonSavedKg || 0;
  const equivalency = getRelatableEquivalency(savingsValue);

  // 1. Priority: Long-term Patterns (Leakage / Trend)
  if (trend.leakageDetected) {
    const frame = PERSONA_FRAMES[persona]?.leakage;
    if (frame) {
      return {
        id: "nudge_leakage",
        headline: frame.headline,
        message: frame.message("", equivalency),
        framework: frame.framework as any,
        potentialSavingsKg: 0,
        triggerContext: { trend },
      };
    }
  }

  if (trend.isImproving) {
    const frame = PERSONA_FRAMES[persona]?.trend_down;
    if (frame) {
      return {
        id: "nudge_trend_down",
        headline: frame.headline,
        message: frame.message(`${Math.abs(trend.velocity)}%`, equivalency),
        framework: frame.framework as any,
        potentialSavingsKg: 0,
        triggerContext: { trend },
      };
    }
  }

  // 2. Secondary: Short-term behavioral triggers (from original engine)
  const recent = logs.slice(-3).reverse();
  const meatless = evaluateMeatlessMonday(recent);
  if (meatless) return adaptToPersona(meatless, persona);

  const subway = evaluateSubwaySubstitution(recent);
  if (subway) return adaptToPersona(subway, persona);

  const transit = evaluateBusTransitDefault(recent);
  if (transit) return adaptToPersona(transit, persona);

  // 3. Tertiary: Default nudge
  const frame = PERSONA_FRAMES[persona]?.default;
  if (frame) {
    return {
      id: "nudge_default",
      headline: frame.headline,
      message: frame.message("", equivalency),
      framework: frame.framework as any,
      potentialSavingsKg: 0,
      triggerContext: {},
    };
  }

  return null;
}

function adaptToPersona(nudge: BehavioralNudge, persona: UserPersona): BehavioralNudge {
  // Simplified persona adaptation for short-term nudges
  const prefix = {
    competitive: "Challenge: ",
    analytical: "Insight: ",
    sensitive: "Invitation: ",
    pragmatic: "Quick Win: ",
  };
  return {
    ...nudge,
    headline: `${prefix[persona]}${nudge.headline}`,
  };
}

// ─── Original Evaluators (Preserved and Adapted) ──────────────────────────────────

function evaluateMeatlessMonday(logs: any[]): BehavioralNudge | null {
  const highMeatDays = logs.filter((l) => l.diet === "high_meat").length;
  if (highMeatDays < 2) return null;
  return {
    id: "nudge_meatless_monday",
    headline: "Meatless Monday — Unlock a Carbon Badge",
    message: `You've logged a high-meat diet ${highMeatDays} days in a row. Swapping to plant-based could save you 4.3kg CO2e.`,
    framework: "GAMIFICATION",
    potentialSavingsKg: 4.3,
    triggerContext: { highMeatDays },
  };
}

function evaluateSubwaySubstitution(logs: any[]): BehavioralNudge | null {
  const shortCarTrips = logs.filter((l) => l.transport.mode === "car" && l.transport.distanceKm < 15);
  if (shortCarTrips.length < 2) return null;
  const latestTrip = shortCarTrips[0];
  return {
    id: "nudge_subway_substitution",
    headline: "Switch Lanes — Your Commute Carbon Is Stacking Up",
    message: `You've driven ${shortCarTrips.length} short trips this week. Subway substitution on a ${latestTrip.transport.distanceKm}km route avoids significant CO2.`,
    framework: "SALIENCE",
    potentialSavingsKg: 1.0,
    triggerContext: { shortCarTripCount: shortCarTrips.length },
  };
}

function evaluateBusTransitDefault(logs: any[]): BehavioralNudge | null {
  const hasCarUsage = logs.some((l) => l.transport.mode === "car");
  const hasGreenMode = logs.some((l) => ["train", "bus", "walk", "cycle"].includes(l.transport.mode));
  if (!hasCarUsage || hasGreenMode) return null;
  return {
    id: "nudge_bus_transit_default",
    headline: "Make Transit Your Default",
    message: "All of your recent trips have been by car. Choosing the bus cuts your transit footprint by nearly 40%.",
    framework: "DEFAULT_BIAS",
    potentialSavingsKg: 0.8,
    triggerContext: { exclusiveCarDays: logs.filter(l => l.transport.mode === "car").length },
  };
}
