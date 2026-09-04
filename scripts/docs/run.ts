import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkQuotes } from './checkQuotes';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const { documents, count, failures } = checkQuotes(root);

const coverage = count.total === 0 ? 0 : Math.round((count.quoted / count.total) * 100);

if (failures.length > 0) {
  console.error(`\n${failures.length} bloco(s) citado(s) já não correspondem ao ficheiro:\n`);

  for (const { file, line, quoted, reason } of failures) {
    console.error(`  ${file}${line ? `:${line}` : ''} → ${quoted}`);
    console.error(`      ${reason}`);
  }

  console.error('');
  process.exit(1);
}

console.log(
  `${documents} documentos, ${count.quoted} de ${count.total} blocos verificados contra o ficheiro que nomeiam (${coverage}%).`,
);
