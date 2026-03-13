
import { parseDiatronFile } from './lib/parsers/diatron';
import fs from 'fs';

const content = fs.readFileSync('advanced.txt', 'utf-8');
const results = parseDiatronFile(content);

results.forEach((r, i) => {
  console.log(`--- Record ${i + 1} ---`);
  console.log(`Sample ID: ${r.sampleId}`);
  if (r.histograms) {
    console.log(`WBC Flags: "${r.histograms.wbc.flags}"`);
    console.log(`RBC Flags: "${r.histograms.rbc.flags}"`);
    console.log(`PLT Flags: "${r.histograms.plt.flags}"`);
    console.log(`Warning: "${r.histograms.warning}"`);
  } else {
    console.log('No histogram data found.');
  }
});
