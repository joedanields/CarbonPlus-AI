import type { ActivityLog, Mission, MissionState, Badge } from "./types";
import { AVAILABLE_MISSIONS } from "./missions";

/**
 * Manages the state and evaluation of user missions.
 */
export function updateMissionProgress(logs: ActivityLog[], state: MissionState): {
  updatedState: MissionState;
  newlyUnlockedBadges: Badge[];
  pointsEarned: number;
} {
  if (!state.activeMissionId) {
    return { updatedState: state, newlyUnlockedBadges: [], pointsEarned: 0 };
  }

  const mission = AVAILABLE_MISSIONS.find(m => m.id === state.activeMissionId);
  if (!mission) {
    return { updatedState: state, newlyUnlockedBadges: [], pointsEarned: 0 };
  }

  const progress = mission.criteria(logs);

  if (progress >= 1.0 && !state.completedMissionIds.includes(mission.id)) {
    // Mission completed!
    return {
      updatedState: {
        ...state,
        activeMissionId: null,
        startedAt: null,
        completedMissionIds: [...state.completedMissionIds, mission.id],
      },
      newlyUnlockedBadges: [
        {
          id: mission.badgeId,
          name: mission.title,
          icon: "🏆",
          unlockedAt: new Date().toISOString(),
        },
      ],
      pointsEarned: mission.rewardPoints,
    };
  }

  return { updatedState: state, newlyUnlockedBadges: [], pointsEarned: 0 };
}

/**
 * Evaluates current logs to suggest the best next mission.
 */
export function suggestNextMission(logs: ActivityLog[], completedIds: string[]): Mission | null {
  const available = AVAILABLE_MISSIONS.filter(m => !completedIds.includes(m.id));
  if (available.length === 0) return null;

  // Simple heuristic: suggest the one with the most progress currently
  return available.reduce((best, current) => {
    const progress = current.criteria(logs);
    const bestProgress = best ? best.criteria(logs) : -1;
    return progress > bestProgress ? current : best;
  }, null as Mission | null);
}
