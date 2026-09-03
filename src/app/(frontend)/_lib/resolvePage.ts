import { cache } from 'react';

import { draftMode } from 'next/headers';

import { foundation } from '@/core/foundation/foundation';
import type { PageQuery, PageResponse } from '@/core/pages';
import type { RawQuery, ResolvedRoute } from '@/core/routing';
import { normalizeQuery, queryKey, resolveRoute } from '@/core/routing';
import type { SiteDefinition } from '@/core/site';

import { resolveSite } from './resolveSite';

export interface ResolvedPage {
  response: PageResponse;
  route: ResolvedRoute;
  site: SiteDefinition;
}

const resolve = cache(async (path: string, serializedQuery: string): Promise<ResolvedPage> => {
  const { isEnabled: isDraft } = await draftMode();

  const site = await resolveSite();

  const route = resolveRoute({
    segments: path ? path.split('/') : [],
    locales: site.locales,
    defaultLocale: site.defaultLocale,
  });

  const query = JSON.parse(serializedQuery) as PageQuery;

  const response = await foundation.page.getPage(route.path, route.locale, {
    draft: isDraft,
    query,
  });

  return { response, route, site };
});

export function resolvePage(segments: string[], query?: RawQuery): Promise<ResolvedPage> {
  return resolve(segments.join('/'), queryKey(normalizeQuery(query)));
}
