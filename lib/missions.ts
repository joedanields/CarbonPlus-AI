import type { Mission } from "./types";
import type { ActivityLog } from "./types";

/**
 * Registry of available behavioral challenges.
 */
export const AVAILABLE_MISSIONS: Mission[] = [
  {
    id: "mission_meatless_week",
    title: "Meatless Week",
    description: "Log 7 consecutive days without a high-meat diet.",
    criteria: (logs) => {
      const recent = logs.slice(-7);
      if (recent.length < 7) return recent.length / 7;
      const cleanDays = recent.filter(l => l.diet !== "high_meat").length;
      return cleanDays / 7;
    },
    rewardPoints: 100,
    badgeId: "badge_plant_powered",
    durationDays: 7,
  },
  {
    id: "mission_transit_master",
    title: "Transit Master",
    description: "Take 10 trips using sustainable public transit (Train/Bus).",
    criteria: (logs) => {
      const count = logs.filter(l => l.transport.mode === "train" || l.transport.mode === "bus").length;
      return Math.min(count / 10, 1.0);
    },
    rewardPoints: 150,
    badgeId: "badge_transit_hero",
    durationDays: 30,
  },
  {
    id: "mission_zero_hero",
    title: "Zero Hero",
    description: "Achieve 3 days in a row with total emissions under 3kg.",
    criteria: (logs) => {
      const recent = logs.slice(-3);
      if (recent.length < 3) return recent.length / 3;
      const lowDays = recent.filter(l => l.totalEmissionsKg < 3).length;
      return lowDays / 3;
    },
    rewardPoints: 200,
    badgeId: "badge_zero_hero",
    durationDays: 3,
  },
];
