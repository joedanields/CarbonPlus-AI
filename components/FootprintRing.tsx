"use client";

import React from "react";
import type { BreakdownItem } from "../lib/types";
import { CATEGORY_COLORS } from "../lib/constants";

/**
 * FootprintRing — SVG Donut Chart for Emissions Breakdown
 *
 * Renders a proportional donut chart showing the split between
 * Transport, Diet, and Home Energy emissions. Includes a legend
 * with absolute kg values and percentage labels.
 */

interface FootprintRingProps {
  total: number;
  breakdown: BreakdownItem[];
}

function FootprintRingInner({ total, breakdown }: FootprintRingProps) {
  let offset = 0;
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[190px_1fr]">
      <div className="relative mx-auto h-44 w-44">
        <svg
          viewBox="0 0 42 42"
          className="-rotate-90"
          role="img"
          aria-label={`Emissions breakdown: ${breakdown.map((b) => `${b.label} ${Math.round(b.percentage)}%`).join(", ")}`}
        >
          <circle
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            stroke="#1d2b29"
            strokeWidth="4.2"
          />
          {breakdown.map((item, index) => {
            const currentOffset = offset;
            offset += item.percentage;
            return (
              <circle
                key={item.label}
                cx="21"
                cy="21"
                r="15.9"
                fill="none"
                stroke={CATEGORY_COLORS[index]}
                strokeWidth="4.2"
                strokeDasharray={`${item.percentage} ${100 - item.percentage}`}
                strokeDashoffset={-currentOffset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-white">
            {total.toFixed(1)}
          </span>
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
            kg CO2e
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {breakdown.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2 text-sm text-slate-300">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[index] }}
                aria-hidden="true"
              />
              {item.label}
            </span>
            <span className="text-sm font-medium text-white">
              {item.valueKg.toFixed(1)} kg
              <span className="ml-2 text-xs font-normal text-slate-500">
                {Math.round(item.percentage)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Memoized donut chart — only re-renders when total or breakdown changes. */
const FootprintRing = React.memo(FootprintRingInner);
FootprintRing.displayName = "FootprintRing";

export default FootprintRing;
