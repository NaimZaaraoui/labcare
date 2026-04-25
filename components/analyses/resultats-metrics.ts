import { getTestReferenceValues } from '@/lib/utils';
import { 
  parseLocaleNumber, 
  formatLocaleNumber,
  calculateHematologyIndices,
  calculateAbsoluteFromPercentage,
  calculatePercentageFromAbsolute
} from '@/lib/calculations';
import { applyCalculatedTestFormulas } from '@/lib/calculated-tests';
import type { Analysis, Result, Test } from '@/lib/types';

export interface PaymentStatusDisplay {
  label: string;
  classes: string;
}

export interface ResultMetrics {
  totalCount: number;
  completedCount: number;
  abnormalCount: number;
  progressPct: number;
}

export function isResultAbnormal(
  value: string,
  test: Test,
  patientGender?: string | null
) {
  if (!value) return false;

  const refVals = getTestReferenceValues(test, patientGender);
  const min = refVals?.min ?? test.minValue;
  const max = refVals?.max ?? test.maxValue;

  if (min === null && max === null) return false;

  const num = parseFloat(value.replace(',', '.'));
  if (Number.isNaN(num)) return false;

  if (max !== null && num > max) return true;
  if (min !== null && num < min) return true;
  return false;
}

export function performHematologyCalculations(
  analysis: Analysis | null,
  currentResults: Record<string, string>
) {
  if (!analysis) return currentResults;

  const updatedResults = { ...currentResults };

  const getVal = (code: string) => {
    const res = analysis.results.find((result: Result) => result.test?.code === code);
    if (!res) return null;
    const val = updatedResults[res.id];
    return val ? parseLocaleNumber(val) : null;
  };

  const setVal = (code: string, value: number | null) => {
    if (value === null) return;
    const res = analysis.results.find((result: Result) => result.test?.code === code);
    if (res) {
      const decimals = res.test?.decimals ?? 1;
      updatedResults[res.id] = formatLocaleNumber(value, decimals);
    }
  };

  // Calculate hematology indices (VGM, TCMH, CCMH)
  const rbc = getVal('RBC') || getVal('GR');
  const hgb = getVal('HGB') || getVal('HB');
  const hct = getVal('HCT') || getVal('HT');
  const rdw = getVal('RDW') || getVal('IDW');
  
  const indicesInput: Record<string, number> = {};
  if (rbc !== null) {
    indicesInput.RBC = rbc;
    indicesInput.GR = rbc;
  }
  if (hgb !== null) {
    indicesInput.HGB = hgb;
    indicesInput.HB = hgb;
  }
  if (hct !== null) {
    indicesInput.HCT = hct;
    indicesInput.HT = hct;
  }
  if (rdw !== null) {
    indicesInput.RDW = rdw;
    indicesInput.IDW = rdw;
  }

  const indices = calculateHematologyIndices(indicesInput);

  if (indices.vgm !== undefined) setVal('VGM', indices.vgm);
  if (indices.tcmh !== undefined) setVal('TCMH', indices.tcmh);
  if (indices.ccmh !== undefined) setVal('CCMH', indices.ccmh);

  // Calculate WBC differential absolute counts from percentages
  const wbc = getVal('WBC') || getVal('GB');

  if (wbc) {
    const diffMap = [
      { pct: 'GRA%', abs: 'GRA' },
      { pct: 'LYM%', abs: 'LYM' },
      { pct: 'MID%', abs: 'MID' },
    ];

    diffMap.forEach(({ pct, abs }) => {
      const pVal = getVal(pct);
      const absVal = calculateAbsoluteFromPercentage(pVal, wbc);
      if (absVal !== null) {
        setVal(abs, absVal);
      }
    });
  }

  return applyCalculatedTestFormulas(analysis, updatedResults);
}

export function calculateResultMetrics(
  analysis: Analysis,
  results: Record<string, string>
): ResultMetrics {
  const leafResults = analysis.results.filter((result: Result) => !result.test?.isGroup);
  const totalCount = leafResults.length;
  const completedCount = leafResults.filter((result: Result) => {
    const value = results[result.id];
    return Boolean(value) && value !== '';
  }).length;
  const abnormalCount = leafResults.filter((result: Result) => {
    const test = result.test;
    if (!test) return false;
    return isResultAbnormal(results[result.id], test, analysis.patientGender);
  }).length;

  return {
    totalCount,
    completedCount,
    abnormalCount,
    progressPct: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
  };
}

export function getPaymentStatusDisplay(
  paymentStatus: Analysis['paymentStatus']
): PaymentStatusDisplay {
  if (paymentStatus === 'PAID') {
    return {
      label: 'Payé',
      classes: 'status-pill status-pill-success',
    };
  }

  if (paymentStatus === 'PARTIAL') {
    return {
      label: 'Partiellement payé',
      classes: 'status-pill status-pill-warning',
    };
  }

  return {
    label: 'Non payé',
    classes: 'status-pill status-pill-error',
  };
}
