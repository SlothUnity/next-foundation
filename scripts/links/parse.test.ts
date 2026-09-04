import { describe, expect, it } from 'vitest';

import { collectLinks, headingSlugs, slugify } from './parse';

describe('collectLinks', () => {
  it('reads a plain relative link', () => {
    expect(collectLinks('ver [core.md](core.md) para o contrato')).toEqual([
      { raw: 'core.md', target: 'core.md' },
    ]);
  });

  it('splits the anchor from the file', () => {
    expect(collectLinks('[x](routing.md#sitemap-e-robots)')).toEqual([
      { raw: 'routing.md#sitemap-e-robots', target: 'routing.md', anchor: 'sitemap-e-robots' },
    ]);
  });

  it('reads an angle-bracket link whose path contains parentheses', () => {
    const [link] = collectLinks('[o layout](<../src/app/(frontend)/layout.tsx>)');

    expect(link?.target).toBe('../src/app/(frontend)/layout.tsx');
  });

  it('keeps an anchor with no file, which points inside the same document', () => {
    expect(collectLinks('[acima](#o-404-é-conteúdo)')).toEqual([
      { raw: '#o-404-é-conteúdo', target: '', anchor: 'o-404-é-conteúdo' },
    ]);
  });

  it.each(['https://exemplo.pt', 'http://exemplo.pt', 'mailto:a@b.pt'])(
    'leaves %s alone, because this checker only answers for the repository',
    (href) => {
      expect(collectLinks(`[x](${href})`)).toEqual([]);
    },
  );
});

describe('slugify', () => {
  it('lowercases, drops punctuation and keeps accents, like GitHub', () => {
    expect(slugify('O 404 é conteúdo')).toBe('o-404-é-conteúdo');
  });

  it('emits one hyphen per space, so a dash between words leaves two', () => {
    expect(slugify('Cap. 0 — O vocabulário')).toBe('cap-0--o-vocabulário');
  });

  it('ignores the backticks and asterisks a heading uses for emphasis', () => {
    expect(slugify('O `createSlug` **importa**')).toBe('o-createslug-importa');
  });

  it('keeps an underscore, because snake_case in a heading is part of the anchor', () => {
    expect(slugify('`unstable_cache` está depreciado')).toBe('unstable_cache-está-depreciado');
  });
});

describe('headingSlugs', () => {
  it('collects every heading level', () => {
    const slugs = headingSlugs('# Um\n\ntexto\n\n### Três\n\n###### Seis\n');

    expect([...slugs].sort()).toEqual(['seis', 'três', 'um'].sort());
  });

  it('does not treat a hash inside a fenced block heading as a heading of its own', () => {
    expect(headingSlugs('texto # não é título\n')).toEqual(new Set());
  });
});

const NEWLINE = String.fromCharCode(10);

describe('code is not prose', () => {
  it('ignores a link inside inline code, which a document may need to show', () => {
    expect(collectLinks('escreve-se `[label](../ficheiro.ts)` assim')).toEqual([]);
  });

  it('ignores links inside a fenced block', () => {
    const text = ['antes', '```md', '[x](nao-existe.md)', '```', 'depois'].join(NEWLINE);

    expect(collectLinks(text)).toEqual([]);
  });

  it('still finds a real link on a line that also has inline code', () => {
    const links = collectLinks('o `pnpm dev` e o [guia](guide.md)');

    expect(links.map((link) => link.target)).toEqual(['guide.md']);
  });

  it('still finds a real link after a fenced block', () => {
    const text = ['```ts', 'const a = 1;', '```', 'ver o [guia](guide.md)'].join(NEWLINE);

    expect(collectLinks(text).map((link) => link.target)).toEqual(['guide.md']);
  });
});
