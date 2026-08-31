import { describe, expect, it } from 'vitest';

import { home } from '../pages/home';

import { MockPageSource } from './MockPageSource';

const [homePt, homeEn] = home;

describe('MockPageSource', () => {
  it('returns the mock page for a known path', async () => {
    const source = new MockPageSource();

    const page = await source.getPage('', 'pt-PT');

    expect(page).toBe(homePt?.page);
  });

  it('falls back to the site default locale when none is given', async () => {
    const source = new MockPageSource();

    const page = await source.getPage('');

    expect(page).toBe(homePt?.page);
  });

  it('serves the same path in another locale', async () => {
    const source = new MockPageSource();

    const page = await source.getPage('', 'en-GB');

    expect(page).toBe(homeEn?.page);
  });

  it('returns undefined for a locale it does not serve', async () => {
    const source = new MockPageSource();

    const page = await source.getPage('', 'fr-FR');

    expect(page).toBeUndefined();
  });

  it('returns undefined for an unknown path', async () => {
    const source = new MockPageSource();

    const page = await source.getPage('/does-not-exist');

    expect(page).toBeUndefined();
  });
});
