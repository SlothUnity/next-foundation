import { describe, expect, it } from 'vitest';

import { firstMismatch, isElision, readBlocks } from './quotedBlocks';

const F = '```';

function md(...lines: string[]): string {
  return lines.join('\n');
}

describe('readBlocks', () => {
  it('counts every fenced block', () => {
    const { count } = readBlocks(md(`${F}ts`, 'const a = 1;', F, `${F}sh`, 'ls', F));

    expect(count.total).toBe(2);
  });

  it('treats a path in the info string as a claim to quote that file', () => {
    const { blocks } = readBlocks(md(`${F}ts src/core/pages/Page.types.ts`, 'export {};', F));

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.path).toBe('src/core/pages/Page.types.ts');
  });

  it('leaves a block with no path unchecked, so the gate never overstates its coverage', () => {
    const { blocks, count } = readBlocks(md(`${F}ts`, 'const a = 1;', F));

    expect(blocks).toEqual([]);
    expect(count).toEqual({ total: 1, quoted: 0 });
  });

  it('ignores a language alone, which is not a path', () => {
    expect(readBlocks(md(`${F}bash`, 'pnpm dev', F)).blocks).toEqual([]);
  });

  it('ignores an attribute, which is not a path either', () => {
    expect(readBlocks(md(`${F}ts filename="x.ts"`, 'const a = 1;', F)).blocks).toEqual([]);
  });

  it('accepts a path with no language before it', () => {
    const { blocks } = readBlocks(md(`${F}src/a.ts`, 'x', F));

    expect(blocks[0]?.path).toBe('src/a.ts');
  });

  it('accepts a path with parentheses, which the app group needs', () => {
    const { blocks } = readBlocks(md(`${F}tsx src/app/(frontend)/layout.tsx`, 'x', F));

    expect(blocks[0]?.path).toBe('src/app/(frontend)/layout.tsx');
  });

  it('ignores a bare filename, which names nothing findable', () => {
    expect(readBlocks(md(`${F}ts layout.tsx`, 'x', F)).blocks).toEqual([]);
  });

  it('reports the line the block opens on, so a failure is locatable', () => {
    const { blocks } = readBlocks(md('antes', '', `${F}ts src/a.ts`, 'x', F));

    expect(blocks[0]?.startLine).toBe(3);
  });

  it('keeps the body verbatim, indentation included', () => {
    const { blocks } = readBlocks(md(`${F}ts src/a.ts`, 'function f() {', '  return 1;', '}', F));

    expect(blocks[0]?.lines).toEqual(['function f() {', '  return 1;', '}']);
  });

  it('does not end a block on a fence inside it', () => {
    const { blocks } = readBlocks(md('````md src/a.md', `${F}ts`, 'x', F, '````'));

    expect(blocks[0]?.lines).toEqual([`${F}ts`, 'x', F]);
  });
});

describe('isElision', () => {
  it.each(['…', '...', '  …  ', '// …', '// ...'])('treats %s as an elision', (line) => {
    expect(isElision(line)).toBe(true);
  });

  it.each(['const a = 1;', '// um comentário', ''])('does not treat %s as one', (line) => {
    expect(isElision(line)).toBe(false);
  });
});

describe('firstMismatch', () => {
  const file = ['export interface Meta {', '  locale: string;', '  title?: string;', '}'];

  it('accepts a block whose lines are all in the file, in order', () => {
    expect(firstMismatch(['export interface Meta {', '  locale: string;'], file)).toBeUndefined();
  });

  it('accepts a partial quote joined by an elision', () => {
    expect(firstMismatch(['export interface Meta {', '  …', '}'], file)).toBeUndefined();
  });

  it('names the line that is no longer there', () => {
    expect(firstMismatch(['export interface Meta {', '  locale: number;'], file)).toBe(
      'locale: number;',
    );
  });

  it('refuses lines that are in the file but out of order, because order is the claim', () => {
    expect(firstMismatch(['}', 'export interface Meta {'], file)).toBe('export interface Meta {');
  });

  it('ignores indentation, which a document may reflow', () => {
    expect(firstMismatch(['        locale: string;'], file)).toBeUndefined();
  });

  it('ignores blank lines in the quote', () => {
    expect(firstMismatch(['export interface Meta {', '', '}'], file)).toBeUndefined();
  });
});
