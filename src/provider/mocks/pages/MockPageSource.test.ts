import { describe, expect, it } from 'vitest';

import homePage from '@/provider/mocks/pages/data/home';

import { MockPageSource } from './MockPageSource';

describe('MockPageSource', () => {
  it('returns the mock page for a known path', async () => {
    const source = new MockPageSource();

    const page = await source.getPage('');

    expect(page).toBe(homePage);
  });

  it('accepts a locale', async () => {
    const source = new MockPageSource();

    const page = await source.getPage('', 'pt-PT');

    expect(page).toBe(homePage);
  });

  it('returns undefined for an unknown path', async () => {
    const source = new MockPageSource();

    const page = await source.getPage('/does-not-exist');

    expect(page).toBeUndefined();
  });
});
