import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

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
