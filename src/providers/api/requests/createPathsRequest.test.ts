import { describe, expect, it } from 'vitest';

import { createPathsRequest } from './createPathsRequest';

describe('createPathsRequest', () => {
  it('asks one endpoint for every locale, because a sitemap covers the whole site', () => {
    const request = createPathsRequest({
      locales: ['pt-PT', 'en-GB'],
      defaultLocale: 'pt-PT',
    });

    expect(request).toEqual({
      endpoint: '/paths',
      params: { locales: 'pt-PT,en-GB' },
    });
  });

  it('is a placeholder to change, like createPageRequest', () => {
    const { endpoint } = createPathsRequest({ locales: ['pt-PT'], defaultLocale: 'pt-PT' });

    expect(endpoint).toBe('/paths');
  });
});
