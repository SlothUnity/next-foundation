import { describe, expect, it } from 'vitest';

import { getLivePreviewUrl } from './getLivePreviewUrl';

function paramsOf(url: string) {
  return new URLSearchParams(url.split('?')[1]);
}

const SECRET = 'segredo';

describe('getLivePreviewUrl', () => {
  it('points at the preview route', () => {
    const url = getLivePreviewUrl({
      breadcrumbs: [{ url: '/sobre-nos' }],
      locale: 'pt-PT',
      defaultLocale: 'pt-PT',
      previewSecret: SECRET,
    });

    expect(url.startsWith('/next/preview?')).toBe(true);
  });

  it('carries the secret it was given, and does not read the environment', () => {
    const url = getLivePreviewUrl({
      breadcrumbs: [{ url: '/sobre-nos' }],
      locale: 'pt-PT',
      defaultLocale: 'pt-PT',
      previewSecret: SECRET,
    });

    expect(paramsOf(url).get('previewSecret')).toBe(SECRET);
  });

  it('uses the last breadcrumb as the path', () => {
    const url = getLivePreviewUrl({
      breadcrumbs: [{ url: '/servicos' }, { url: '/servicos/consultoria' }],
      locale: 'pt-PT',
      defaultLocale: 'pt-PT',
      previewSecret: SECRET,
    });

    expect(paramsOf(url).get('path')).toBe('/servicos/consultoria');
  });

  it('falls back to the root when there are no breadcrumbs', () => {
    // O generateURL do nested-docs exclui a homepage, portanto o url dela é "/".
    const url = getLivePreviewUrl({
      breadcrumbs: [],
      locale: 'pt-PT',
      defaultLocale: 'pt-PT',
      previewSecret: SECRET,
    });

    expect(paramsOf(url).get('path')).toBe('/');
  });

  it('prefixes the path when the locale is not the default one', () => {
    const url = getLivePreviewUrl({
      breadcrumbs: [{ url: '/about-us' }],
      locale: 'en-GB',
      defaultLocale: 'pt-PT',
      previewSecret: SECRET,
    });

    expect(paramsOf(url).get('path')).toBe('/en/about-us');
  });
});
