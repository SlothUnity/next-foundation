import { createPagePath } from '@/core/routing';

interface Breadcrumb {
  url?: string | null;
}

interface GetLivePreviewUrlOptions {
  breadcrumbs?: Breadcrumb[] | null;
  locale: string;
  defaultLocale: string;
  previewSecret: string;
}

/**
 * O `previewSecret` é um parâmetro e não uma leitura de `process.env` aqui dentro.
 *
 * A razão é a falha: sem segredo, esta função produzia um link com
 * `previewSecret=` vazio, e a rota respondia 403 dentro do iframe sem dizer a
 * ninguém que faltava uma variável de ambiente. Quem decide o que fazer com a
 * ausência é quem tem por onde a comunicar — a collection, que tem logger.
 */
export function getLivePreviewUrl({
  breadcrumbs,
  locale,
  defaultLocale,
  previewSecret,
}: GetLivePreviewUrlOptions): string {
  const lastBreadcrumb = breadcrumbs?.[breadcrumbs.length - 1];

  // O generateURL do nested-docs já exclui a homepage, logo o url dela é "/".
  const path = typeof lastBreadcrumb?.url !== 'string' ? '/' : lastBreadcrumb.url;

  const params = new URLSearchParams({
    path: createPagePath({ path, locale, defaultLocale }),
    previewSecret,
  });

  return `/next/preview?${params.toString()}`;
}
