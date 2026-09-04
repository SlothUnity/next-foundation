import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { checkQuotes } from '../docs/checkQuotes';

import { checkLinks } from './checkLinks';

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function flattenLink(text: string, raw: string): { text: string; flattened: number } {
  const target = escapeForRegExp(raw);

  const pattern = new RegExp(`\\[([^\\]]*)\\]\\(<?${target}>?\\)`, 'g');

  let flattened = 0;

  const next = text.replace(pattern, (_match, label: string) => {
    flattened += 1;

    return label;
  });

  return { text: next, flattened };
}

export interface FlattenReport {
  flattened: number;
  remaining: { file: string; raw: string; reason: string }[];
}

export function flattenDeadLinks(root: string): FlattenReport {
  const { failures } = checkLinks(root);

  const byFile = new Map<string, string[]>();

  for (const { file, raw } of failures) {
    byFile.set(file, [...(byFile.get(file) ?? []), raw]);
  }

  let flattened = 0;

  for (const [file, targets] of byFile) {
    const full = path.join(root, file);

    let text = readFileSync(full, 'utf8');

    for (const raw of new Set(targets)) {
      const result = flattenLink(text, raw);

      text = result.text;
      flattened += result.flattened;
    }

    writeFileSync(full, text);
  }

  return { flattened, remaining: checkLinks(root).failures };
}

export function deannotateMissingQuotes(root: string): number {
  const { failures } = checkQuotes(root);

  const missing = failures.filter((failure) => failure.reason.includes('não existe'));

  const byFile = new Map<string, number[]>();

  for (const { file, line } of missing) {
    byFile.set(file, [...(byFile.get(file) ?? []), line]);
  }

  let deannotated = 0;

  for (const [file, lines] of byFile) {
    const full = path.join(root, file);

    const text = readFileSync(full, 'utf8').split('\n');

    for (const line of lines) {
      const at = line - 1;

      const fence = text[at];

      if (fence === undefined) {
        continue;
      }

      const tokens = fence.trim().split(/\s+/);

      text[at] = tokens.filter((token) => !token.includes('/')).join(' ') || tokens[0] || '';

      deannotated += 1;
    }

    writeFileSync(full, text.join('\n'));
  }

  return deannotated;
}
