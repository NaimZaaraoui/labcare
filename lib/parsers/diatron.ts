/**
 * Parser for Diatron Abacus 380 export files (TAB separated TXT)
 */

export interface DiatronResult {
  sampleId: string;
  date: string;
  time: string;
  patientId?: string;
  results: Record<string, string>;
}

export function parseDiatronFile(content: string): DiatronResult[] {
  // Split by line and filter empty lines (including those with just whitespace)
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  // Parse headers and find the last non-empty header to handle trailing tabs
  const allHeaders = lines[0].split('\t').map(h => h.trim());
  let lastNonEmptyIndex = allHeaders.length - 1;
  while (lastNonEmptyIndex >= 0 && !allHeaders[lastNonEmptyIndex]) {
    lastNonEmptyIndex--;
  }
  
  const headers = allHeaders.slice(0, lastNonEmptyIndex + 1);
  const dataLines = lines.slice(1);

  const results: DiatronResult[] = [];

  for (const line of dataLines) {
    const values = line.split('\t').map(v => v.trim());
    
    // Check if we have at least the identifying columns (ID, Date, Heure are usually first 3)
    if (values.length < 3) continue;

    const record: any = {};
    headers.forEach((header, index) => {
      if (header && index < values.length) {
        record[header] = values[index];
      }
    });

    const mapping: Record<string, string[]> = {
      'GB': ['WBC', 'GB'],
      'GR': ['RBC', 'GR'],
      'HB': ['HGB', 'HB'],
      'HT': ['HCT', 'HT'],
      'VGM': ['MCV', 'VGM'],
      'TCMH': ['MCH', 'TCMH'],
      'CCMH': ['MCHC', 'CCMH'],
      'IDRc': ['IDRc', 'IDR'],
      'IDR%': ['IDR%'],
      'PLT': ['PLT'],
      'LYM': ['LYM', 'LYM%'], // Handle both absolute and % if needed, logic below separates them
      'MID': ['MID', 'MID%'],
      'GRA': ['GRA', 'GRA%'], 
      'LYM%': ['LYM%', 'LYM_P'],
      'MID%': ['MID%', 'MID_P'],
      'GRA%': ['GRA%', 'GRA_P']
    };

    const mappedResults: Record<string, string> = {};
    
    // Helper to add result if valid
    const addResult = (keys: string[], val: string) => {
        const cleanVal = val.trim().replace(',', '.');
        keys.forEach(k => mappedResults[k] = cleanVal);
    };

    Object.entries(mapping).forEach(([diatronKey, appKeys]) => {
      const val = record[diatronKey];
      if (val) {
        addResult(appKeys, val);
      }
    });

    results.push({
      sampleId: record['ID Échantillon'] || '',
      date: record['Date'] || '',
      time: record['Heure'] || '',
      patientId: record['ID du patient'] || '',
      results: mappedResults
    });
  }

  return results;
}
