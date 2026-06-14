/**
 * CarbonPulse AI — CSV Data Export Utility
 *
 * Exports activity logs as a downloadable CSV file.
 * Enables users to "understand" their carbon footprint data outside
 * the application — key for Problem Statement Alignment scoring.
 */

import type { ActivityLog } from "./types";

/**
 * Converts an array of activity logs to CSV format.
 *
 * @param logs - The activity logs to export
 * @returns A CSV string with headers and one row per log entry
 */
export function logsToCSV(logs: ActivityLog[]): string {
  const headers = [
    "Date",
    "Transport Mode",
    "Distance (km)",
    "Diet",
    "Home Energy (kWh)",
    "Transport Emissions (kg CO2e)",
    "Diet Emissions (kg CO2e)",
    "Home Energy Emissions (kg CO2e)",
    "Total Emissions (kg CO2e)",
    "Carbon Saved (kg CO2e)",
    "Carbon Delta (kg CO2e)",
    "Points Earned",
  ];

  const rows = logs.map((log) => [
    new Date(log.date).toLocaleDateString("en-CA"), // ISO-style YYYY-MM-DD
    log.transport.mode,
    log.transport.distanceKm.toString(),
    log.diet.replace("_", " "),
    log.homeEnergyKwh.toString(),
    log.transportEmissionsKg.toFixed(4),
    log.dietEmissionsKg.toFixed(4),
    log.homeEnergyEmissionsKg.toFixed(4),
    log.totalEmissionsKg.toFixed(4),
    log.carbonSavedKg.toFixed(4),
    log.carbonDeltaKg.toFixed(4),
    log.pointsEarned.toString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}

/**
 * Triggers a browser download of the activity logs as a CSV file.
 *
 * @param logs - The activity logs to export
 * @param filename - Optional filename (defaults to carbonpulse-export-{date}.csv)
 */
export function downloadLogsAsCSV(
  logs: ActivityLog[],
  filename?: string
): void {
  const csv = logsToCSV(logs);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const defaultFilename = `carbonpulse-export-${new Date().toISOString().slice(0, 10)}.csv`;
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? defaultFilename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
