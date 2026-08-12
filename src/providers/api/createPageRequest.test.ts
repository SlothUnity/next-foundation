import { describe, expect, it } from 'vitest';

import { createPageRequest } from './createPageRequest';

describe('createPageRequest', () => {
  it('sends the path as it is', () => {
    expect(createPageRequest({ path: 'sobre-nos' })).toEqual({ endpoint: '/sobre-nos' });
  });

  it('keeps a locale segment in the path, without knowing it is one', () => {
    expect(createPageRequest({ path: 'en/about-us' }).endpoint).toBe('/en/about-us');
  });

  it('asks for the root on the homepage', () => {
    expect(createPageRequest({ path: '' }).endpoint).toBe('/');
  });

  it('keeps nested paths whole', () => {
    expect(createPageRequest({ path: 'servicos/consultoria' }).endpoint).toBe(
      '/servicos/consultoria',
    );
  });

  it('sends no context of its own', () => {
    const request = createPageRequest({ path: 'sobre-nos', draft: true });

    expect(request.params).toBeUndefined();
    expect(request.headers).toBeUndefined();
  });
});
