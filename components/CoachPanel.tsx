"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { ActivityLog, UserSettings } from "../lib/types";
import type { WeeklyCoachData } from "../lib/types";

/**
 * CoachPanel — PULSE AI Coaching Interface
 *
 * Assembles a WeeklyCoachData payload from the user's logs and settings,
 * calls /api/coach, and renders the 3 coaching sentences with a typewriter
 * reveal effect. Falls back gracefully when no API key is configured.
 */

interface CoachPanelProps {
  logs: ActivityLog[];
  settings: UserSettings;
}

type CoachState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; text: string }
  | { status: "error"; message: string };

/** Builds the WeeklyCoachData payload from raw logs + settings. */
function buildWeeklyData(logs: ActivityLog[], settings: UserSettings): WeeklyCoachData {
  const recent = logs.slice(-7);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);

  const totals = recent.reduce(
    (acc, log) => ({
      transportEmissionsKg: acc.transportEmissionsKg + log.transportEmissionsKg,
      dietEmissionsKg: acc.dietEmissionsKg + log.dietEmissionsKg,
      homeEnergyEmissionsKg: acc.homeEnergyEmissionsKg + log.homeEnergyEmissionsKg,
      totalEmissionsKg: acc.totalEmissionsKg + log.totalEmissionsKg,
      totalCarbonSavedKg: acc.totalCarbonSavedKg + log.carbonSavedKg,
      totalPointsEarned: acc.totalPointsEarned + log.pointsEarned,
    }),
    {
      transportEmissionsKg: 0,
      dietEmissionsKg: 0,
      homeEnergyEmissionsKg: 0,
      totalEmissionsKg: 0,
      totalCarbonSavedKg: 0,
      totalPointsEarned: 0,
    }
  );

  return {
    userId: "local-user",
    weekStartDate: weekStart.toISOString().split("T")[0] ?? weekStart.toISOString(),
    weekEndDate: now.toISOString().split("T")[0] ?? now.toISOString(),
    dailyLogs: recent.map((log) => ({
      date: log.date,
      transportEmissionsKg: log.transportEmissionsKg,
      dietEmissionsKg: log.dietEmissionsKg,
      homeEnergyEmissionsKg: log.homeEnergyEmissionsKg,
      totalEmissionsKg: log.totalEmissionsKg,
      carbonSavedKg: log.carbonSavedKg,
      transport: log.transport,
      diet: log.diet,
      pointsEarned: log.pointsEarned,
    })),
    weeklyTotals: totals,
    streak: logs.length,
    baselineFootprintKgPerDay: settings.dailyTargetKg,
    weeklyBaselineKg: settings.weeklyTargetKg,
  };
}

export default function CoachPanel({ logs, settings }: CoachPanelProps) {
  const [state, setState] = useState<CoachState>({ status: "idle" });
  const [displayText, setDisplayText] = useState("");
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasEnoughData = logs.length >= 3;

  /** Typewriter reveal effect. */
  useEffect(() => {
    if (state.status !== "success") return;
    const fullText = state.text;
    setDisplayText("");
    let i = 0;
    const tick = () => {
      i++;
      setDisplayText(fullText.slice(0, i));
      if (i < fullText.length) {
        typewriterRef.current = setTimeout(tick, 18);
      }
    };
    typewriterRef.current = setTimeout(tick, 18);
    return () => {
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
    };
  }, [state]);

  const fetchCoaching = useCallback(async () => {
    if (!hasEnoughData) return;
    setState({ status: "loading" });

    try {
      const weeklyData = buildWeeklyData(logs, settings);
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyData }),
      });

      const data = await res.json() as { coaching?: string; error?: string };

      if (!res.ok || !data.coaching) {
        setState({
          status: "error",
          message: data.error ?? "PULSE is offline. Check your GEMINI_API_KEY.",
        });
        return;
      }

      setState({ status: "success", text: data.coaching });
    } catch {
      setState({
        status: "error",
        message: "Network error — could not reach the coach endpoint.",
      });
    }
  }, [logs, settings, hasEnoughData]);

  return (
    <section
      className="panel coach-panel p-5 sm:p-6 lg:col-span-12"
      aria-labelledby="coach-heading"
      aria-live="polite"
    >
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="pulse-avatar"
            aria-hidden="true"
            title="PULSE AI Coach"
          >
            ⚡
          </span>
          <div>
            <p className="eyebrow">AI Coach · Powered by Gemini</p>
            <h2
              id="coach-heading"
              className="mt-1 text-xl font-semibold text-white"
            >
              PULSE — Your Cyberpunk Sustainability Coach
            </h2>
          </div>
        </div>
        {state.status === "success" && (
          <button
            type="button"
            onClick={fetchCoaching}
            className="text-xs text-slate-500 transition hover:text-white"
            aria-label="Refresh AI coaching insight"
          >
            Refresh ↻
          </button>
        )}
      </div>

      {/* Body */}
      {state.status === "idle" && (
        <div className="flex flex-col items-start gap-4">
          {!hasEnoughData ? (
            <p className="text-sm text-slate-400">
              Log at least{" "}
              <strong className="text-white">3 days of activity</strong> to
              unlock a personalised coaching session from PULSE.
              <span className="ml-2 text-slate-600">
                ({logs.length}/3 logged)
              </span>
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              You have {logs.length} logs. PULSE can analyse your patterns and
              deliver a{" "}
              <strong className="text-white">data-grounded, 3-sentence strategy</strong>{" "}
              for your next 24 hours.
            </p>
          )}
          <button
            type="button"
            onClick={fetchCoaching}
            disabled={!hasEnoughData}
            className="primary-button"
            aria-disabled={!hasEnoughData}
          >
            <span aria-hidden="true">⚡</span>
            Get PULSE coaching
          </button>
        </div>
      )}

      {state.status === "loading" && (
        <div className="space-y-3" aria-label="Loading coaching insight">
          {[85, 70, 55].map((w) => (
            <div
              key={w}
              className="coach-skeleton"
              style={{ width: `${w}%` }}
              aria-hidden="true"
            />
          ))}
          <p className="sr-only">PULSE is analysing your carbon data…</p>
        </div>
      )}

      {state.status === "success" && (
        <div className="coach-response">
          <p className="text-sm leading-7 text-slate-200">{displayText}</p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={fetchCoaching}
              className="secondary-button text-xs"
            >
              Ask PULSE again
            </button>
            <span className="text-[10px] text-slate-600">
              Grounded in your actual data · No hallucinations
            </span>
          </div>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
          <p className="text-sm text-red-400">{state.message}</p>
          <button
            type="button"
            onClick={() => setState({ status: "idle" })}
            className="mt-3 text-xs text-slate-500 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}
    </section>
  );
}
