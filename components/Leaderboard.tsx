import React from "react";

interface LeaderboardUser {
  rank: number;
  name: string;
  level: number;
  streak: number;
  ecoPoints: number;
}

// Mock data to render
const LEADERBOARD_DATA: LeaderboardUser[] = [
  { rank: 1, name: "NeoEco", level: 42, streak: 12, ecoPoints: 15420 },
  { rank: 2, name: "TrinityGreen", level: 38, streak: 8, ecoPoints: 12350 },
  { rank: 3, name: "MorpheusSustains", level: 35, streak: 5, ecoPoints: 11200 },
  { rank: 4, name: "CipherSave", level: 29, streak: 2, ecoPoints: 8900 },
  { rank: 5, name: "SwitchOn", level: 24, streak: 0, ecoPoints: 6500 },
];

export default function Leaderboard() {
  return (
    <div className="cyber-card p-6 border-2 border-cyber-purple rounded-xl bg-cyber-bg text-white shadow-[0_0_15px_rgba(255,0,255,0.2)]">
      <h2 className="text-2xl mb-6 font-bold neon-text glow-purple uppercase tracking-widest border-b border-cyber-purple pb-2">
        Network Rankings
      </h2>

      <div className="flex flex-col space-y-3">
        {LEADERBOARD_DATA.map((user) => {
          const isTopRank = user.rank === 1;

          return (
            <div
              key={user.rank}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                isTopRank
                  ? "border-cyber-cyan bg-black shadow-[0_0_15px_rgba(0,255,255,0.4)] z-10 scale-[1.02]"
                  : "border-gray-800 bg-gray-900/50 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* Rank Badge */}
                <span
                  className={`font-bold w-8 text-center ${
                    isTopRank ? "text-cyber-cyan glow-cyan text-xl" : "text-gray-400"
                  }`}
                >
                  #{user.rank}
                </span>

                {/* Inline SVG Avatar Placeholder */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isTopRank ? "border-cyber-cyan" : "border-gray-600"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-5 h-5 ${isTopRank ? "text-cyber-cyan" : "text-gray-400"}`}
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>

                {/* User Info */}
                <div className="flex flex-col">
                  <span
                    className={`font-semibold tracking-wide ${
                      isTopRank ? "text-cyber-cyan glow-cyan" : "text-white"
                    }`}
                  >
                    {user.name}
                  </span>
                  <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                    <span>Lv.{user.level}</span>
                    <span>•</span>
                    <span className="flex items-center text-cyber-purple">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-3 h-3 mr-1"
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
                className={`font-mono text-sm sm:text-base text-right font-bold tracking-wider ${
                  isTopRank ? "text-cyber-cyan glow-cyan" : "text-gray-300"
                }`}
              >
                {user.ecoPoints.toLocaleString()} <span className="text-xs font-normal text-gray-500">EP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
