import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { markdownFiles } from './markdownFiles';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function relative(): string[] {
  return markdownFiles(root).map((file) => path.relative(root, file).replaceAll('\\', '/'));
}

describe('markdownFiles', () => {
  it('reaches documents nested in subfolders, which is the whole point', () => {
    const found = relative();

    expect(found).toContain('docs/reference/payload.md');
    expect(found).toContain('docs/start/overview.md');
  });

  it('finds the ones at the root too', () => {
    expect(relative()).toContain('README.md');
  });

  it('finds every markdown file the repository tracks', () => {
    expect(relative().length).toBeGreaterThanOrEqual(19);
  });

  it('returns only markdown', () => {
    expect(relative().every((file) => file.endsWith('.md'))).toBe(true);
  });

  it('does not walk into node_modules, which would take minutes and find thousands', () => {
    expect(relative().some((file) => file.includes('node_modules'))).toBe(false);
  });
});
