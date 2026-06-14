"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserPersona, PERSONA_LABELS } from "../lib/types";
import { saveUserSettings } from "../lib/storage";
import { DEFAULT_DAILY_BASELINE_KG, DEFAULT_WEEKLY_TARGET_KG } from "../lib/constants";

type Step = "welcome" | "persona" | "baseline" | "goal";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [persona, setPersona] = useState<UserPersona>("pragmatic");
  const [target, setTarget] = useState(String(DEFAULT_DAILY_BASELINE_KG));

  const completeOnboarding = useCallback(() => {
    saveUserSettings({
      dailyTargetKg: Number(target),
      weeklyTargetKg: Number(target) * 7,
      persona,
      onboardingCompleted: true,
      missionState: {
        activeMissionId: null,
        startedAt: null,
        completedMissionIds: [],
      },
      unlockedBadges: [],
    });
    router.push("/dashboard");
  }, [persona, target, router]);

  return (
    <div className="min-h-screen bg-grid flex items-center justify-center p-6 text-slate-100">
      <div className="panel panel-accent max-w-lg w-full p-8 relative overflow-hidden">
        {/* Background Pulse Effect */}
        <div className="absolute inset-0 pointer-events-none bg-pulse-slow" />

        <div className="relative z-10">
          {step === "welcome" && (
            <div className="text-center space-y-6">
              <div className="brand-mark mx-auto">
                <svg viewBox="0 0 24 24" className="h-6 w-6">
                  <path d="M5 14c5 0 9-3 12-8 1 7-2 12-8 13-2 .3-4-2-4-5Z" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold">Sync Your Pulse</h1>
              <p className="text-slate-400">
                Welcome to CarbonPulse. Let's calibrate your personal dashboard to help you track and reduce your impact.
              </p>
              <button
                onClick={() => setStep("persona")}
                className="primary-button w-full py-4"
              >
                Get Started
              </button>
            </div>
          )}

          {step === "persona" && (
            <div className="space-y-6">
              <div className="mb-6">
                <p className="eyebrow">Step 1: Persona</p>
                <h2 className="text-2xl font-semibold">How do you view your impact?</h2>
                <p className="text-sm text-slate-400 mt-2">We'll tailor your insights based on your mindset.</p>
              </div>
              <div className="grid gap-3">
                {(Object.entries(PERSONA_LABELS) as [UserPersona, string][]).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setPersona(id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      persona === id
                        ? "border-pulse bg-pulse/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep("baseline")}
                className="secondary-button w-full"
              >
                Continue
              </button>
            </div>
          )}

          {step === "baseline" && (
            <div className="space-y-6">
              <div className="mb-6">
                <p className="eyebrow">Step 2: Baseline</p>
                <h2 className="text-2xl font-semibold">Set your daily target</h2>
                <p className="text-sm text-slate-400 mt-2">
                  What is your goal for daily CO2e emissions? (Global avg is ~13kg)
                </p>
              </div>
              <div className="field-label">
                <span>Daily Target (kg)</span>
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="field-control text-lg"
                  step="0.1"
                />
              </div>
              <button
                onClick={() => setStep("goal")}
                className="secondary-button w-full"
              >
                Continue
              </button>
            </div>
          )}

          {step === "goal" && (
            <div className="text-center space-y-6">
              <div className="mb-6">
                <p className="eyebrow">Final Step</p>
                <h2 className="text-2xl font-semibold">Ready to make an impact?</h2>
                <p className="text-sm text-slate-400 mt-2">
                  You've set your profile to <span className="text-pulse font-medium">{PERSONA_LABELS[persona]}</span> with a target of {target}kg/day.
                </p>
              </div>
              <button
                onClick={completeOnboarding}
                className="primary-button w-full py-4"
              >
                Launch Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
