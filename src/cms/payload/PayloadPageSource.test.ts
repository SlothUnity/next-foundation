import { describe, expect, it } from 'vitest';

import { PayloadPageSource } from './PayloadPageSource';

describe('PayloadPageSource', () => {
  const source = new PayloadPageSource();

  it('returns the home page', async () => {
    const page = await source.getPage('/');

    expect(page).toEqual({
      meta: {
        locale: 'pt-PT',
      },
      main: [],
    });
  });

  it('returns the about page', async () => {
    const page = await source.getPage('/sobre');

    expect(page).toEqual({
      meta: {
        locale: 'pt-PT',
      },
      main: [],
    });
  });

  it('returns undefined for an unknown page', async () => {
    const page = await source.getPage('/does-not-exist');

    expect(page).toBeUndefined();
  });

  it('returns undefined when the locale does not match', async () => {
    const page = await source.getPage('/', 'en-US');

    expect(page).toBeUndefined();
  });
});
