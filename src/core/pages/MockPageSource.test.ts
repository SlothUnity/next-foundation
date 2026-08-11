import { describe, expect, it } from 'vitest';

import homePage from '@/provider/mocks/pages/home';

import { MockPageSource } from './MockPageSource';

describe('MockPageSource', () => {
  it('returns the mock page for a known slug', async () => {
    const source = new MockPageSource();

    const page = await source.getPage('/');

    expect(page).toBe(homePage);
  });

  it('accepts a locale', async () => {
    const source = new MockPageSource();

    const page = await source.getPage('/', 'pt-PT');

    expect(page).toBe(homePage);
  });

  it('returns undefined for an unknown slug', async () => {
    const source = new MockPageSource();

    const page = await source.getPage('/does-not-exist');

    expect(page).toBeUndefined();
  });
});
