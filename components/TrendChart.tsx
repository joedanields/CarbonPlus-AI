"use client";

import React from "react";
import type { ActivityLog } from "../lib/types";

/**
 * TrendChart — SVG Line Chart for Seven-Day Emission Trend
 *
 * Renders a polyline chart showing daily emissions over the most recent
 * 7 log entries, with a dashed baseline indicator.
 */

interface TrendChartProps {
  logs: ActivityLog[];
  dailyBaselineKg: number;
}

function TrendChartInner({ logs, dailyBaselineKg }: TrendChartProps) {
  const recent = logs.slice(-7);
  const max = Math.max(
    dailyBaselineKg,
    ...recent.map((log) => log.totalEmissionsKg)
  );
  const points = recent
    .map((log, index) => {
      const x =
        recent.length === 1
          ? 50
          : 8 + (index / (recent.length - 1)) * 84;
      return `${x},${90 - (log.totalEmissionsKg / max) * 72}`;
    })
    .join(" ");
  const baselineY = 90 - (dailyBaselineKg / max) * 72;

  if (recent.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">+</span>
        <p>Log your first day to begin a seven-day trend.</p>
      </div>
    );
  }

  return (
    <div>
      <svg
        viewBox="0 0 100 108"
        preserveAspectRatio="none"
        className="h-52 w-full overflow-visible"
        role="img"
        aria-label={`Seven-day emission trend. Latest: ${recent[recent.length - 1]?.totalEmissionsKg.toFixed(1)} kg CO2e. Baseline: ${dailyBaselineKg} kg.`}
      >
        {[18, 42, 66, 90].map((y) => (
          <line
            key={y}
            x1="5"
            x2="96"
            y1={y}
            y2={y}
            stroke="#1f312e"
            strokeWidth="0.6"
          />
        ))}
        <line
          x1="5"
          x2="96"
          y1={baselineY}
          y2={baselineY}
          stroke="#f8be5b"
          strokeDasharray="2 2"
          strokeWidth="0.8"
        />
        {recent.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="#42e8a5"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {recent.map((log, index) => {
          const x =
            recent.length === 1
              ? 50
              : 8 + (index / (recent.length - 1)) * 84;
          const y = 90 - (log.totalEmissionsKg / max) * 72;
          return (
            <circle
              key={log.id}
              cx={x}
              cy={y}
              r="1.8"
              fill="#09110f"
              stroke="#42e8a5"
              strokeWidth="1"
            />
          );
        })}
      </svg>
      <div className="flex justify-between text-[11px] uppercase tracking-wider text-slate-500">
        {recent.map((log) => (
          <span key={log.id}>
            {new Intl.DateTimeFormat("en", { weekday: "short" }).format(
              new Date(log.date)
            )}
          </span>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <span
          className="inline-block w-5 border-t border-dashed border-amber-300"
          aria-hidden="true"
        />
        Personal daily baseline: {dailyBaselineKg} kg CO2e
      </p>
    </div>
  );
}

/** Memoized trend chart — only re-renders when logs or baseline changes. */
const TrendChart = React.memo(TrendChartInner);
TrendChart.displayName = "TrendChart";

export default TrendChart;
