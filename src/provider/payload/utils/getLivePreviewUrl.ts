import { createPagePath } from '@/core/routing';

interface Breadcrumb {
  url?: string | null;
}

interface GetLivePreviewUrlOptions {
  breadcrumbs?: Breadcrumb[] | null;
  isHome?: boolean | null;
  locale: string;
  defaultLocale: string;
}

export function getLivePreviewUrl({
  breadcrumbs,
  isHome,
  locale,
  defaultLocale,
}: GetLivePreviewUrlOptions): string {
  const lastBreadcrumb = breadcrumbs?.[breadcrumbs.length - 1];

  const path = isHome || typeof lastBreadcrumb?.url !== 'string' ? '/' : lastBreadcrumb.url;

  const params = new URLSearchParams({
    path: createPagePath({ path, locale, defaultLocale }),
    previewSecret: process.env.PREVIEW_SECRET ?? '',
  });

  return `/next/preview?${params.toString()}`;
}
