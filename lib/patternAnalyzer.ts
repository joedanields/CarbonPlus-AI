import type { ActivityLog } from "./types";

export interface CarbonTrend {
  velocity: number; // Percentage change (last 7d vs prev 7d)
  isImproving: boolean;
  leakageDetected: boolean;
  leakageMessage: string | null;
}

/**
 * Analyzes activity logs over time to detect trends and behavioral anomalies.
 */
export function analyzeCarbonTrends(logs: ActivityLog[]): CarbonTrend {
  if (logs.length < 14) {
    return { velocity: 0, isImproving: false, leakageDetected: false, leakageMessage: null };
  }

  const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const last7 = sorted.slice(-7);
  const prev7 = sorted.slice(-14, -7);

  const avgLast7 = last7.reduce((sum, log) => sum + log.totalEmissionsKg, 0) / 7;
  const avgPrev7 = prev7.reduce((sum, log) => sum + log.totalEmissionsKg, 0) / 7;

  const velocity = avgPrev7 === 0 ? 0 : ((avgLast7 - avgPrev7) / avgPrev7) * 100;

  // Leakage Detection: Check if one category dropped while another climbed
  const getCategoryAvg = (logs: ActivityLog[], key: "transport" | "diet" | "homeEnergy") => {
    return logs.reduce((sum, log) => {
      if (key === "transport") return sum + log.transportEmissionsKg;
      if (key === "diet") return sum + log.dietEmissionsKg;
      return sum + log.homeEnergyEmissionsKg;
    }, 0) / logs.length;
  };

  const transportLast = getCategoryAvg(last7, "transport");
  const transportPrev = getCategoryAvg(prev7, "transport");
  const dietLast = getCategoryAvg(last7, "diet");
  const dietPrev = getCategoryAvg(prev7, "diet");

  let leakageDetected = false;
  let leakageMessage: string | null = null;

  // Example: Transport down > 20%, Diet up > 20%
  if (transportLast < transportPrev * 0.8 && dietLast > dietPrev * 1.2) {
    leakageDetected = true;
    leakageMessage = "You've cut your driving, but your diet emissions are climbing. Are you trading one for the other?";
  }

  return {
    velocity: Math.round(velocity),
    isImproving: velocity < 0,
    leakageDetected,
    leakageMessage,
  };
}
