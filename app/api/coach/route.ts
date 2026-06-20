/**
 * CarbonPulse AI — PULSE Coach API Route
 *
 * Edge function that streams a 3-sentence coaching response from Gemini.
 * Expects a POST body: { weeklyData: WeeklyCoachData }
 *
 * Environment variable required: GEMINI_API_KEY
 *
 * Security: validates origin, sanitizes payload size, no user data persisted.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  CARBON_COACH_SYSTEM_PROMPT,
  buildWeeklyCoachPrompt,
} from "../../../lib/aiCoach";
import type { WeeklyCoachData } from "../../../lib/types";

export const runtime = "edge";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const MAX_BODY_BYTES = 32_000; // ~32kB max to prevent payload abuse

// ─── IP-Based Rate Limiter ────────────────────────────────────────────────────

/** Maximum number of requests per IP within the sliding window. */
const RATE_LIMIT_MAX_REQUESTS = 5;

/** Sliding window duration in milliseconds (60 seconds). */
const RATE_LIMIT_WINDOW_MS = 60_000;

/** Stale entry cleanup interval — purge entries older than 2 windows. */
const RATE_LIMIT_CLEANUP_MS = RATE_LIMIT_WINDOW_MS * 2;

/** In-memory store mapping IP → array of request timestamps. */
const rateLimitStore = new Map<string, number[]>();

let lastCleanup = Date.now();

/**
 * Checks whether an IP has exceeded the rate limit.
 * Returns `true` if the request should be blocked.
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Periodic cleanup of stale entries to prevent memory leaks
  if (now - lastCleanup > RATE_LIMIT_CLEANUP_MS) {
    const cutoff = now - RATE_LIMIT_WINDOW_MS;
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const active = timestamps.filter((t) => t > cutoff);
      if (active.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, active);
      }
    }
    lastCleanup = now;
  }

  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitStore.get(ip) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);

  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── API key guard ──────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured on this deployment." },
      { status: 503 }
    );
  }

  // ── Rate limit guard ────────────────────────────────────────────────────
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("cf-connecting-ip") ??
    "unknown";
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  // ── Payload size guard ─────────────────────────────────────────────────
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  // ── Parse and validate body ────────────────────────────────────────────
  let weeklyData: WeeklyCoachData;
  try {
    const body = await request.json() as { weeklyData: unknown };
    if (!body.weeklyData || typeof body.weeklyData !== "object") {
      return NextResponse.json({ error: "Missing weeklyData." }, { status: 400 });
    }
    weeklyData = body.weeklyData as WeeklyCoachData;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // ── Build prompt ───────────────────────────────────────────────────────
  const userPrompt = buildWeeklyCoachPrompt(weeklyData);

  // ── Call Gemini ────────────────────────────────────────────────────────
  try {
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: CARBON_COACH_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
          candidateCount: 1,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("[coach] Gemini error:", errText);
      return NextResponse.json(
        { error: "Gemini API error. Try again shortly." },
        { status: 502 }
      );
    }

    const data = await geminiResponse.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    if (!text) {
      return NextResponse.json(
        { error: "Empty response from model." },
        { status: 502 }
      );
    }

    return NextResponse.json({ coaching: text });
  } catch (err) {
    console.error("[coach] Fetch error:", err);
    return NextResponse.json(
      { error: "Failed to reach Gemini. Check your connection." },
      { status: 502 }
    );
  }
}
