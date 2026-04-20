/**
 * lib/calculations.ts
 * 
 * Centralized business logic for all laboratory calculations
 * Consolidates hematology indices, clinical interpretations, and value transformations
 * 
 * This module replaces scattered calculation logic across:
 * - components/analyses/resultats-metrics.ts
 * - lib/interpretations.ts
 * - lib/qc.ts
 */

import type { Analysis, Result, Test } from '@/lib/types';
import { getTestReferenceValues } from '@/lib/utils';
import { HEMATOLOGY_THRESHOLDS as H_THRESH } from '@/lib/lab-rules';

// ============================================================================
// VALUE PARSING & FORMATTING UTILITIES
// ============================================================================

/**
 * Parse a locale-aware numeric string (comma as decimal separator)
 * 
 * @param value - String value with potential comma as decimal separator
 * @returns Parsed number or null if invalid
 * @example
 * parseLocaleNumber("123,45") // → 123.45
 * parseLocaleNumber("invalid") // → null
 */
export function parseLocaleNumber(value: string | undefined | null): number | null {
  if (!value) return null;
  const parsed = parseFloat(value.replace(',', '.'));
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Format a number with locale-aware decimal separator
 * 
 * @param value - Numeric value to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with comma as decimal separator
 * @example
 * formatLocaleNumber(123.45, 2) // → "123,45"
 * formatLocaleNumber(10) // → "10,0"
 */
export function formatLocaleNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals).replace('.', ',');
}

// ============================================================================
// HEMATOLOGY INDEX CALCULATIONS
// ============================================================================

/**
 * Calculate Mean Corpuscular Volume (MCV / VGM)
 * Formula: (Hematocrit / RBC count) * 10
 * 
 * Normal range: 80-100 fL (Adult)
 * - Below 80 fL: Microcytosis (small cells)
 * - Above 100 fL: Macrocytosis (large cells)
 * 
 * @param hematocrit - Hematocrit value (%) 
 * @param rbcCount - Red blood cell count (10⁶/µL)
 * @returns MCV in fL or null if calculation impossible
 * @example
 * calculateMCV(40, 5.0) // → 80 (normal)
 */
export function calculateMCV(hematocrit: number | null, rbcCount: number | null): number | null {
  if (!hematocrit || !rbcCount || rbcCount === 0) return null;
  return (hematocrit / rbcCount) * 10;
}

/**
 * Calculate Mean Corpuscular Hemoglobin (MCH / TCMH)
 * Formula: (Hemoglobin * 10) / RBC count
 * 
 * Normal range: 27-33 pg (Adult)
 * Indicates average hemoglobin mass per red cell
 * 
 * @param hemoglobin - Hemoglobin value (g/dL)
 * @param rbcCount - Red blood cell count (10⁶/µL)
 * @returns MCH in pg or null if calculation impossible
 * @example
 * calculateMCH(14, 5.0) // → 28 (normal)
 */
export function calculateMCH(hemoglobin: number | null, rbcCount: number | null): number | null {
  if (!hemoglobin || !rbcCount || rbcCount === 0) return null;
  return (hemoglobin * 10) / rbcCount;
}

/**
 * Calculate Mean Corpuscular Hemoglobin Concentration (MCHC / CCMH)
 * Formula: (Hemoglobin / Hematocrit) * 100
 * 
 * Normal range: 32-36 g/dL (Adult)
 * Indicates hemoglobin concentration within red cells
 * 
 * @param hemoglobin - Hemoglobin value (g/dL)
 * @param hematocrit - Hematocrit value (%)
 * @returns MCHC in g/dL or null if calculation impossible
 * @example
 * calculateMCHC(14, 42) // → 33.3 (normal)
 */
export function calculateMCHC(hemoglobin: number | null, hematocrit: number | null): number | null {
  if (!hemoglobin || !hematocrit || hematocrit === 0) return null;
  return (hemoglobin / hematocrit) * 100;
}

/**
 * Calculate Red Cell Distribution Width coefficient (RDW / IDR)
 * Indicates variability in red cell size (degree of anisocytosis)
 * 
 * Normal range: 11-15% (Adult)
 * - Above 15%: Increased anisocytosis (variable cell sizes)
 * 
 * Note: Some instruments provide absolute RDW in fL; others provide percentage
 * This function validates threshold for clinical interpretation
 * 
 * @param rdw - RDW value (can be % or fL depending on analyzer)
 * @returns true if RDW indicates anisocytosis, false otherwise
 * @example
 * interpretRDW(16.5) // → true (anisocytosis detected)
 * interpretRDW(13.0) // → false (normal distribution)
 */
export function interpretRDW(rdw: number | null): boolean {
  if (rdw === null) return false;
  return rdw > 15.0;
}

// ============================================================================
// DIFFERENTIAL CALCULATIONS
// ============================================================================

/**
 * Calculate absolute white cell count from percentage and total WBC
 * Formula: (Percentage / 100) * Total WBC count
 * 
 * Converts differential percentages (%GRA, %LYM, %MID) to absolute values
 * Essential for clinical interpretation of differential counts
 * 
 * @param percentage - Cell percentage (0-100)
 * @param totalWBC - Total white blood cell count (10³/µL)
 * @returns Absolute count in 10³/µL or null if invalid input
 * @example
 * calculateAbsoluteFromPercentage(60, 10.0) // → 6.0 (absolute GRA count)
 */
export function calculateAbsoluteFromPercentage(percentage: number | null, totalWBC: number | null): number | null {
  if (percentage === null || totalWBC === null || totalWBC === 0) return null;
  return (percentage / 100) * totalWBC;
}

/**
 * Calculate percentage from absolute count and total WBC
 * Formula: (Absolute Count / Total WBC) * 100
 * 
 * Inverse of calculateAbsoluteFromPercentage
 * Used when only absolute values are available but percentages are needed
 * 
 * @param absoluteCount - Cell count in 10³/µL
 * @param totalWBC - Total white blood cell count (10³/µL)
 * @returns Percentage (0-100) or null if invalid input
 * @example
 * calculatePercentageFromAbsolute(6.0, 10.0) // → 60 (%GRA)
 */
export function calculatePercentageFromAbsolute(absoluteCount: number | null, totalWBC: number | null): number | null {
  if (absoluteCount === null || totalWBC === null || totalWBC === 0) return null;
  return (absoluteCount / totalWBC) * 100;
}

// ============================================================================
// BATCH HEMATOLOGY CALCULATIONS
// ============================================================================

interface HematologyIndices {
  vgm?: number;
  tcmh?: number;
  ccmh?: number;
  rdwAnisocytosis?: boolean;
}

/**
 * Calculate all hematology indices from raw measurements
 * 
 * Calculates VGM, TCMH, CCMH from:
 * - RBC (Red blood cell count)
 * - HGB (Hemoglobin)
 * - HCT (Hematocrit)
 * - RDW (Red cell distribution width)
 * 
 * Handles alternative test codes (GR/RBC, HB/HGB, HT/HCT, IDW/RDW)
 * All calculation results are returned; caller decides which to persist
 * 
 * @param values - Object with test code as key, numeric value
 * @returns Calculated indices (only non-null values included)
 * @example
 * calculateHematologyIndices({
 *   RBC: 5.0,
 *   HGB: 14.0,
 *   HCT: 42.0,
 *   RDW: 13.5
 * })
 * // → { vgm: 84.0, tcmh: 28.0, ccmh: 33.3, rdwAnisocytosis: false }
 */
export function calculateHematologyIndices(values: Record<string, number>): HematologyIndices {
  const rbc = values.RBC ?? values.GR;
  const hgb = values.HGB ?? values.HB;
  const hct = values.HCT ?? values.HT;
  const rdw = values.RDW ?? values.IDW;

  const indices: HematologyIndices = {};

  const vgm = calculateMCV(hct, rbc);
  if (vgm !== null) indices.vgm = vgm;

  const tcmh = calculateMCH(hgb, rbc);
  if (tcmh !== null) indices.tcmh = tcmh;

  const ccmh = calculateMCHC(hgb, hct);
  if (ccmh !== null) indices.ccmh = ccmh;

  if (rdw !== null) {
    indices.rdwAnisocytosis = interpretRDW(rdw);
  }

  return indices;
}

// ============================================================================
// ABNORMALITY DETECTION
// ============================================================================

/**
 * Determine if a result value is abnormal relative to reference ranges
 * 
 * Compares value against:
 * 1. Gender-specific reference values (if available)
 * 2. Test definition min/max values
 * 3. Returns false if no reference range defined
 * 
 * Handles locale-specific number formatting (comma as decimal separator)
 * 
 * @param value - String representation of result value
 * @param test - Test definition with reference ranges
 * @param patientGender - Patient gender ('M'/'F') for gender-specific ranges
 * @returns true if value exceeds defined reference ranges
 * @example
 * const test = { minValue: 4.0, maxValue: 10.0, resultType: 'numeric' };
 * isResultAbnormal("11,5", test, "M") // → true (exceeds max)
 * isResultAbnormal("8,0", test, "M") // → false (within range)
 */
export function isResultAbnormal(
  value: string,
  test: Test,
  patientGender?: string | null
): boolean {
  if (!value) return false;

  const refVals = getTestReferenceValues(test, patientGender);
  const min = refVals?.min ?? test.minValue;
  const max = refVals?.max ?? test.maxValue;

  if (min === null && max === null) return false;

  const num = parseLocaleNumber(value);
  if (num === null) return false;

  if (max !== null && num > max) return true;
  if (min !== null && num < min) return true;
  return false;
}

// ============================================================================
// CLINICAL INTERPRETATION THRESHOLDS
// ============================================================================

/**
 * Get clinical interpretation flags for hematology results
 * 
 * Evaluates results against clinical thresholds for:
 * - Anemia (gender-specific hemoglobin)
 * - Leukocytosis/Leukopenia (WBC)
 * - Thrombocytosis/Thrombopenia (PLT)
 * - Lymphocytosis/Lymphopenia (LYM absolute)
 * - Neutrophilia/Neutropenia (GRA absolute)
 * - Macrocytosis/Microcytosis (MCV/VGM)
 * - Anisocytosis (RDW/IDW)
 * 
 * Thresholds are defined in lib/lab-rules.ts (HEMATOLOGY_THRESHOLDS)
 * Returns empty array if all values normal
 * 
 * @param analysis - Analysis object with patient demographics
 * @param results - Dict of test result values keyed by test ID
 * @returns Array of clinical interpretation flags (French text)
 * @example
 * const flags = getHematologyFlags(analysis, { ...results });
 * // → ["ANÉMIE", "LYMPHOCYTOSE"]
 */
export function getHematologyFlags(analysis: Analysis, results: Record<string, string>): string[] {
  const flags: string[] = [];

  const getVal = (code: string) => {
    const res = analysis.results.find(r => r.test?.code === code);
    if (!res) return null;
    return parseLocaleNumber(results[res.id]);
  };

  const gb = getVal('GB');
  const hgb = getVal('HGB');
  const plt = getVal('PLT');
  const lymPercent = getVal('LYM%');
  const graPercent = getVal('GRA%');
  const vgm = getVal('VGM');
  const rdw = getVal('RDW') || getVal('IDW');

  // WBC interpretation
  if (gb !== null) {
    if (gb < H_THRESH.GB.LEUCOPENIA) flags.push('LEUCOPÉNIE');
    if (gb > H_THRESH.GB.HYPERLEUKOCYTOSIS) flags.push('HYPERLEUCOCYTOSE');
  }

  // Hemoglobin interpretation
  if (hgb !== null) {
    const isMale = analysis.patientGender === 'M';
    if (isMale && hgb < H_THRESH.HGB.ANEMIA_MALE) flags.push('ANÉMIE');
    if (!isMale && hgb < H_THRESH.HGB.ANEMIA_FEMALE) flags.push('ANÉMIE');
  }

  // Platelet interpretation
  if (plt !== null) {
    if (plt < H_THRESH.PLT.THROMBOPENIA) flags.push('THROMBOPÉNIE');
    if (plt > H_THRESH.PLT.THROMBOCYTOSIS) flags.push('THROMBOCYTOSE');
  }

  // Lymphocyte interpretation (absolute count)
  if (lymPercent !== null && gb !== null) {
    const lymAbs = calculateAbsoluteFromPercentage(lymPercent, gb);
    if (lymAbs !== null) {
      if (lymAbs > H_THRESH.LYM_ABS.LYMPHOCYTOSIS) flags.push('LYMPHOCYTOSE');
      if (lymAbs < H_THRESH.LYM_ABS.LYMPHOPENIA) flags.push('LYMPHOPÉNIE');
    }
  }

  // Neutrophil interpretation (absolute count)
  if (graPercent !== null && gb !== null) {
    const pnnAbs = calculateAbsoluteFromPercentage(graPercent, gb);
    if (pnnAbs !== null) {
      if (pnnAbs > H_THRESH.PNN_ABS.NEUTROPHILIA) flags.push('POLYNUCLÉOSE NEUTROPHILE');
      if (pnnAbs < H_THRESH.PNN_ABS.NEUTROPENIA) flags.push('NEUTROPÉNIE');
    }
  }

  // MCV interpretation (morphological classification)
  if (vgm !== null) {
    if (vgm < 80) flags.push('MICROCYTOSE');
    if (vgm > 100) flags.push('MACROCYTOSE');
  }

  // RDW interpretation (anisocytosis)
  if (rdw !== null && interpretRDW(rdw)) {
    flags.push('ANISOCYTOSE');
  }

  return flags;
}

// ============================================================================
// HISTOGRAM DATA INTERPRETATION
// ============================================================================

/**
 * Extract morphological flags from instrument histogram data
 * 
 * Parses analyzer-provided histogram flags for:
 * - RBC morphology (anisocytosis, RBC abnormalities)
 * - WBC morphology (blast presence, left shift)
 * - PLT morphology (platelet aggregates)
 * 
 * @param histogramData - Stringified JSON histogram data from analyzer
 * @returns Array of morphological interpretation flags (French text)
 * @example
 * const flags = getHistogramFlags(analysis.histogramData);
 * // → ["PRÉSENCE D'AGRÉGATS PLAQUETTAIRES", "ANISOCYTOSE"]
 */
export function getHistogramFlags(histogramData: string | null | undefined): string[] {
  const flags: string[] = [];

  if (!histogramData) return flags;

  try {
    const data = JSON.parse(histogramData);

    if (data.rbc?.flags) {
      if (data.rbc.flags.includes('Aniso')) {
        flags.push('ANISOCYTOSE');
      }
    }

    if (data.plt?.flags) {
      if (data.plt.flags.includes('Aggr')) {
        flags.push("PRÉSENCE D'AGRÉGATS PLAQUETTAIRES");
      }
    }

    if (data.wbc?.flags) {
      if (data.wbc.flags.includes('Blasts')) {
        flags.push('PRÉSENCE POSSIBLE DE BLASTES (À VÉRIFIER)');
      }
    }
  } catch (e) {
    // Silently ignore parse errors - histogram data is optional
  }

  return flags;
}
