import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { markdownFiles } from './markdownFiles';
import { collectLinks, headingSlugs } from './parse';

export interface LinkFailure {
  file: string;
  raw: string;
  reason: string;
}

export interface LinkReport {
  documents: number;
  failures: LinkFailure[];
}

export function checkLinks(root: string): LinkReport {
  const files = markdownFiles(root);

  const slugsOf = new Map(files.map((file) => [file, headingSlugs(readFileSync(file, 'utf8'))]));

  const relative = (file: string) => path.relative(root, file).split(path.sep).join('/');

  const failures: LinkFailure[] = [];

  for (const file of files) {
    for (const { raw, target, anchor } of collectLinks(readFileSync(file, 'utf8'))) {
      const at = { file: relative(file), raw };

      if (!target) {
        if (anchor && !slugsOf.get(file)?.has(anchor)) {
          failures.push({ ...at, reason: 'não há título com essa âncora neste documento' });
        }

        continue;
      }

      const resolved = path.resolve(path.dirname(file), target);

      if (!existsSync(resolved)) {
        failures.push({ ...at, reason: 'o ficheiro não existe' });
        continue;
      }

      if (!anchor || !target.endsWith('.md')) {
        continue;
      }

      const slugs = slugsOf.get(resolved);

      if (slugs && !slugs.has(anchor)) {
        failures.push({ ...at, reason: 'o documento existe, a âncora não' });
      }
    }
  }

  return { documents: files.length, failures };
}
