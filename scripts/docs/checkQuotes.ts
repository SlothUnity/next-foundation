import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { markdownFiles } from '../links/markdownFiles';

import { firstMismatch, readBlocks } from './quotedBlocks';
import type { BlockCount } from './quotedBlocks';

export interface QuoteFailure {
  file: string;
  line: number;
  quoted: string;
  reason: string;
}

export interface QuoteReport {
  documents: number;
  count: BlockCount;
  failures: QuoteFailure[];
}

const CITATION = /((?:src|scripts|generator|docs)\/[\w./()[\]-]+\.\w+):(\d+)/g;

function relative(root: string, file: string): string {
  return path.relative(root, file).split(path.sep).join('/');
}

export function checkQuotes(root: string): QuoteReport {
  const files = markdownFiles(root);

  const failures: QuoteFailure[] = [];

  const count: BlockCount = { total: 0, quoted: 0 };

  for (const file of files) {
    const text = readFileSync(file, 'utf8');

    const where = relative(root, file);

    const { blocks, count: seen } = readBlocks(text);

    count.total += seen.total;
    count.quoted += seen.quoted;

    for (const block of blocks) {
      const target = path.join(root, block.path);

      if (!existsSync(target)) {
        failures.push({
          file: where,
          line: block.startLine,
          quoted: block.path,
          reason: 'o bloco nomeia um ficheiro que não existe',
        });

        continue;
      }

      const missing = firstMismatch(block.lines, readFileSync(target, 'utf8').split('\n'));

      if (missing !== undefined) {
        failures.push({
          file: where,
          line: block.startLine,
          quoted: block.path,
          reason: `esta linha já não está lá: ${missing}`,
        });
      }
    }

    for (const match of text.matchAll(CITATION)) {
      const [, cited = '', at = '0'] = match;

      const line = Number(at);

      const target = path.join(root, cited);

      if (!existsSync(target)) {
        continue;
      }

      const total = readFileSync(target, 'utf8').split('\n').length;

      if (line > total) {
        failures.push({
          file: where,
          line: 0,
          quoted: `${cited}:${line}`,
          reason: `o ficheiro só tem ${total} linhas`,
        });
      }
    }
  }

  return { documents: files.length, count, failures };
}
