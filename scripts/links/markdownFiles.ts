import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const SKIPPED = ['node_modules', '.next', '.git'];

export function markdownFiles(dir: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dir)) {
    if (SKIPPED.includes(entry)) {
      continue;
    }

    const full = path.join(dir, entry);

    if (statSync(full).isDirectory()) {
      found.push(...markdownFiles(full));
      continue;
    }

    if (entry.endsWith('.md')) {
      found.push(full);
    }
  }

  return found;
}
