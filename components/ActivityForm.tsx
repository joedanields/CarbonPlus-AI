"use client";

import React, { useState, FormEvent } from "react";

type TransportMode = "Walk" | "Cycle" | "Bus" | "Train" | "Car" | "Bike";
type DietType = "Vegan" | "Vegetarian" | "Mixed" | "High Meat";

export default function ActivityForm() {
  const [transportMode, setTransportMode] = useState<TransportMode>("Walk");
  const [distance, setDistance] = useState<number | "">("");
  const [dietType, setDietType] = useState<DietType>("Mixed");
  const [homeEnergy, setHomeEnergy] = useState<number | "">("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transportMode,
          distance: Number(distance),
          dietType,
          homeEnergy: Number(homeEnergy),
        }),
      });

      if (response.ok) {
        setStatusMessage("Telemetry synchronized.");
        setTransportMode("Walk");
        setDistance("");
        setDietType("Mixed");
        setHomeEnergy("");
      } else {
        setStatusMessage("Error synchronizing telemetry.");
      }
    } catch (error) {
      setStatusMessage("Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cyber-card p-6 border-2 border-cyber-cyan rounded-xl bg-cyber-bg text-white shadow-[0_0_15px_rgba(0,255,255,0.2)]">
      <h2 className="text-2xl mb-6 font-bold neon-text glow-cyan uppercase tracking-widest border-b border-cyber-cyan pb-2">Log Telemetry</h2>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-5">

        {/* Transport Mode */}
        <div className="flex flex-col">
          <label htmlFor="transportMode" className="text-xs uppercase tracking-wider text-cyber-cyan mb-2 font-semibold">Transport Mode</label>
          <select
            id="transportMode"
            value={transportMode}
            onChange={(e) => setTransportMode(e.target.value as TransportMode)}
            className="p-3 bg-black border border-cyber-cyan text-white rounded focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-shadow glow-cyan appearance-none"
            required
          >
            <option value="Walk">Walk</option>
            <option value="Cycle">Cycle</option>
            <option value="Bus">Bus</option>
            <option value="Train">Train</option>
            <option value="Car">Car</option>
            <option value="Bike">Bike</option>
          </select>
        </div>

        {/* Distance */}
        <div className="flex flex-col">
          <label htmlFor="distance" className="text-xs uppercase tracking-wider text-cyber-cyan mb-2 font-semibold">Distance (km)</label>
          <input
            type="number"
            id="distance"
            value={distance}
            onChange={(e) => setDistance(e.target.value === "" ? "" : Number(e.target.value))}
            className="p-3 bg-black border border-cyber-cyan text-white rounded focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-shadow glow-cyan"
            required
            min="0"
            step="0.1"
            placeholder="0.0"
          />
        </div>

        {/* Diet Type */}
        <div className="flex flex-col">
          <label htmlFor="dietType" className="text-xs uppercase tracking-wider text-cyber-purple mb-2 font-semibold">Diet Type</label>
          <select
            id="dietType"
            value={dietType}
            onChange={(e) => setDietType(e.target.value as DietType)}
            className="p-3 bg-black border border-cyber-purple text-white rounded focus:outline-none focus:border-cyber-purple focus:ring-1 focus:ring-cyber-purple transition-shadow glow-purple appearance-none"
            required
          >
            <option value="Vegan">Vegan</option>
            <option value="Vegetarian">Vegetarian</option>
            <option value="Mixed">Mixed</option>
            <option value="High Meat">High Meat</option>
          </select>
        </div>

        {/* Home Energy */}
        <div className="flex flex-col">
          <label htmlFor="homeEnergy" className="text-xs uppercase tracking-wider text-cyber-purple mb-2 font-semibold">Home Energy (kWh)</label>
          <input
            type="number"
            id="homeEnergy"
            value={homeEnergy}
            onChange={(e) => setHomeEnergy(e.target.value === "" ? "" : Number(e.target.value))}
            className="p-3 bg-black border border-cyber-purple text-white rounded focus:outline-none focus:border-cyber-purple focus:ring-1 focus:ring-cyber-purple transition-shadow glow-purple"
            required
            min="0"
            step="0.1"
            placeholder="0.0"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`mt-6 p-4 font-bold uppercase tracking-widest rounded transition-all duration-300 border-2
            ${isLoading
              ? "bg-cyber-cyan text-black border-cyber-cyan glow-cyan animate-pulse"
              : "bg-black border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan hover:text-black hover:shadow-[0_0_20px_rgba(0,255,255,0.6)]"}`}
        >
          {isLoading ? "Transmitting..." : "Initialize Transfer"}
        </button>

        {statusMessage && (
          <p className="mt-4 text-xs text-center font-semibold neon-text glow-cyan uppercase tracking-wider">{statusMessage}</p>
        )}
      </form>
    </div>
  );
}
