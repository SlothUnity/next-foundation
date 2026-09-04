import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { flattenDeadLinks, flattenLink } from './flattenDeadLinks';

describe('flattenLink', () => {
  it('keeps the label and drops the link', () => {
    const { text } = flattenLink(
      'ver o [mapApiPage](../src/mapApiPage.ts) para saber',
      '../src/mapApiPage.ts',
    );

    expect(text).toBe('ver o mapApiPage para saber');
  });

  it('handles the angle-bracket form, which paths with parentheses need', () => {
    const { text } = flattenLink(
      'o [layout](<../src/app/(payload)/layout.tsx>) do admin',
      '../src/app/(payload)/layout.tsx',
    );

    expect(text).toBe('o layout do admin');
  });

  it('flattens every occurrence of the same target', () => {
    const { text, flattened } = flattenLink('[a](x.ts) e [b](x.ts)', 'x.ts');

    expect(text).toBe('a e b');
    expect(flattened).toBe(2);
  });

  it('leaves other links alone', () => {
    const { text } = flattenLink('[morto](dead.ts) e [vivo](alive.ts)', 'dead.ts');

    expect(text).toBe('morto e [vivo](alive.ts)');
  });

  it('does not treat a target as a regular expression', () => {
    const { text, flattened } = flattenLink('[x](a.b?c.ts)', 'a.b?c.ts');

    expect(flattened).toBe(1);
    expect(text).toBe('x');
  });

  it('reports nothing flattened when the target is not linked', () => {
    expect(flattenLink('sem ligações', 'x.ts')).toEqual({ text: 'sem ligações', flattened: 0 });
  });
});

describe('flattenDeadLinks', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'flatten-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function write(file: string, text: string): void {
    mkdirSync(path.join(root, path.dirname(file)), { recursive: true });
    writeFileSync(path.join(root, file), text);
  }

  function read(file: string): string {
    return readFileSync(path.join(root, file), 'utf8');
  }

  it('flattens a link to a file that is not there and keeps one that is', () => {
    write('kept.md', '# Kept\n');
    write('docs/a.md', 'o [ausente](../gone.ts) e o [presente](../kept.md)\n');

    const report = flattenDeadLinks(root);

    expect(report.flattened).toBe(1);
    expect(read('docs/a.md')).toBe('o ausente e o [presente](../kept.md)\n');
  });

  it('leaves the tree with no failures left', () => {
    write('docs/a.md', '[x](../gone.ts)\n');
    write('docs/b.md', '[y](../also-gone.ts)\n');

    expect(flattenDeadLinks(root).remaining).toEqual([]);
  });

  it('does not touch a document whose links all resolve', () => {
    write('kept.md', '# Kept\n');
    write('docs/a.md', 'só o [presente](../kept.md)\n');

    const before = read('docs/a.md');

    expect(flattenDeadLinks(root).flattened).toBe(0);
    expect(read('docs/a.md')).toBe(before);
  });

  it('reports an anchor that does not exist rather than flattening it, because that is prose to fix', () => {
    write('kept.md', '# Título\n');
    write('docs/a.md', '[x](../kept.md#nao-existe)\n');

    const report = flattenDeadLinks(root);

    expect(report.remaining).toHaveLength(0);
    expect(report.flattened).toBe(1);
  });
});
