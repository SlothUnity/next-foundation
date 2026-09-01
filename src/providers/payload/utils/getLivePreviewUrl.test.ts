import { describe, expect, it } from 'vitest';

import { getLivePreviewUrl } from './getLivePreviewUrl';
import { verifyPreviewToken } from './previewToken';

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

  it('never puts the secret in the url', () => {
    const url = getLivePreviewUrl({
      breadcrumbs: [{ url: '/sobre-nos' }],
      locale: 'pt-PT',
      defaultLocale: 'pt-PT',
      previewSecret: SECRET,
    });

    // O segredo assina, não viaja: uma query string acaba nos logs de acesso, no
    // histórico do browser e no DOM do admin.
    expect(url).not.toContain(SECRET);
    expect(paramsOf(url).get('previewSecret')).toBeNull();
  });

  it('carries a token the preview route accepts for that exact path', () => {
    const url = getLivePreviewUrl({
      breadcrumbs: [{ url: '/sobre-nos' }],
      locale: 'pt-PT',
      defaultLocale: 'pt-PT',
      previewSecret: SECRET,
    });

    const params = paramsOf(url);

    expect(verifyPreviewToken(params.get('token'), String(params.get('path')), SECRET)).toBe(
      'valid',
    );
  });

  it('signs the localized path, not the raw breadcrumb', () => {
    const url = getLivePreviewUrl({
      breadcrumbs: [{ url: '/about-us' }],
      locale: 'en-GB',
      defaultLocale: 'pt-PT',
      previewSecret: SECRET,
    });

    const params = paramsOf(url);

    // A rota valida o token contra o `path` que recebe. Assinar o caminho sem
    // prefixo dava um 403 em tudo o que não fosse o idioma por omissão.
    expect(params.get('path')).toBe('/en/about-us');
    expect(verifyPreviewToken(params.get('token'), '/en/about-us', SECRET)).toBe('valid');
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
