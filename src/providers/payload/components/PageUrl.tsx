import type { UIFieldServerProps } from 'payload';

import { createPagePath } from '@/core/routing';
import { mapPayloadSite } from '@/providers/payload/mappers/mapPayloadSite';

interface Breadcrumb {
  url?: string | null;
}

export default async function PageUrl({ data, req }: UIFieldServerProps) {
  const breadcrumbs = (data?.breadcrumbs ?? null) as Breadcrumb[] | null;
  const lastBreadcrumb = breadcrumbs?.[breadcrumbs.length - 1];

  if (typeof lastBreadcrumb?.url !== 'string') {
    return (
      <div>
        <span>Page URL: </span>
        <span>save the page to get its URL.</span>
      </div>
    );
  }

  const site = await req.payload.findGlobal({ slug: 'site', depth: 0 });

  const { defaultLocale } = mapPayloadSite(site);
  const locale = !req.locale || req.locale === 'all' ? defaultLocale : req.locale;

  const url = `${req.origin}${createPagePath({ path: lastBreadcrumb.url, locale, defaultLocale })}`;

  return (
    <div>
      <span>Page URL: </span>

      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    </div>
  );
}
