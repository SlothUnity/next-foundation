import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkLinks } from './checkLinks';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const { documents, failures } = checkLinks(root);

if (failures.length > 0) {
  console.error(`\n${failures.length} ligação(ões) quebrada(s) em ${documents} documentos:\n`);

  for (const { file, raw, reason } of failures) {
    console.error(`  ${file} → ${raw}  (${reason})`);
  }

  console.error('');
  process.exit(1);
}

console.log(`${documents} documentos, todas as ligações e âncoras resolvem.`);
