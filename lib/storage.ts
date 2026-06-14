/**
 * CarbonPulse AI — Type-Safe Local Storage Service
 *
 * Provides validated read/write access to browser localStorage with
 * schema validation on deserialization and entry-count caps.
 * Prevents corrupted or tampered data from crashing the application.
 */

import type { ActivityLog, UserSettings } from "./types";
import { MAX_STORAGE_ENTRIES, STORAGE_KEYS } from "./constants";
import { validateStoredLogs, validateStoredSettings } from "./validation";

// ─── Activity Logs ────────────────────────────────────────────────────────────

/**
 * Reads and validates activity logs from localStorage.
 * Returns an empty array if data is missing, corrupted, or tampered.
 * Automatically removes corrupted data from storage.
 */
export function loadActivityLogs(): ActivityLog[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return validateStoredLogs(parsed, MAX_STORAGE_ENTRIES);
  } catch {
    // Storage corrupted or quota exceeded — clear and start fresh
    try {
      window.localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
    } catch {
      // Storage access completely failed — silently degrade
    }
    return [];
  }
}

/**
 * Persists activity logs to localStorage.
 * Caps at MAX_STORAGE_ENTRIES to prevent unbounded growth.
 */
export function saveActivityLogs(logs: ActivityLog[]): void {
  try {
    const capped = logs.slice(-MAX_STORAGE_ENTRIES);
    window.localStorage.setItem(
      STORAGE_KEYS.ACTIVITY_LOGS,
      JSON.stringify(capped)
    );
  } catch {
    // Quota exceeded or storage unavailable — silently degrade
  }
}

/**
 * Clears all activity logs from localStorage.
 */
export function clearActivityLogs(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
  } catch {
    // Storage access failed — silently degrade
  }
}

// ─── User Settings ────────────────────────────────────────────────────────────

/**
 * Reads and validates user settings from localStorage.
 * Returns application defaults if data is missing or invalid.
 */
export function loadUserSettings(): UserSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    if (!raw) return validateStoredSettings(null);

    const parsed: unknown = JSON.parse(raw);
    return validateStoredSettings(parsed);
  } catch {
    return validateStoredSettings(null);
  }
}

/**
 * Persists user settings to localStorage.
 */
export function saveUserSettings(settings: UserSettings): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.USER_SETTINGS,
      JSON.stringify(settings)
    );
  } catch {
    // Quota exceeded or storage unavailable — silently degrade
  }
}
