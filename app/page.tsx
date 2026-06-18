"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadUserSettings } from "../lib/storage";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const settings = loadUserSettings();
    if (!settings.onboardingCompleted) {
      router.replace("/onboarding");
    } else {
      router.replace("/dashboard");
    }
  }, [router]);

  return null;
}
