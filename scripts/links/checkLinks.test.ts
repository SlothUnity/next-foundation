import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { checkLinks } from './checkLinks';

let root = '';

function write(relative: string, contents: string): void {
  const file = path.join(root, relative);

  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents);
}

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'links-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('checkLinks', () => {
  it('passes when every target and anchor resolves', () => {
    write('a.md', '# Um\n\n[b](docs/b.md) e [aqui](#um)\n');
    write('docs/b.md', '## Dois\n');

    expect(checkLinks(root)).toEqual({ documents: 2, failures: [] });
  });

  it('reports a file that does not exist', () => {
    write('a.md', '[b](docs/b.md)\n');

    const { failures } = checkLinks(root);

    expect(failures).toEqual([{ file: 'a.md', raw: 'docs/b.md', reason: 'o ficheiro não existe' }]);
  });

  it('reports an anchor the target document does not have', () => {
    write('a.md', '[b](b.md#nao-existe)\n');
    write('b.md', '# Outro título\n');

    expect(checkLinks(root).failures[0]?.reason).toBe('o documento existe, a âncora não');
  });

  it('reports an anchor missing in the same document', () => {
    write('a.md', '# Um\n\n[acima](#dois)\n');

    expect(checkLinks(root).failures[0]?.reason).toBe(
      'não há título com essa âncora neste documento',
    );
  });

  it('resolves a link to a file that is not markdown, without checking its anchor', () => {
    write('a.md', '[código](src/x.ts#L42)\n');
    write('src/x.ts', 'export const x = 1;\n');

    expect(checkLinks(root).failures).toEqual([]);
  });

  it('walks nested folders, which is the bug that made this a function', () => {
    write('a.md', '[fundo](one/two/three.md)\n');
    write('one/two/three.md', '# Fundo\n');

    expect(checkLinks(root).documents).toBe(2);
  });

  it('ignores node_modules, .next and .git', () => {
    write('a.md', '# Um\n');
    write('node_modules/pkg/readme.md', '[quebrado](nao-existe.md)\n');
    write('.next/cache/notes.md', '[quebrado](nao-existe.md)\n');
    write('.git/notes.md', '[quebrado](nao-existe.md)\n');

    expect(checkLinks(root)).toEqual({ documents: 1, failures: [] });
  });

  it('leaves external links alone', () => {
    write('a.md', '[fora](https://exemplo.pt/nao-existe.md)\n');

    expect(checkLinks(root).failures).toEqual([]);
  });
});
