"use client";

import { FormEvent, useState } from "react";
import type { ActivityInput } from "../activityProcessing";

type TransportMode = ActivityInput["transport"]["mode"];
type DietType = ActivityInput["diet"];

export interface ActivityFormValues {
  transportMode: TransportMode;
  distanceKm: number;
  diet: DietType;
  homeEnergyKwh: number;
}

interface ActivityFormProps {
  onLog: (values: ActivityFormValues) => void;
}

const TRANSPORT_OPTIONS: { value: TransportMode; label: string }[] = [
  { value: "walk", label: "Walking" },
  { value: "cycle", label: "Cycling" },
  { value: "bus", label: "Bus" },
  { value: "train", label: "Train / Metro" },
  { value: "bike", label: "Motorbike" },
  { value: "car", label: "Car" },
];

const DIET_OPTIONS: { value: DietType; label: string }[] = [
  { value: "vegan", label: "Plant-based" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "mixed", label: "Mixed diet" },
  { value: "high_meat", label: "High-meat diet" },
];

export default function ActivityForm({ onLog }: ActivityFormProps) {
  const [transportMode, setTransportMode] = useState<TransportMode>("walk");
  const [distanceKm, setDistanceKm] = useState("");
  const [diet, setDiet] = useState<DietType>("mixed");
  const [homeEnergyKwh, setHomeEnergyKwh] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const distance = Number(distanceKm);
    const energy = Number(homeEnergyKwh);

    if (!Number.isFinite(distance) || !Number.isFinite(energy)) {
      setStatusMessage("Please enter valid activity values.");
      return;
    }

    onLog({ transportMode, distanceKm: distance, diet, homeEnergyKwh: energy });
    setDistanceKm("");
    setHomeEnergyKwh("");
    setStatusMessage("Activity added. Your footprint has been updated.");
  }

  return (
    <section className="panel panel-accent h-full p-5 sm:p-6" aria-labelledby="log-heading">
      <div className="mb-5">
        <p className="eyebrow">Daily check-in</p>
        <h2 id="log-heading" className="mt-1 text-2xl font-semibold text-white">Log today&apos;s activity</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Add one snapshot. CarbonPulse estimates the impact and updates your plan instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Transport
            <select value={transportMode} onChange={(event) => setTransportMode(event.target.value as TransportMode)} className="field-control">
              {TRANSPORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="field-label">
            Distance travelled
            <span className="field-with-unit">
              <input type="number" value={distanceKm} onChange={(event) => setDistanceKm(event.target.value)} className="field-control pr-12" required min="0" max="1000" step="0.1" placeholder="12" />
              <span>km</span>
            </span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Food pattern
            <select value={diet} onChange={(event) => setDiet(event.target.value as DietType)} className="field-control">
              {DIET_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="field-label">
            Home electricity
            <span className="field-with-unit">
              <input type="number" value={homeEnergyKwh} onChange={(event) => setHomeEnergyKwh(event.target.value)} className="field-control pr-14" required min="0" max="500" step="0.1" placeholder="4.5" />
              <span>kWh</span>
            </span>
          </label>
        </div>

        <button type="submit" className="primary-button w-full">
          Calculate my footprint
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path d="m9 18 6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <p className="min-h-5 text-center text-xs text-emerald-300" role="status">{statusMessage}</p>
      </form>
    </section>
  );
}
