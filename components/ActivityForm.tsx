"use client";

import { FormEvent, useState, useCallback, useRef } from "react";
import type { ActivityFormValues, TransportMode, DietType, SimpleActionType } from "../lib/types";
import { TRANSPORT_LABELS, DIET_LABELS } from "../lib/types";
import { validateFormValues } from "../lib/validation";
import { SIMPLE_ACTIONS_LABELS } from "../lib/constants";

/**
 * ActivityForm — Daily Carbon Activity Input Form
 *
 * Collects transport mode, distance, diet pattern, and home energy usage.
 * Includes client-side validation with per-field error messages and
 * submit rate limiting to prevent rapid duplicate entries.
 */

interface ActivityFormProps {
  onLog: (values: ActivityFormValues) => void;
}

const TRANSPORT_OPTIONS: { value: TransportMode; label: string }[] = (
  Object.entries(TRANSPORT_LABELS) as [TransportMode, string][]
).map(([value, label]) => ({ value, label }));

const DIET_OPTIONS: { value: DietType; label: string }[] = (
  Object.entries(DIET_LABELS) as [DietType, string][]
).map(([value, label]) => ({ value, label }));

/** Minimum interval between form submissions (ms). */
const SUBMIT_THROTTLE_MS = 1000;

export default function ActivityForm({ onLog }: ActivityFormProps) {
  const [transportMode, setTransportMode] = useState<TransportMode>("walk");
  const [distanceKm, setDistanceKm] = useState("");
  const [diet, setDiet] = useState<DietType>("mixed");
  const [homeEnergyKwh, setHomeEnergyKwh] = useState("");
  const [simpleActions, setSimpleActions] = useState<SimpleActionType[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ActivityFormValues, string>>
  >({});
  const lastSubmitRef = useRef(0);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      // Rate limiting: prevent rapid duplicate submissions
      const now = Date.now();
      if (now - lastSubmitRef.current < SUBMIT_THROTTLE_MS) {
        setStatusMessage("Please wait a moment before submitting again.");
        return;
      }

      const values: ActivityFormValues = {
        transportMode,
        distanceKm: Number(distanceKm),
        diet,
        homeEnergyKwh: Number(homeEnergyKwh),
        simpleActions,
      };

      const validation = validateFormValues(values);
      if (!validation.valid) {
        setFieldErrors(validation.errors);
        setStatusMessage("Please fix the errors above.");
        return;
      }

      setFieldErrors({});
      lastSubmitRef.current = now;
      onLog(values);
      setDistanceKm("");
      setHomeEnergyKwh("");
      setSimpleActions([]);
      setStatusMessage("Activity added. Your footprint has been updated.");
    },
    [transportMode, distanceKm, diet, homeEnergyKwh, simpleActions, onLog]
  );

  return (
    <section
      className="panel panel-accent h-full p-5 sm:p-6"
      aria-labelledby="log-heading"
    >
      <div className="mb-5">
        <p className="eyebrow">Daily check-in</p>
        <h2
          id="log-heading"
          className="mt-1 text-2xl font-semibold text-white"
        >
          Log today&apos;s activity
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Add one snapshot. CarbonPulse estimates the impact and updates your
          plan instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label" htmlFor="transport-mode">
            Transport
            <select
              id="transport-mode"
              value={transportMode}
              onChange={(e) =>
                setTransportMode(e.target.value as TransportMode)
              }
              className="field-control"
              aria-describedby={
                fieldErrors.transportMode ? "transport-error" : undefined
              }
            >
              {TRANSPORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.transportMode && (
              <span id="transport-error" className="text-xs text-red-400" role="alert">
                {fieldErrors.transportMode}
              </span>
            )}
          </label>
          <label className="field-label" htmlFor="distance-km">
            Distance travelled
            <span className="field-with-unit">
              <input
                id="distance-km"
                type="number"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="field-control pr-12"
                required
                min="0"
                max="1000"
                step="0.1"
                placeholder="12"
                aria-describedby={
                  fieldErrors.distanceKm ? "distance-error" : "distance-hint"
                }
              />
              <span aria-hidden="true">km</span>
            </span>
            <span id="distance-hint" className="sr-only">
              Enter distance in kilometres, 0 to 1000
            </span>
            {fieldErrors.distanceKm && (
              <span id="distance-error" className="text-xs text-red-400" role="alert">
                {fieldErrors.distanceKm}
              </span>
            )}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label" htmlFor="diet-type">
            Food pattern
            <select
              id="diet-type"
              value={diet}
              onChange={(e) => setDiet(e.target.value as DietType)}
              className="field-control"
              aria-describedby={
                fieldErrors.diet ? "diet-error" : undefined
              }
            >
              {DIET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.diet && (
              <span id="diet-error" className="text-xs text-red-400" role="alert">
                {fieldErrors.diet}
              </span>
            )}
          </label>
          <label className="field-label" htmlFor="home-energy">
            Home electricity
            <span className="field-with-unit">
              <input
                id="home-energy"
                type="number"
                value={homeEnergyKwh}
                onChange={(e) => setHomeEnergyKwh(e.target.value)}
                className="field-control pr-14"
                required
                min="0"
                max="500"
                step="0.1"
                placeholder="4.5"
                aria-describedby={
                  fieldErrors.homeEnergyKwh
                    ? "energy-error"
                    : "energy-hint"
                }
              />
              <span aria-hidden="true">kWh</span>
            </span>
            <span id="energy-hint" className="sr-only">
              Enter electricity usage in kilowatt-hours, 0 to 500
            </span>
            {fieldErrors.homeEnergyKwh && (
              <span id="energy-error" className="text-xs text-red-400" role="alert">
                {fieldErrors.homeEnergyKwh}
              </span>
            )}
          </label>
        </div>

        <div className="pt-2 pb-2">
          <p className="field-label mb-3">Did you complete any simple actions today?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(SIMPLE_ACTIONS_LABELS) as SimpleActionType[]).map((action) => (
              <label key={action} className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={simpleActions.includes(action)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSimpleActions((prev) => [...prev, action]);
                    } else {
                      setSimpleActions((prev) => prev.filter((a) => a !== action));
                    }
                  }}
                  className="h-4 w-4 rounded border-white/20 bg-black/20 text-pulse accent-pulse focus:ring-pulse focus:ring-offset-0"
                />
                {SIMPLE_ACTIONS_LABELS[action]}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="primary-button w-full" aria-label="Log Daily Activity">
          Calculate my footprint
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path
              d="m9 18 6-6-6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
        <p
          className="min-h-5 text-center text-xs text-emerald-300"
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </p>
      </form>
    </section>
  );
}
