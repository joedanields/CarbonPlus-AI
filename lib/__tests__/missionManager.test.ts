import { describe, it, expect } from "vitest";
import { updateMissionProgress, suggestNextMission } from "../missionManager";
import type { ActivityLog, MissionState } from "../types";

/** Minimal ActivityLog factory. */
function makeLog(
  date: string,
  overrides: Partial<ActivityLog> = {}
): ActivityLog {
  return {
    id: `test-${date}`,
    date,
    transport: { mode: "walk", distanceKm: 0 },
    diet: "mixed",
    homeEnergyKwh: 0,
    transportEmissionsKg: 0,
    dietEmissionsKg: 5.63,
    homeEnergyEmissionsKg: 0,
    totalEmissionsKg: 5.63,
    carbonDeltaKg: -6.37,
    carbonSavedKg: 6.37,
    pointsEarned: 10,
    breakdown: [],
    ...overrides,
  };
}

const emptyState: MissionState = {
  activeMissionId: null,
  startedAt: null,
  completedMissionIds: [],
};

describe("updateMissionProgress", () => {
  it("returns unchanged state when no mission is active", () => {
    const result = updateMissionProgress([], emptyState);
    expect(result.updatedState).toBe(emptyState);
    expect(result.newlyUnlockedBadges).toEqual([]);
    expect(result.pointsEarned).toBe(0);
  });

  it("returns unchanged state when active mission ID doesn't match any mission", () => {
    const state: MissionState = {
      activeMissionId: "non_existent_mission",
      startedAt: "2026-06-01T00:00:00Z",
      completedMissionIds: [],
    };
    const result = updateMissionProgress([], state);
    expect(result.newlyUnlockedBadges).toEqual([]);
    expect(result.pointsEarned).toBe(0);
  });

  it("completes meatless_week mission when 7 non-high-meat days logged", () => {
    const logs: ActivityLog[] = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`, { diet: "vegetarian" })
    );
    const state: MissionState = {
      activeMissionId: "mission_meatless_week",
      startedAt: "2026-06-01T00:00:00Z",
      completedMissionIds: [],
    };

    const result = updateMissionProgress(logs, state);
    expect(result.updatedState.activeMissionId).toBeNull();
    expect(result.updatedState.completedMissionIds).toContain("mission_meatless_week");
    expect(result.newlyUnlockedBadges.length).toBe(1);
    expect(result.newlyUnlockedBadges[0]?.id).toBe("badge_plant_powered");
    expect(result.pointsEarned).toBe(100);
  });

  it("does NOT complete meatless_week when high-meat days exist", () => {
    const logs: ActivityLog[] = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`, { diet: "vegetarian" })
      ),
      makeLog("2026-06-06", { diet: "high_meat" }),
      makeLog("2026-06-07", { diet: "high_meat" }),
    ];
    const state: MissionState = {
      activeMissionId: "mission_meatless_week",
      startedAt: "2026-06-01T00:00:00Z",
      completedMissionIds: [],
    };

    const result = updateMissionProgress(logs, state);
    // 5/7 clean days = 0.714... < 1.0
    expect(result.updatedState.activeMissionId).toBe("mission_meatless_week");
    expect(result.newlyUnlockedBadges.length).toBe(0);
  });

  it("completes zero_hero mission with 3 consecutive low-emission days", () => {
    const logs: ActivityLog[] = [
      makeLog("2026-06-01", { totalEmissionsKg: 2.5 }),
      makeLog("2026-06-02", { totalEmissionsKg: 2.0 }),
      makeLog("2026-06-03", { totalEmissionsKg: 1.5 }),
    ];
    const state: MissionState = {
      activeMissionId: "mission_zero_hero",
      startedAt: "2026-06-01T00:00:00Z",
      completedMissionIds: [],
    };

    const result = updateMissionProgress(logs, state);
    expect(result.updatedState.completedMissionIds).toContain("mission_zero_hero");
    expect(result.pointsEarned).toBe(200);
  });

  it("does NOT re-complete an already completed mission", () => {
    const logs: ActivityLog[] = Array.from({ length: 7 }, (_, i) =>
      makeLog(`2026-06-${String(i + 1).padStart(2, "0")}`, { diet: "vegan" })
    );
    const state: MissionState = {
      activeMissionId: "mission_meatless_week",
      startedAt: "2026-06-01T00:00:00Z",
      completedMissionIds: ["mission_meatless_week"],
    };

    const result = updateMissionProgress(logs, state);
    expect(result.newlyUnlockedBadges.length).toBe(0);
    expect(result.pointsEarned).toBe(0);
  });
});

describe("suggestNextMission", () => {
  it("returns null when all missions are completed", () => {
    const completedIds = [
      "mission_meatless_week",
      "mission_transit_master",
      "mission_zero_hero",
    ];
    const result = suggestNextMission([], completedIds);
    expect(result).toBeNull();
  });

  it("returns a mission when some are still available", () => {
    const result = suggestNextMission([], []);
    expect(result).not.toBeNull();
    expect(result?.id).toBeDefined();
  });

  it("excludes already completed missions from suggestions", () => {
    const result = suggestNextMission([], ["mission_meatless_week"]);
    expect(result?.id).not.toBe("mission_meatless_week");
  });

  it("suggests the mission with the most current progress", () => {
    // With 3 low-emission logs, zero_hero should have highest progress (3/3)
    const logs: ActivityLog[] = [
      makeLog("2026-06-01", { totalEmissionsKg: 2 }),
      makeLog("2026-06-02", { totalEmissionsKg: 2 }),
      makeLog("2026-06-03", { totalEmissionsKg: 2 }),
    ];
    const result = suggestNextMission(logs, []);
    expect(result).not.toBeNull();
    // zero_hero criteria: 3 consecutive days under 3kg = 1.0 progress
    // meatless_week: 3/7 non-high-meat = 0.43
    // transit_master: 0/10 transit trips = 0
    expect(result?.id).toBe("mission_zero_hero");
  });
});
