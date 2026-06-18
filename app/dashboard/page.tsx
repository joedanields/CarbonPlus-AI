"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ActivityForm from "../../components/ActivityForm";
import FootprintRing from "../../components/FootprintRing";
import TrendChart from "../../components/TrendChart";
import Leaderboard from "../../components/Leaderboard";
import ConfirmDialog from "../../components/ConfirmDialog";
import MissionProgress from "../../components/MissionProgress";
import { processActivity } from "../../lib/activityProcessing";
import { generateDailyNudge } from "../../lib/insightEngine";
import { loadActivityLogs, saveActivityLogs, clearActivityLogs, loadUserSettings, saveUserSettings } from "../../lib/storage";
import { downloadLogsAsCSV } from "../../lib/exportData";
import { BENCHMARKS_KG_PER_DAY, DEFAULT_DAILY_BASELINE_KG, DEFAULT_WEEKLY_TARGET_KG, INPUT_LIMITS } from "../../lib/constants";
import { updateMissionProgress, suggestNextMission } from "../../lib/missionManager";
import type { ActivityLog, ActivityFormValues, UserSettings } from "../../lib/types";
import { AVAILABLE_MISSIONS } from "../../lib/missions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatKg(value: number): string {
  return `${value.toFixed(1)} kg`;
}

function prettyMode(mode: string): string {
  if (mode === "bike") return "Motorbike";
  if (mode === "cycle") return "Cycling";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [missionAccepted, setMissionAccepted] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
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
  });
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState("");

  // ── Hydrate from localStorage ───────────────────────────────────────────
  useEffect(() => {
    const storedLogs = loadActivityLogs();
    setLogs(storedLogs);
    const storedSettings = loadUserSettings();
    setSettings(storedSettings);
    setHydrated(true);
  }, []);

  // ── Persist on change ───────────────────────────────────────────────────
  useEffect(() => {
    if (hydrated) saveActivityLogs(logs);
  }, [hydrated, logs]);

  useEffect(() => {
    if (hydrated) saveUserSettings(settings);
  }, [hydrated, settings]);

  // ── Computed values (memoized) ──────────────────────────────────────────
  const latest = logs.at(-1);
  const weeklyLogs = useMemo(() => logs.slice(-7), [logs]);

  const weeklyTotal = useMemo(
    () => weeklyLogs.reduce((sum, log) => sum + log.totalEmissionsKg, 0),
    [weeklyLogs]
  );

  const weeklySaved = useMemo(
    () => weeklyLogs.reduce((sum, log) => sum + log.carbonSavedKg, 0),
    [weeklyLogs]
  );

  const totalPoints = useMemo(
    () => logs.reduce((sum, log) => sum + log.pointsEarned, 0),
    [logs]
  );

  const targetProgress = useMemo(
    () => Math.min(100, (weeklyTotal / settings.weeklyTargetKg) * 100),
    [weeklyTotal, settings.weeklyTargetKg]
  );

  const score = useMemo(() => {
    if (!latest) return 0;
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 - (latest.totalEmissionsKg / settings.dailyTargetKg) * 50
        )
      )
    );
  }, [latest, settings.dailyTargetKg]);

  // ── Nudge engine ────────────────────────────────────────────────────────
  const nudge = useMemo(() => generateDailyNudge(logs, settings.persona), [logs, settings.persona]);

  const fallbackInsight = latest?.breakdown && latest.breakdown.length > 0
    ? latest.breakdown.reduce((largest, item) =>
        item.valueKg > largest.valueKg ? item : largest
      )
    : undefined;
  const insightHeadline =
    nudge?.headline ??
    (fallbackInsight
      ? `Your biggest opportunity is ${fallbackInsight.label.toLowerCase()}`
      : "Your first insight is one log away");
  const insightMessage =
    nudge?.message ??
    (fallbackInsight
      ? `${fallbackInsight.label} produced ${fallbackInsight.valueKg.toFixed(1)} kg CO2e today. Start there for the clearest reduction.`
      : "Add transport, food, and electricity data to get a personalized action for the next 24 hours.");

  // ── Handlers (memoized) ─────────────────────────────────────────────────
  const currentStreak = useMemo(() => {
    if (logs.length === 0) return 0;

    // Sort logs by date descending
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDateToCheck = new Date(today);

    // Check if there is a log for today or yesterday to start the streak
    const hasLogTodayOrYesterday = sortedLogs.some(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(today.getTime() - logDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 1;
    });

    if (!hasLogTodayOrYesterday) return 0;

    for (let i = 0; i < sortedLogs.length; i++) {
      const logInfo = sortedLogs[i];
      if (!logInfo) continue;

      const logDate = new Date(logInfo.date);
      logDate.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(currentDateToCheck.getTime() - logDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0 || diffDays === 1) {
        if (diffDays === 1 || i === 0) { // Only increment streak for new days
            streak++;
            currentDateToCheck = new Date(logDate);
        }
      } else if (diffDays > 1) {
        break; // Streak broken
      }
    }

    return streak;
  }, [logs]);

  const handleLog = useCallback(
    (values: ActivityFormValues) => {
      const processed = processActivity({
        transport: { mode: values.transportMode, distanceKm: values.distanceKm },
        diet: values.diet,
        homeEnergyKwh: values.homeEnergyKwh,
        currentStreak,
        baselineFootprint: settings.dailyTargetKg,
      });

      const newLog = {
        ...processed,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: new Date().toISOString(),
        transport: {
          mode: values.transportMode,
          distanceKm: values.distanceKm,
        },
        diet: values.diet,
        homeEnergyKwh: values.homeEnergyKwh,
      };

      setLogs((current) => {
        const nextLogs = [...current, newLog].slice(-30);

        // Update mission progress
        setSettings((currentSettings) => {
          const { updatedState, newlyUnlockedBadges } = updateMissionProgress(nextLogs, currentSettings.missionState);
          const newSettings = {
            ...currentSettings,
            missionState: updatedState,
            unlockedBadges: [...currentSettings.unlockedBadges, ...newlyUnlockedBadges.map(b => b.id)]
          };
          saveUserSettings(newSettings);
          return newSettings;
        });

        return nextLogs;
      });

      setMissionAccepted(false);
    },
    [currentStreak, settings.dailyTargetKg]
  );

  const handleClearData = useCallback(() => {
    clearActivityLogs();
    setLogs([]);
    setMissionAccepted(false);
    setShowResetDialog(false);
  }, []);

  const handleExport = useCallback(() => {
    if (logs.length > 0) downloadLogsAsCSV(logs);
  }, [logs]);

  const handleMissionAccept = useCallback(() => {
    if (settings.missionState.activeMissionId) return;

    const nextMission = suggestNextMission(logs, settings.missionState.completedMissionIds);
    if (nextMission) {
      const newSettings = {
        ...settings,
        missionState: {
          ...settings.missionState,
          activeMissionId: nextMission.id,
          startedAt: new Date().toISOString(),
        }
      };
      setSettings(newSettings);
      saveUserSettings(newSettings);
    }
    setMissionAccepted(true);
  }, [logs, settings]);

  const handleSaveTarget = useCallback(() => {
    const value = Number(targetInput);
    if (
      Number.isFinite(value) &&
      value >= INPUT_LIMITS.DAILY_TARGET_KG_MIN &&
      value <= INPUT_LIMITS.DAILY_TARGET_KG_MAX
    ) {
      const newSettings = {
        ...settings,
        dailyTargetKg: value,
        weeklyTargetKg: Math.round(value * 7),
      };
      setSettings(newSettings);
      saveUserSettings(newSettings);
    }
    setEditingTarget(false);
  }, [targetInput, settings]);

  // ── Mission State ───────────────────────────────────────────────────────
  const activeMission = useMemo(() => {
    if (!settings.missionState.activeMissionId) return null;
    return AVAILABLE_MISSIONS.find((m) => m.id === settings.missionState.activeMissionId) || null;
  }, [settings.missionState.activeMissionId]);

  const missionProgress = useMemo(() => {
    if (!activeMission) return 0;
    return activeMission.criteria(logs);
  }, [activeMission, logs]);

  // ── Comparative context ─────────────────────────────────────────────────
  const comparisons = useMemo(() => {
    if (!latest) return null;
    const daily = latest.totalEmissionsKg;
    return {
      vsGlobal: Math.round(((daily - BENCHMARKS_KG_PER_DAY.global) / BENCHMARKS_KG_PER_DAY.global) * 100),
      vsIndia: Math.round(((daily - BENCHMARKS_KG_PER_DAY.india) / BENCHMARKS_KG_PER_DAY.india) * 100),
    };
  }, [latest]);

  return (
    <>
      <ConfirmDialog
        open={showResetDialog}
        title="Clear all data?"
        message="This will permanently delete all your locally saved activity logs and cannot be undone."
        confirmLabel="Clear data"
        cancelLabel="Keep data"
        onConfirm={handleClearData}
        onCancel={() => setShowResetDialog(false)}
      />

      <main
        id="main-content"
        className="min-h-screen bg-grid px-4 py-5 text-slate-100 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          {/* ── Header ───────────────────────────────────────────────── */}
          <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path
                    d="M5 14c5 0 9-3 12-8 1 7-2 12-8 13-2 .3-4-2-4-5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M7 17c2-3 5-5 9-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </span>
              <div>
                <p className="text-lg font-semibold tracking-tight text-white">
                  CarbonPulse
                </p>
                <p className="text-xs text-slate-500">
                  Small actions. Measurable impact.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="status-pill">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-300"
                  aria-hidden="true"
                />
                Data stays on this device
              </span>
              {logs.length > 0 && (
                <>
                  <button
                    onClick={handleExport}
                    className="text-xs text-slate-500 transition hover:text-white"
                    aria-label="Export activity logs as CSV"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => setShowResetDialog(true)}
                    className="text-xs text-slate-500 transition hover:text-white"
                    aria-label="Reset all activity data"
                  >
                    Reset
                  </button>
                </>
              )}
            </div>
          </header>

          {/* ── Hero Section ─────────────────────────────────────────── */}
          <section className="mb-7 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
            <div>
              <p className="eyebrow">Your personal dashboard</p>
              <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                See the impact of your day, then make tomorrow lighter.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                Track transport, food, and home energy. Get a clear footprint
                estimate and one practical next action.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 self-end">
              <div className="mini-stat">
                <span>Today&apos;s score</span>
                <strong>{score || "--"}</strong>
                <small>out of 100</small>
              </div>
              <div className="mini-stat">
                <span>Carbon saved</span>
                <strong>{weeklySaved.toFixed(1)}</strong>
                <small>kg this week</small>
              </div>
              <div className="mini-stat">
                <span>Eco points</span>
                <strong>{totalPoints}</strong>
                <small>all time</small>
              </div>
            </div>
          </section>

          {/* ── Live status region for screen readers ────────────────── */}
          <div className="sr-only" aria-live="polite" role="status">
            {latest &&
              `Latest footprint: ${latest.totalEmissionsKg.toFixed(1)} kg CO2e. Score: ${score} out of 100. Weekly total: ${weeklyTotal.toFixed(1)} kg.`}
          </div>

          {/* ── Main Grid ────────────────────────────────────────────── */}
          <div className="grid gap-5 lg:grid-cols-12">
            {/* Activity Form */}
            <div className="lg:col-span-5">
              <ActivityForm onLog={handleLog} />
            </div>

            {/* Snapshot */}
            <section
              className="panel p-5 sm:p-6 lg:col-span-7"
              aria-labelledby="snapshot-heading"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Latest snapshot</p>
                  <h2
                    id="snapshot-heading"
                    className="mt-1 text-2xl font-semibold text-white"
                  >
                    {latest
                      ? "Where your carbon came from"
                      : "Your footprint breakdown"}
                  </h2>
                </div>
                {latest && (
                  <span className="status-pill">
                    {new Date(latest.date).toLocaleDateString()}
                  </span>
                )}
              </div>
              {latest ? (
                <>
                  <FootprintRing
                    total={latest.totalEmissionsKg}
                    breakdown={latest.breakdown}
                  />
                  {/* Comparative context */}
                  {comparisons && (
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3 text-center">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">vs Global Avg</p>
                        <p className={`mt-1 text-lg font-semibold ${comparisons.vsGlobal <= 0 ? "text-emerald-300" : "text-amber-300"}`}>
                          {comparisons.vsGlobal <= 0 ? "" : "+"}{comparisons.vsGlobal}%
                        </p>
                        <p className="text-[10px] text-slate-500">{BENCHMARKS_KG_PER_DAY.global} kg/day avg</p>
                      </div>
                      <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3 text-center">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">vs India Avg</p>
                        <p className={`mt-1 text-lg font-semibold ${comparisons.vsIndia <= 0 ? "text-emerald-300" : "text-amber-300"}`}>
                          {comparisons.vsIndia <= 0 ? "" : "+"}{comparisons.vsIndia}%
                        </p>
                        <p className="text-[10px] text-slate-500">{BENCHMARKS_KG_PER_DAY.india} kg/day avg</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state min-h-52">
                  <span className="empty-icon" aria-hidden="true">
                    0
                  </span>
                  <p>
                    Your transport, food, and energy breakdown will appear here.
                  </p>
                </div>
              )}
            </section>

            {/* Trend Chart */}
            <section
              className="panel p-5 sm:p-6 lg:col-span-7"
              aria-labelledby="trend-heading"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="eyebrow">Track progress</p>
                  <h2
                    id="trend-heading"
                    className="mt-1 text-xl font-semibold text-white"
                  >
                    Seven-day footprint trend
                  </h2>
                </div>
                <span className="text-right">
                  <strong className="block text-xl font-semibold text-white">
                    {formatKg(weeklyTotal)}
                  </strong>
                  <small className="text-xs text-slate-500">
                    logged this week
                  </small>
                </span>
              </div>
              <TrendChart logs={logs} dailyBaselineKg={settings.dailyTargetKg} />
            </section>

            {/* Insight Panel */}
            <section
              className="panel insight-panel p-5 sm:p-6 lg:col-span-5"
              aria-labelledby="insight-heading"
            >
              <div className="flex h-full flex-col">
                <p className="eyebrow">Personalized next step</p>
                <h2
                  id="insight-heading"
                  className="mt-2 text-2xl font-semibold text-white"
                >
                  {insightHeadline}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">
                  {insightMessage}
                </p>
                {latest && (
                  <div className="mt-5 rounded-xl border border-white/8 bg-black/20 p-4">
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-slate-400">
                        Weekly target usage
                      </span>
                      <span className="text-white">
                        {Math.round(targetProgress)}%
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-slate-800"
                      role="progressbar"
                      aria-valuenow={Math.round(targetProgress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Weekly carbon target progress"
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          targetProgress > 90
                            ? "bg-amber-300"
                            : "bg-emerald-300"
                        }`}
                        style={{ width: `${targetProgress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {Math.max(
                        0,
                        settings.weeklyTargetKg - weeklyTotal
                      ).toFixed(1)}{" "}
                      kg remains in your {settings.weeklyTargetKg} kg weekly
                      budget.
                    </p>
                  </div>
                )}

                {/* Goal Setting */}
                <div className="mt-4 flex items-center gap-2">
                  {editingTarget ? (
                    <>
                      <label htmlFor="daily-target-input" className="sr-only">Daily target in kg CO2e</label>
                      <input
                        id="daily-target-input"
                        type="number"
                        value={targetInput}
                        onChange={(e) => setTargetInput(e.target.value)}
                        className="field-control w-20 text-sm"
                        min={INPUT_LIMITS.DAILY_TARGET_KG_MIN}
                        max={INPUT_LIMITS.DAILY_TARGET_KG_MAX}
                        step="0.5"
                        placeholder={String(settings.dailyTargetKg)}
                        aria-label="Daily carbon target in kg CO2e"
                      />
                      <span className="text-xs text-slate-500">kg/day</span>
                      <button
                        type="button"
                        onClick={handleSaveTarget}
                        className="text-xs font-medium text-pulse hover:underline"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTarget(false)}
                        className="text-xs text-slate-500 hover:underline"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetInput(String(settings.dailyTargetKg));
                        setEditingTarget(true);
                      }}
                      className="text-xs text-slate-500 transition hover:text-white"
                      aria-label={`Current daily target: ${settings.dailyTargetKg} kg. Click to change.`}
                    >
                      Daily target: {settings.dailyTargetKg} kg · Edit
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setMissionAccepted(true)}
                  disabled={!latest || missionAccepted}
                  className="secondary-button mt-4"
                >
                  {missionAccepted
                    ? "Action added for tomorrow"
                    : "Commit to this action"}
                </button>
              </div>
            </section>

            {/* History Table */}
            <section
              className="panel p-5 sm:p-6 lg:col-span-7"
              aria-labelledby="history-heading"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="eyebrow">Recent activity</p>
                  <h2
                    id="history-heading"
                    className="mt-1 text-xl font-semibold text-white"
                  >
                    Your last check-ins
                  </h2>
                </div>
                <span className="status-pill">{logs.length} saved</span>
              </div>
              {logs.length === 0 ? (
                <p className="py-5 text-sm text-slate-500">
                  No activity logged yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th scope="col" className="pb-3 font-medium">Date</th>
                        <th scope="col" className="pb-3 font-medium">Transport</th>
                        <th scope="col" className="pb-3 font-medium">Diet</th>
                        <th scope="col" className="pb-3 font-medium">Footprint</th>
                        <th scope="col" className="pb-3 text-right font-medium">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/6">
                      {[...logs]
                        .reverse()
                        .slice(0, 5)
                        .map((log) => (
                          <tr key={log.id}>
                            <td className="py-3 text-slate-300">
                              {new Date(log.date).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-slate-300">
                              {prettyMode(log.transport.mode)} ·{" "}
                              {log.transport.distanceKm} km
                            </td>
                            <td className="py-3 capitalize text-slate-300">
                              {log.diet.replace("_", " ")}
                            </td>
                            <td className="py-3 font-medium text-white">
                              {formatKg(log.totalEmissionsKg)}
                            </td>
                            <td className="py-3 text-right">
                              <span
                                className={
                                  log.carbonDeltaKg <= 0
                                    ? "text-emerald-300"
                                    : "text-amber-300"
                                }
                              >
                                {log.carbonDeltaKg <= 0
                                  ? `${log.carbonSavedKg.toFixed(1)} kg below baseline`
                                  : `${log.carbonDeltaKg.toFixed(1)} kg above baseline`}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Leaderboard & Missions */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {!activeMission ? (
                <section className="panel p-5 sm:p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Ready for a challenge?</h3>
                  <p className="text-sm text-slate-400 mb-4">Take on a new mission to reduce your footprint and earn extra eco-points.</p>
                  <button
                    type="button"
                    onClick={handleMissionAccept}
                    className="primary-button w-full"
                  >
                    Accept New Mission
                  </button>
                </section>
              ) : (
                <div className="mb-4">
                  <MissionProgress mission={activeMission} progress={missionProgress} />
                </div>
              )}

              <Leaderboard userPoints={totalPoints} />
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────── */}
          <footer className="mt-8 flex flex-col gap-2 border-t border-white/8 py-5 text-xs text-slate-600 sm:flex-row sm:justify-between">
            <p>
              Estimates use published average emission factors and are intended
              for personal guidance.
            </p>
            <p>CarbonPulse MVP · Local-first and dependency-light</p>
          </footer>
        </div>
      </main>
    </>
  );
}
