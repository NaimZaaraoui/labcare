
import { Analysis } from '@/lib/types';

export function getHematologyInterpretations(analysis: Analysis, results: Record<string, string>) {
  const flags: string[] = [];
  const getVal = (code: string) => {
    // Find result by test code
    const res = analysis.results.find(r => r.test?.code === code);
    if (!res) return null;
    const val = results[res.id];
    return val ? parseFloat(val.replace(',', '.')) : null;
  };

  const gb = getVal('GB');
  const hgb = getVal('HGB');
  const plt = getVal('PLT');
  const lymPercent = getVal('LYM%');
  const graPercent = getVal('GRA%');
  const vgm = getVal('VGM');
  const rdw = getVal('RDW') || getVal('IDW'); // Standard RDW or machine-specific IDW
  
  // Clinical Interpretations (Adult typical thresholds - simplified)
  if (gb !== null) {
    if (gb < 4.0) flags.push("LEUCOPÉNIE");
    if (gb > 10.0) flags.push("HYPERLEUCOCYTOSE");
  }

  if (hgb !== null) {
    const isMale = (analysis as any).patientGender === 'M';
    if (isMale && hgb < 13.0) flags.push("ANÉMIE");
    if (!isMale && hgb < 12.0) flags.push("ANÉMIE");
  }

  if (plt !== null) {
    if (plt < 150) flags.push("THROMBOPÉNIE");
    if (plt > 450) flags.push("THROMBOCYTOSE");
  }

  if (lymPercent !== null && gb !== null) {
    const lymAbs = (lymPercent * gb) / 100;
    if (lymAbs > 4.0) flags.push("LYMPHOCYTOSE");
    if (lymAbs < 1.0) flags.push("LYMPHOPÉNIE");
  }

  if (graPercent !== null && gb !== null) {
    const pnnAbs = (graPercent * gb) / 100;
    if (pnnAbs > 7.5) flags.push("POLYNUCLÉOSE NEUTROPHILE");
    if (pnnAbs < 1.5) flags.push("NEUTROPÉNIE");
  }

  if (vgm !== null && hgb !== null) {
    if (vgm < 80) flags.push("MICROCYTOSE");
    if (vgm > 100) flags.push("MACROCYTOSE");
  }

  // Morphology from Histogram Data (RDW/IDW check)
  if (rdw !== null && rdw > 16.0) {
      flags.push("ANISOCYTOSE");
  }

  try {
    const data = JSON.parse(analysis.histogramData || '{}');
    if (data.rbc?.flags?.includes('Aniso')) {
      flags.push("ANISOCYTOSE");
    }
    if (data.plt?.flags?.includes('Aggr')) {
      flags.push("PRÉSENCE D'AGRÉGATS PLAQUETTAIRES");
    }
    if (data.wbc?.flags?.includes('Blasts')) {
       flags.push("PRÉSENCE POSSIBLE DE BLASTES (À VÉRIFIER)");
    }
  } catch (e) {}

  return Array.from(new Set(flags));
}
