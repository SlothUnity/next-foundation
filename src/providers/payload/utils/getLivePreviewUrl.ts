import { createPagePath } from '@/core/routing';

interface Breadcrumb {
  url?: string | null;
}

interface GetLivePreviewUrlOptions {
  breadcrumbs?: Breadcrumb[] | null;
  locale: string;
  defaultLocale: string;
}

export function getLivePreviewUrl({
  breadcrumbs,
  locale,
  defaultLocale,
}: GetLivePreviewUrlOptions): string {
  const lastBreadcrumb = breadcrumbs?.[breadcrumbs.length - 1];

  // O generateURL do nested-docs já exclui a homepage, logo o url dela é "/".
  const path = typeof lastBreadcrumb?.url !== 'string' ? '/' : lastBreadcrumb.url;

  const params = new URLSearchParams({
    path: createPagePath({ path, locale, defaultLocale }),
    previewSecret: process.env.PREVIEW_SECRET ?? '',
  });

  return `/next/preview?${params.toString()}`;
}
