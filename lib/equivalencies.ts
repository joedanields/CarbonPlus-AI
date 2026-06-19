/**
 * CarbonPulse AI — CO2 Equivalency Engine
 *
 * Converts raw kg CO2e into relatable real-world metaphors to bridge the
 * gap between abstract numbers and human understanding.
 */

export interface Equivalency {
  label: string;
  valuePerKg: number;
  unit: string;
}

type EquivalencyKey = "SMARTPHONE_CHARGES" | "CAR_KM" | "PAPER_SHEETS" | "FOREST_SQUARE_METERS";

const EQUIVALENCY_MAP: Record<EquivalencyKey, Equivalency> = {
  SMARTPHONE_CHARGES: {
    label: "smartphone charges",
    valuePerKg: 30,
    unit: "charges",
  },
  CAR_KM: {
    label: "km driven in a petrol car",
    valuePerKg: 5,
    unit: "km",
  },
  PAPER_SHEETS: {
    label: "A4 paper sheets",
    valuePerKg: 100,
    unit: "sheets",
  },
  FOREST_SQUARE_METERS: {
    label: "m² of forest absorption/year",
    valuePerKg: 0.4,
    unit: "m²",
  },
};

/**
 * Returns the most appropriate relatable metaphor for a given amount of CO2.
 *
 * @param kg - The amount of CO2 in kilograms
 * @returns A formatted string containing the equivalency.
 */
export function getRelatableEquivalency(kg: number): string {
  if (kg === 0) return "Zero carbon impact!";

  const absKg = Math.abs(kg);

  if (absKg < 1) {
    const val = Math.round(absKg * EQUIVALENCY_MAP.SMARTPHONE_CHARGES.valuePerKg);
    return `${val} ${EQUIVALENCY_MAP.SMARTPHONE_CHARGES.label}`;
  }

  if (absKg < 10) {
    const val = Math.round(absKg * EQUIVALENCY_MAP.CAR_KM.valuePerKg);
    return `${val} ${EQUIVALENCY_MAP.CAR_KM.label}`;
  }

  if (absKg < 50) {
    const val = Math.round(absKg * EQUIVALENCY_MAP.PAPER_SHEETS.valuePerKg);
    return `${val} ${EQUIVALENCY_MAP.PAPER_SHEETS.label}`;
  }

  const val = (absKg * EQUIVALENCY_MAP.FOREST_SQUARE_METERS.valuePerKg).toFixed(1);
  return `${val} ${EQUIVALENCY_MAP.FOREST_SQUARE_METERS.label}`;
}
