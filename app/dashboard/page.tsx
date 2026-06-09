import React from "react";
import ActivityForm from "../../components/ActivityForm";
import Leaderboard from "../../components/Leaderboard";

// A mock SVG Donut chart component to embed in the left column
function NativeSvgDonutChart() {
  return (
    <div className="cyber-card p-6 border-2 border-cyber-cyan rounded-xl bg-cyber-bg text-white shadow-[0_0_15px_rgba(0,255,255,0.2)] mb-6">
      <h3 className="text-xl font-bold text-cyber-cyan glow-cyan uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
        Emissions Breakdown
      </h3>
      <div className="flex justify-center items-center py-4">
        <svg viewBox="0 0 36 36" className="w-48 h-48 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
          <path
            className="text-gray-800"
            strokeDasharray="100, 100"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="text-cyber-cyan transition-all duration-1000 ease-out"
            strokeDasharray="45, 100"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="text-cyber-purple transition-all duration-1000 ease-out"
            strokeDasharray="30, 100"
            strokeDashoffset="-45"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="text-white transition-all duration-1000 ease-out"
            strokeDasharray="25, 100"
            strokeDashoffset="-75"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <text x="18" y="20.35" className="fill-cyber-cyan text-sm font-bold font-mono" textAnchor="middle">
            1.2t
          </text>
        </svg>
      </div>
      <div className="flex flex-col space-y-2 mt-4 text-sm font-mono">
        <div className="flex justify-between items-center">
          <span className="flex items-center"><span className="w-3 h-3 bg-cyber-cyan rounded-full mr-2 shadow-[0_0_5px_rgba(0,255,255,0.8)]"></span>Transport</span>
          <span className="text-gray-300">45%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center"><span className="w-3 h-3 bg-cyber-purple rounded-full mr-2 shadow-[0_0_5px_rgba(255,0,255,0.8)]"></span>Diet</span>
          <span className="text-gray-300">30%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center"><span className="w-3 h-3 bg-white rounded-full mr-2 shadow-[0_0_5px_rgba(255,255,255,0.8)]"></span>Home Energy</span>
          <span className="text-gray-300">25%</span>
        </div>
      </div>
    </div>
  );
}

// A mock banner component for AI Coach
function AICoachBanner() {
  return (
    <div className="cyber-card mt-6 p-6 border-2 border-white rounded-xl bg-gradient-to-r from-gray-900 to-black text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-20">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold uppercase tracking-widest mb-2 flex items-center">
        <span className="w-2 h-2 bg-cyber-cyan rounded-full mr-2 animate-pulse"></span>
        AI Coach Insight
      </h3>
      <p className="text-sm text-gray-300 italic mb-4 leading-relaxed relative z-10">
        "Switching your commute to cycling tomorrow could reduce your weekly footprint by 12% and earn you a 5-day streak bonus. The weather looks optimal."
      </p>
      <button className="text-xs font-bold uppercase tracking-wider px-4 py-2 border border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan hover:text-black transition-colors rounded">
        Accept Mission
      </button>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[image:var(--background-image-cyberGrid)] bg-black text-white p-6 font-sans">

      {/* Top Banner */}
      <header className="mb-8 border-b-2 border-cyber-cyan pb-4 flex items-center justify-center lg:justify-start">
        <h1 className="text-3xl md:text-4xl font-extrabold neon-text glow-cyan uppercase tracking-widest text-center">
          CarbonPulse <span className="text-gray-500 font-normal mx-2">//</span> <span className="text-xl md:text-2xl text-cyber-purple glow-purple">Sustainability Operating System</span>
        </h1>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">

        {/* Left Column: Metrics Breakdown & Donut Chart */}
        <div className="flex flex-col">
          <NativeSvgDonutChart />
          <Leaderboard />
        </div>

        {/* Main Panel: Primary Metrics Tracking */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <div className="cyber-card p-8 border-2 border-cyber-cyan rounded-xl bg-cyber-bg shadow-[0_0_20px_rgba(0,255,255,0.3)] flex flex-col h-full justify-between relative overflow-hidden">

            {/* Background decorative element */}
            <div className="absolute -right-10 -bottom-10 opacity-10">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-64 h-64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  <path d="M2 12h20" />
               </svg>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest mb-1">Global Footprint Score</h2>
              <div className="text-6xl font-black text-cyber-cyan glow-cyan mb-8">
                84.2 <span className="text-2xl text-gray-500 font-normal">/100</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border-l-4 border-cyber-purple pl-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Cumulative Carbon Saved</h3>
                <div className="text-3xl font-bold text-white tracking-wide mt-1">2,450 <span className="text-lg text-cyber-purple">kg CO₂</span></div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Active Weekly Target</h3>
                  <span className="text-cyber-cyan font-bold text-sm">75%</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-900 rounded-full h-3 border border-gray-800 p-0.5">
                  <div className="bg-cyber-cyan h-full rounded-full shadow-[0_0_10px_rgba(0,255,255,0.8)] relative" style={{ width: "75%" }}>
                     <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Form & AI Coach Banner */}
        <div className="flex flex-col">
          <ActivityForm />
          <AICoachBanner />
        </div>

      </div>
    </div>
  );
}
