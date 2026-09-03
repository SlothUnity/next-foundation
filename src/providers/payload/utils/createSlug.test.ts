import { describe, expect, it } from 'vitest';

import { createSlug } from './createSlug';

describe('createSlug', () => {
  it.each([
    ['Sobre Nós', 'sobre-nos'],
    ['Ação & Coração', 'acao-coracao'],
    ['Ünïcôdé Mïxtö', 'unicode-mixto'],
  ])('strips diacritics without losing the letter: %s', (title, slug) => {
    expect(createSlug(title)).toBe(slug);
  });

  it.each([
    ['  Espaços  à volta  ', 'espacos-a-volta'],
    ['Serviços/Consultoria', 'servicos-consultoria'],
    ['Preço: 10€', 'preco-10'],
    ['a—b', 'a-b'],
  ])('turns every run of punctuation or space into one hyphen: %s', (title, slug) => {
    expect(createSlug(title)).toBe(slug);
  });

  it('keeps digits, because a year or a version is part of a real title', () => {
    expect(createSlug('2026 Relatório')).toBe('2026-relatorio');
  });

  it('never leaves a leading or trailing hyphen for a URL to carry', () => {
    for (const title of ['— Título —', '...Título...', '   Título   ']) {
      const slug = createSlug(title);

      expect(slug.startsWith('-')).toBe(false);
      expect(slug.endsWith('-')).toBe(false);
    }
  });

  it('is idempotent, so re-slugging an existing slug does not erode it', () => {
    for (const title of ['Sobre Nós', 'Ação & Coração', '2026 Relatório']) {
      const once = createSlug(title);

      expect(createSlug(once)).toBe(once);
    }
  });
});

describe('createSlug, the three edges this pins rather than blesses', () => {
  it('gives two different titles the same URL, and nothing here notices', () => {
    expect(createSlug('Sobre Nós')).toBe(createSlug('Sobre nós!'));

    expect(createSlug('Página 1')).toBe(createSlug('Pagina—1'));
  });

  it.each(['日本語', 'Ελληνικά', 'Привет', 'خدمات', '---'])(
    'collapses %s to the empty string, leaving the page with no URL of its own',
    (title) => {
      expect(createSlug(title)).toBe('');
    },
  );

  it.each([
    ['Admin', 'admin'],
    ['API', 'api'],
    ['Next', 'next'],
  ])('produces %s -> /%s, which belongs to the CMS or the framework', (title, slug) => {
    expect(createSlug(title)).toBe(slug);
  });
});
