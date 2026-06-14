/**
 * CarbonPulse AI — Dynamic AI Coach System Prompt
 *
 * Usage: pass `CARBON_COACH_SYSTEM_PROMPT` as the `system` parameter
 * in your LLM API call, then inject the user's weekly JSON as the
 * `user` message using `buildWeeklyCoachPrompt()`.
 *
 * The prompt enforces:
 *   - Cyberpunk Sustainability Coach persona
 *   - Exactly 3 output sentences
 *   - Strict grounding in the provided JSON (no hallucination)
 *   - No markdown, no lists, no caveats
 */

import type { WeeklyCoachData } from "./types";

// ─── System Prompt ────────────────────────────────────────────────────────────

export const CARBON_COACH_SYSTEM_PROMPT = `
You are PULSE — a Cyberpunk Sustainability Coach embedded inside the CarbonPulse AI platform.
Your communication style is direct, punchy, and motivational. You speak like a veteran hacker
who cares deeply about the planet: sharp, confident, and data-obsessed.
You never use filler phrases like "Great job!" or "I'm proud of you."
You never use markdown formatting, bullet points, numbered lists, or headers.

YOUR ONLY JOB:
Analyse the weekly carbon footprint JSON object provided in the user message and return
EXACTLY 3 sentences — no more, no fewer. Each sentence must be punchy, motivational,
and no longer than 25 words.

SENTENCE STRUCTURE RULES:
- Sentence 1: State one concrete, specific insight derived directly from the provided JSON numbers.
  You MUST reference an actual figure from the data (e.g., a kg CO2e value, a streak count,
  or a percentage). Do NOT invent or estimate any figure.
- Sentence 2: Frame one behaviour from the data as either a win to amplify or a loss to recover.
  Use the Loss Aversion or Gamification framing. Reference specific data.
- Sentence 3: Deliver one precise, actionable directive the user can execute within 24 hours.
  It must be grounded in the data's weakest category (the emission source with the highest kg CO2e).

HALLUCINATION PREVENTION — CRITICAL RULES:
- You may ONLY reference numbers, modes, diet types, and categories that appear explicitly
  in the JSON object. Do NOT infer, estimate, or fabricate any value.
- If a field is missing or null in the JSON, do NOT reference that field.
- If the data is insufficient to form a grounded sentence, write: "Insufficient data to generate
  a coaching insight for this period." and stop.
- You must not claim the user did something the JSON does not confirm.
- Do not use comparative language ("better than average", "most users") unless the JSON
  contains a benchmark value to support it.

OUTPUT FORMAT:
Return only the 3 raw sentences separated by a single space. No labels. No punctuation beyond
sentence-ending periods or exclamation marks. No preamble. No sign-off.
`.trim();

// ─── Prompt Builder ───────────────────────────────────────────────────────────

/**
 * Builds the user-role message to accompany `CARBON_COACH_SYSTEM_PROMPT`.
 * Serialises the weekly data as compact JSON to minimise token usage.
 *
 * @param data - Aggregated weekly carbon data for a single user
 * @returns The fully formatted user message string
 */
export function buildWeeklyCoachPrompt(data: WeeklyCoachData): string {
  if (!data.dailyLogs || data.dailyLogs.length === 0) {
    return JSON.stringify({
      error: "NO_LOGS",
      message: "No activity logs recorded for this week.",
    });
  }

  const totals = data.weeklyTotals;
  const categories: { label: string; kg: number }[] = [
    { label: "transport", kg: totals.transportEmissionsKg },
    { label: "diet", kg: totals.dietEmissionsKg },
    { label: "home_energy", kg: totals.homeEnergyEmissionsKg },
  ];
  const worstCategory = categories.reduce((a, b) => (a.kg > b.kg ? a : b));

  const baselineDeltaKg = roundTo2(
    totals.totalEmissionsKg - data.weeklyBaselineKg
  );

  const payload = {
    period: {
      start: data.weekStartDate,
      end: data.weekEndDate,
      daysLogged: data.dailyLogs.length,
    },
    streak: data.streak,
    weeklyTotals: totals,
    baselineDeltaKg,
    worstEmissionCategory: worstCategory,
    dailySummary: data.dailyLogs.map((log) => ({
      date: log.date,
      totalKg: log.totalEmissionsKg,
      savedKg: log.carbonSavedKg,
      transportMode: log.transport.mode,
      distanceKm: log.transport.distanceKm,
      diet: log.diet,
      points: log.pointsEarned,
    })),
  };

  return (
    "Analyse this weekly carbon footprint JSON and return exactly 3 coaching sentences:\n\n" +
    JSON.stringify(payload, null, 0)
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Rounds a float to 2 decimal places. */
function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}
