import { getTestReferenceValues } from '@/lib/utils';
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
    return val ? parseFloat(val.replace(',', '.')) : null;
  };

  const setVal = (code: string, value: number) => {
    const res = analysis.results.find((result: Result) => result.test?.code === code);
    if (res) {
      const decimals = res.test?.decimals ?? 1;
      updatedResults[res.id] = value.toFixed(decimals).replace('.', ',');
    }
  };

  const rbc = getVal('RBC') || getVal('GR');
  const hgb = getVal('HGB') || getVal('HB');
  const hct = getVal('HCT') || getVal('HT');
  const wbc = getVal('WBC') || getVal('GB');

  if (rbc && hct && rbc > 0) setVal('VGM', (hct / rbc) * 10);
  if (hgb && rbc && rbc > 0) setVal('TCMH', (hgb * 10) / rbc);
  if (hgb && hct && hct > 0) setVal('CCMH', (hgb / hct) * 100);

  if (wbc) {
    const diffMap = [
      { pct: 'GRA%', abs: 'GRA' },
      { pct: 'LYM%', abs: 'LYM' },
      { pct: 'MID%', abs: 'MID' },
    ];

    diffMap.forEach(({ pct, abs }) => {
      const pVal = getVal(pct);
      if (pVal !== null) {
        setVal(abs, (pVal / 100) * wbc);
      }
    });
  }

  return updatedResults;
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
