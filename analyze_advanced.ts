
import fs from 'fs';

const content = fs.readFileSync('advanced.txt', 'utf-8');
const lines = content.split('\n');
const headers = lines[0].split('\t');
const values = lines[1].split('\t');

console.log('Headers length:', headers.length);
console.log('Values length:', values.length);

const wbcHistIndex = headers.indexOf('WBC Histogram');
const wbcMarker1Index = headers.indexOf('WBC Marker 1');
const rbcHistIndex = headers.indexOf('RBC Histogram');
const rbcMarker1Index = headers.indexOf('RBC Marker 1');

console.log('WBC Hist Index:', wbcHistIndex);
console.log('WBC Marker 1 Index:', wbcMarker1Index);
console.log('RBC Hist Index:', rbcHistIndex);
console.log('RBC Marker 1 Index:', rbcMarker1Index);

if (wbcHistIndex !== -1 && wbcMarker1Index !== -1) {
    const wbcBins = values.slice(wbcHistIndex, wbcMarker1Index);
    console.log('Number of WBC bins:', wbcBins.length);
    console.log('WBC Bins (first 20):', wbcBins.slice(0, 20));
}

if (rbcHistIndex !== -1) {
    const rbcBins = values.slice(rbcHistIndex);
    console.log('Number of RBC bins/values after RBC Hist index:', rbcBins.length);
}
