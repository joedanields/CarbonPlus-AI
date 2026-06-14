"use client";

import { Mission } from "../lib/types";

interface MissionProgressProps {
  mission: Mission;
  progress: number; // 0.0 to 1.0
}

export default function MissionProgress({ mission, progress }: MissionProgressProps) {
  return (
    <div className="mt-6 p-4 rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🎯</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-pulse">Current Mission</p>
            <h4 className="text-sm font-semibold text-white">{mission.title}</h4>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-400">
          {Math.round(progress * 100)}%
        </span>
      </div>

      <div
        className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress for ${mission.title} mission`}
      >
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-pulse transition-all duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-slate-500 italic">
        {mission.description}
      </p>
    </div>
  );
}
