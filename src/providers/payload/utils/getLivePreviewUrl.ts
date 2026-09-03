import { createPagePath } from '@/core/routing';

import { createPreviewToken } from './previewToken';

interface Breadcrumb {
  url?: string | null;
}

interface GetLivePreviewUrlOptions {
  breadcrumbs?: Breadcrumb[] | null;
  locale: string;
  defaultLocale: string;
  previewSecret: string;
}

export function getLivePreviewUrl({
  breadcrumbs,
  locale,
  defaultLocale,
  previewSecret,
}: GetLivePreviewUrlOptions): string {
  const lastBreadcrumb = breadcrumbs?.[breadcrumbs.length - 1];

  const path = typeof lastBreadcrumb?.url !== 'string' ? '/' : lastBreadcrumb.url;

  const pagePath = createPagePath({ path, locale, defaultLocale });

  const params = new URLSearchParams({
    path: pagePath,
    token: createPreviewToken(pagePath, previewSecret),
  });

  return `/next/preview?${params.toString()}`;
}
