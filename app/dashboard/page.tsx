"use client";

import { useEffect, useMemo, useState } from "react";
import ActivityForm, { type ActivityFormValues } from "../../components/ActivityForm";
import { processActivity, type ProcessedActivity } from "../../activityProcessing";
import { generateDailyNudge, type RecentLog } from "../../insightEngine";

const STORAGE_KEY = "carbonpulse.activity-logs.v1";
const DAILY_BASELINE_KG = 12;
const WEEKLY_TARGET_KG = 70;
const CATEGORY_COLORS = ["#42e8a5", "#8cb4ff", "#f8be5b"];

interface ActivityLog extends ProcessedActivity {
  id: string;
  date: string;
  transport: { mode: ActivityFormValues["transportMode"]; distanceKm: number };
  diet: ActivityFormValues["diet"];
  homeEnergyKwh: number;
}

function formatKg(value: number) {
  return `${value.toFixed(1)} kg`;
}

function prettyMode(mode: string) {
  if (mode === "bike") return "Motorbike";
  if (mode === "cycle") return "Cycling";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function FootprintRing({ total, breakdown }: { total: number; breakdown: ProcessedActivity["breakdown"] }) {
  let offset = 0;
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[190px_1fr]">
      <div className="relative mx-auto h-44 w-44">
        <svg viewBox="0 0 42 42" className="-rotate-90" role="img" aria-label="Emissions breakdown">
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#1d2b29" strokeWidth="4.2" />
          {breakdown.map((item, index) => {
            const currentOffset = offset;
            offset += item.percentage;
            return (
              <circle key={item.label} cx="21" cy="21" r="15.9" fill="none" stroke={CATEGORY_COLORS[index]}
                strokeWidth="4.2" strokeDasharray={`${item.percentage} ${100 - item.percentage}`}
                strokeDashoffset={-currentOffset} />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-white">{total.toFixed(1)}</span>
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">kg CO2e</span>
        </div>
      </div>
      <div className="space-y-3">
        {breakdown.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[index] }} />
              {item.label}
            </span>
            <span className="text-sm font-medium text-white">
              {item.valueKg.toFixed(1)} kg
              <span className="ml-2 text-xs font-normal text-slate-500">{Math.round(item.percentage)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendChart({ logs }: { logs: ActivityLog[] }) {
  const recent = logs.slice(-7);
  const max = Math.max(DAILY_BASELINE_KG, ...recent.map((log) => log.totalEmissionsKg));
  const points = recent.map((log, index) => {
    const x = recent.length === 1 ? 50 : 8 + (index / (recent.length - 1)) * 84;
    return `${x},${90 - (log.totalEmissionsKg / max) * 72}`;
  }).join(" ");
  const baselineY = 90 - (DAILY_BASELINE_KG / max) * 72;

  if (recent.length === 0) {
    return <div className="empty-state"><span className="empty-icon">+</span><p>Log your first day to begin a seven-day trend.</p></div>;
  }

  return (
    <div>
      <svg viewBox="0 0 100 108" preserveAspectRatio="none" className="h-52 w-full overflow-visible">
        {[18, 42, 66, 90].map((y) => <line key={y} x1="5" x2="96" y1={y} y2={y} stroke="#1f312e" strokeWidth="0.6" />)}
        <line x1="5" x2="96" y1={baselineY} y2={baselineY} stroke="#f8be5b" strokeDasharray="2 2" strokeWidth="0.8" />
        {recent.length > 1 && <polyline points={points} fill="none" stroke="#42e8a5" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
        {recent.map((log, index) => {
          const x = recent.length === 1 ? 50 : 8 + (index / (recent.length - 1)) * 84;
          const y = 90 - (log.totalEmissionsKg / max) * 72;
          return <circle key={log.id} cx={x} cy={y} r="1.8" fill="#09110f" stroke="#42e8a5" strokeWidth="1" />;
        })}
      </svg>
      <div className="flex justify-between text-[11px] uppercase tracking-wider text-slate-500">
        {recent.map((log) => <span key={log.id}>{new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(log.date))}</span>)}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-block w-5 border-t border-dashed border-amber-300" />
        Personal daily baseline: {DAILY_BASELINE_KG} kg CO2e
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [missionAccepted, setMissionAccepted] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setLogs(JSON.parse(stored) as ActivityLog[]);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [hydrated, logs]);

  const latest = logs.at(-1);
  const weeklyLogs = logs.slice(-7);
  const weeklyTotal = weeklyLogs.reduce((sum, log) => sum + log.totalEmissionsKg, 0);
  const weeklySaved = weeklyLogs.reduce((sum, log) => sum + log.carbonSavedKg, 0);
  const totalPoints = logs.reduce((sum, log) => sum + log.pointsEarned, 0);
  const targetProgress = Math.min(100, (weeklyTotal / WEEKLY_TARGET_KG) * 100);
  const score = latest ? Math.max(0, Math.min(100, Math.round(100 - (latest.totalEmissionsKg / DAILY_BASELINE_KG) * 50))) : 0;

  const recentLogs = useMemo<RecentLog[]>(() => logs.slice(-3).reverse().map((log) => ({
    date: log.date, transport: log.transport, diet: log.diet, totalCarbonSaved: log.carbonSavedKg,
  })), [logs]);
  const nudge = generateDailyNudge(recentLogs);
  const fallbackInsight = latest?.breakdown.reduce((largest, item) => item.valueKg > largest.valueKg ? item : largest);
  const insightHeadline = nudge?.headline.replace(/[^\x20-\x7E]/g, "").trim()
    ?? (fallbackInsight ? `Your biggest opportunity is ${fallbackInsight.label.toLowerCase()}` : "Your first insight is one log away");
  const insightMessage = nudge?.message.replace(/[^\x20-\x7E]/g, "").replace(/COe/g, "CO2e")
    ?? (fallbackInsight
      ? `${fallbackInsight.label} produced ${fallbackInsight.valueKg.toFixed(1)} kg CO2e today. Start there for the clearest reduction.`
      : "Add transport, food, and electricity data to get a personalized action for the next 24 hours.");

  function handleLog(values: ActivityFormValues) {
    const processed = processActivity({
      transport: { mode: values.transportMode, distanceKm: values.distanceKm },
      diet: values.diet,
      homeEnergyKwh: values.homeEnergyKwh,
      currentStreak: Math.min(logs.length, 30),
      baselineFootprint: DAILY_BASELINE_KG,
    });
    setLogs((current) => [...current, {
      ...processed,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: new Date().toISOString(),
      transport: { mode: values.transportMode, distanceKm: values.distanceKm },
      diet: values.diet,
      homeEnergyKwh: values.homeEnergyKwh,
    }].slice(-30));
    setMissionAccepted(false);
  }

  function clearData() {
    if (window.confirm("Clear all locally saved activity logs?")) {
      setLogs([]);
      setMissionAccepted(false);
    }
  }

  return (
    <main className="min-h-screen bg-grid px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M5 14c5 0 9-3 12-8 1 7-2 12-8 13-2 .3-4-2-4-5Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M7 17c2-3 5-5 9-7" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
            </span>
            <div><p className="text-lg font-semibold tracking-tight text-white">CarbonPulse</p><p className="text-xs text-slate-500">Small actions. Measurable impact.</p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="status-pill"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />Data stays on this device</span>
            {logs.length > 0 && <button onClick={clearData} className="text-xs text-slate-500 transition hover:text-white">Reset</button>}
          </div>
        </header>

        <section className="mb-7 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <div>
            <p className="eyebrow">Your personal dashboard</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">See the impact of your day, then make tomorrow lighter.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">Track transport, food, and home energy. Get a clear footprint estimate and one practical next action.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 self-end">
            <div className="mini-stat"><span>Today&apos;s score</span><strong>{score || "--"}</strong><small>out of 100</small></div>
            <div className="mini-stat"><span>Carbon saved</span><strong>{weeklySaved.toFixed(1)}</strong><small>kg this week</small></div>
            <div className="mini-stat"><span>Eco points</span><strong>{totalPoints}</strong><small>all time</small></div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-5"><ActivityForm onLog={handleLog} /></div>
          <section className="panel p-5 sm:p-6 lg:col-span-7" aria-labelledby="snapshot-heading">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div><p className="eyebrow">Latest snapshot</p><h2 id="snapshot-heading" className="mt-1 text-2xl font-semibold text-white">{latest ? "Where your carbon came from" : "Your footprint breakdown"}</h2></div>
              {latest && <span className="status-pill">{new Date(latest.date).toLocaleDateString()}</span>}
            </div>
            {latest ? <FootprintRing total={latest.totalEmissionsKg} breakdown={latest.breakdown} /> : <div className="empty-state min-h-52"><span className="empty-icon">0</span><p>Your transport, food, and energy breakdown will appear here.</p></div>}
          </section>

          <section className="panel p-5 sm:p-6 lg:col-span-7" aria-labelledby="trend-heading">
            <div className="mb-4 flex items-start justify-between">
              <div><p className="eyebrow">Track progress</p><h2 id="trend-heading" className="mt-1 text-xl font-semibold text-white">Seven-day footprint trend</h2></div>
              <span className="text-right"><strong className="block text-xl font-semibold text-white">{formatKg(weeklyTotal)}</strong><small className="text-xs text-slate-500">logged this week</small></span>
            </div>
            <TrendChart logs={logs} />
          </section>

          <section className="panel insight-panel p-5 sm:p-6 lg:col-span-5" aria-labelledby="insight-heading">
            <div className="flex h-full flex-col">
              <p className="eyebrow">Personalized next step</p>
              <h2 id="insight-heading" className="mt-2 text-2xl font-semibold text-white">{insightHeadline}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{insightMessage}</p>
              {latest && <div className="mt-5 rounded-xl border border-white/8 bg-black/20 p-4">
                <div className="mb-2 flex justify-between text-xs"><span className="text-slate-400">Weekly target usage</span><span className="text-white">{Math.round(targetProgress)}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${targetProgress > 90 ? "bg-amber-300" : "bg-emerald-300"}`} style={{ width: `${targetProgress}%` }} /></div>
                <p className="mt-2 text-xs text-slate-500">{Math.max(0, WEEKLY_TARGET_KG - weeklyTotal).toFixed(1)} kg remains in your {WEEKLY_TARGET_KG} kg weekly budget.</p>
              </div>}
              <button type="button" onClick={() => setMissionAccepted(true)} disabled={!latest || missionAccepted} className="secondary-button mt-5">{missionAccepted ? "Action added for tomorrow" : "Commit to this action"}</button>
            </div>
          </section>

          <section className="panel p-5 sm:p-6 lg:col-span-12" aria-labelledby="history-heading">
            <div className="mb-4 flex items-center justify-between"><div><p className="eyebrow">Recent activity</p><h2 id="history-heading" className="mt-1 text-xl font-semibold text-white">Your last check-ins</h2></div><span className="status-pill">{logs.length} saved</span></div>
            {logs.length === 0 ? <p className="py-5 text-sm text-slate-500">No activity logged yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-slate-500"><tr><th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium">Transport</th><th className="pb-3 font-medium">Diet</th><th className="pb-3 font-medium">Footprint</th><th className="pb-3 text-right font-medium">Result</th></tr></thead>
                  <tbody className="divide-y divide-white/6">
                    {[...logs].reverse().slice(0, 5).map((log) => <tr key={log.id}>
                      <td className="py-3 text-slate-300">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="py-3 text-slate-300">{prettyMode(log.transport.mode)} · {log.transport.distanceKm} km</td>
                      <td className="py-3 capitalize text-slate-300">{log.diet.replace("_", " ")}</td>
                      <td className="py-3 font-medium text-white">{formatKg(log.totalEmissionsKg)}</td>
                      <td className="py-3 text-right"><span className={log.carbonDeltaKg <= 0 ? "text-emerald-300" : "text-amber-300"}>{log.carbonDeltaKg <= 0 ? `${log.carbonSavedKg.toFixed(1)} kg below baseline` : `${log.carbonDeltaKg.toFixed(1)} kg above baseline`}</span></td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <footer className="mt-8 flex flex-col gap-2 border-t border-white/8 py-5 text-xs text-slate-600 sm:flex-row sm:justify-between">
          <p>Estimates use published average emission factors and are intended for personal guidance.</p>
          <p>CarbonPulse MVP · Local-first and dependency-light</p>
        </footer>
      </div>
    </main>
  );
}
