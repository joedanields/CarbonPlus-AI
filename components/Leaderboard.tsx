"use client";

import React from "react";

/**
 * Leaderboard — Community Rankings Panel
 *
 * Displays a mock community leaderboard showing eco-points rankings.
 * Restyled to match the CarbonPulse design system (panel, eyebrow, brand colors).
 */

interface LeaderboardUser {
  rank: number;
  name: string;
  level: number;
  streak: number;
  ecoPoints: number;
}

const LEADERBOARD_DATA: LeaderboardUser[] = [
  { rank: 1, name: "NeoEco", level: 42, streak: 12, ecoPoints: 15420 },
  { rank: 2, name: "TrinityGreen", level: 38, streak: 8, ecoPoints: 12350 },
  { rank: 3, name: "MorpheusSustains", level: 35, streak: 5, ecoPoints: 11200 },
  { rank: 4, name: "CipherSave", level: 29, streak: 2, ecoPoints: 8900 },
  { rank: 5, name: "SwitchOn", level: 24, streak: 0, ecoPoints: 6500 },
];

interface LeaderboardProps {
  /** Current user's total eco points (to highlight their standing). */
  userPoints: number;
}

function LeaderboardInner({ userPoints }: LeaderboardProps) {
  // Find where the user would rank
  const userRank =
    LEADERBOARD_DATA.filter((u) => u.ecoPoints > userPoints).length + 1;

  return (
    <section
      className="panel p-5 sm:p-6"
      aria-labelledby="leaderboard-heading"
    >
      <div className="mb-5">
        <p className="eyebrow">Community</p>
        <h2
          id="leaderboard-heading"
          className="mt-1 text-xl font-semibold text-white"
        >
          Network Rankings
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Your rank: #{userRank} with {userPoints.toLocaleString()} EP
        </p>
      </div>

      <div
        className="flex flex-col space-y-2"
        role="list"
        aria-label="Leaderboard rankings"
      >
        {LEADERBOARD_DATA.map((user) => {
          const isTopRank = user.rank === 1;

          return (
            <div
              key={user.rank}
              role="listitem"
              className={`flex items-center justify-between rounded-lg border p-3 transition-all duration-200 ${
                isTopRank
                  ? "border-pulse/40 bg-pulse/5 shadow-[0_0_12px_rgba(66,232,165,0.15)]"
                  : "border-white/8 bg-white/[0.02] hover:border-white/15"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <span
                  className={`w-8 text-center font-bold ${
                    isTopRank ? "text-pulse text-lg" : "text-slate-500"
                  }`}
                  aria-label={`Rank ${user.rank}`}
                >
                  #{user.rank}
                </span>

                {/* Avatar Placeholder */}
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                    isTopRank ? "border-pulse" : "border-white/15"
                  }`}
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-4 w-4 ${
                      isTopRank ? "text-pulse" : "text-slate-500"
                    }`}
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>

                {/* User Info */}
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-semibold tracking-wide ${
                      isTopRank ? "text-pulse" : "text-white"
                    }`}
                  >
                    {user.name}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>Lv.{user.level}</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center text-pulse/70">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="mr-0.5 h-3 w-3"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {user.streak} streak
                    </span>
                  </div>
                </div>
              </div>

              {/* Eco Points */}
              <div
                className={`text-right text-sm font-bold tracking-wider ${
                  isTopRank ? "text-pulse" : "text-slate-300"
                }`}
              >
                {user.ecoPoints.toLocaleString()}{" "}
                <span className="text-[10px] font-normal text-slate-500">
                  EP
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Memoized leaderboard — only re-renders when user points change. */
const Leaderboard = React.memo(LeaderboardInner);
Leaderboard.displayName = "Leaderboard";

export default Leaderboard;
