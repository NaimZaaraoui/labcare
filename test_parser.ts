
import { parseDiatronFile } from './lib/parsers/diatron';

const content = `ID\tDate\tHeure\t
1\t2026\t10:00\t
2\t2026\t11:00`;

console.log('Result with trailing tab in header but not last line:');
console.log(parseDiatronFile(content));
