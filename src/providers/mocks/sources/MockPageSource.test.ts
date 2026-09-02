import { describe, expect, it } from 'vitest';

import { home } from '../pages/home';
import { notFound } from '../pages/notFound';

import { MockPageSource } from './MockPageSource';

const [homePt, homeEn] = home;
const [notFoundPt, notFoundEn] = notFound;

const source = new MockPageSource();

describe('MockPageSource', () => {
  it('serves the mock page for a known path', async () => {
    await expect(source.getPage('', 'pt-PT')).resolves.toEqual({
      status: 'ok',
      page: homePt?.page,
    });
  });

  it('falls back to the site default locale when none is given', async () => {
    await expect(source.getPage('')).resolves.toEqual({ status: 'ok', page: homePt?.page });
  });

  it('serves the same path in another locale', async () => {
    await expect(source.getPage('', 'en-GB')).resolves.toEqual({
      status: 'ok',
      page: homeEn?.page,
    });
  });
});

describe('MockPageSource, when the path is unknown', () => {
  it('answers notFound with the error page as content', async () => {
    await expect(source.getPage('nao-existe', 'pt-PT')).resolves.toEqual({
      status: 'notFound',
      page: notFoundPt?.page,
    });
  });

  it('serves the error page in the requested locale', async () => {
    await expect(source.getPage('does-not-exist', 'en-GB')).resolves.toEqual({
      status: 'notFound',
      page: notFoundEn?.page,
    });
  });

  it('keeps the error page out of the indexable set', async () => {
    const response = await source.getPage('nao-existe', 'pt-PT');

    expect(response.status === 'notFound' && response.page?.meta.noIndex).toBe(true);
  });

  it('answers notFound without a page for a locale it does not serve', async () => {
    await expect(source.getPage('', 'fr-FR')).resolves.toEqual({ status: 'notFound' });
  });
});

describe('MockPageSource, when the path is a redirect', () => {
  it('answers redirect instead of a page', async () => {
    await expect(source.getPage('pagina-antiga', 'pt-PT')).resolves.toEqual({
      status: 'redirect',
      to: '/',
      permanent: true,
    });
  });

  it('keeps redirects per locale, because a slug is translated', async () => {
    await expect(source.getPage('old-page', 'en-GB')).resolves.toMatchObject({
      status: 'redirect',
      to: '/en',
    });

    await expect(source.getPage('old-page', 'pt-PT')).resolves.toMatchObject({
      status: 'notFound',
    });
  });
});

describe('MockPageSource, when asked to list its paths', () => {
  it('answers one URL per translation, prefixed like the site serves them', async () => {
    await expect(source.listPaths()).resolves.toEqual([
      { path: '/', locale: 'pt-PT' },
      { path: '/en', locale: 'en-GB' },
    ]);
  });
});
