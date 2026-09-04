import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { markdownFiles } from './markdownFiles';
import { collectLinks, headingSlugs } from './parse';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const files = markdownFiles(root);

const slugsOf = new Map(files.map((file) => [file, headingSlugs(readFileSync(file, 'utf8'))]));

const failures: string[] = [];

const relative = (file: string) => path.relative(root, file).split(path.sep).join('/');

for (const file of files) {
  const text = readFileSync(file, 'utf8');

  for (const { raw, target, anchor } of collectLinks(text)) {
    const where = `${relative(file)} → ${raw}`;

    if (!target) {
      if (anchor && !slugsOf.get(file)?.has(anchor)) {
        failures.push(`${where}  (não há título com essa âncora neste documento)`);
      }

      continue;
    }

    const resolved = path.resolve(path.dirname(file), target);

    if (!existsSync(resolved)) {
      failures.push(`${where}  (o ficheiro não existe)`);
      continue;
    }

    if (!anchor || !target.endsWith('.md')) {
      continue;
    }

    const slugs = slugsOf.get(resolved);

    if (slugs && !slugs.has(anchor)) {
      failures.push(`${where}  (o documento existe, a âncora não)`);
    }
  }
}

const total = [...slugsOf.keys()].length;

if (failures.length) {
  console.error(`\n${failures.length} ligação(ões) quebrada(s) em ${total} documentos:\n`);

  for (const failure of failures) {
    console.error(`  ${failure}`);
  }

  console.error('');
  process.exit(1);
}

console.log(`${total} documentos, todas as ligações e âncoras resolvem.`);
