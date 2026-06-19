"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadUserSettings } from "../lib/storage";

/**
 * Root entry point. Reads persisted onboarding state from localStorage
 * and routes first-time users to /onboarding, returning users to /dashboard.
 * Rendered client-side to access localStorage without SSR mismatch.
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const settings = loadUserSettings();
    if (settings.onboardingCompleted) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }, [router]);

  // Minimal loading shell — shown only for the 1-2 frame flash before redirect
  return (
    <div
      className="min-h-screen bg-grid flex items-center justify-center"
      aria-label="Loading CarbonPulse"
      role="status"
    >
      <span className="brand-mark animate-pulse" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path
            d="M5 14c5 0 9-3 12-8 1 7-2 12-8 13-2 .3-4-2-4-5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M7 17c2-3 5-5 9-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      </span>
    </div>
  );
}
