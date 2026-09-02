import { cache } from 'react';

import { draftMode } from 'next/headers';

import { foundation } from '@/core/foundation/foundation';
import type { PageResponse } from '@/core/pages';
import type { ResolvedRoute } from '@/core/routing';
import { resolveRoute } from '@/core/routing';
import type { SiteDefinition } from '@/core/site';

import { resolveSite } from './resolveSite';

export interface ResolvedPage {
  response: PageResponse;
  route: ResolvedRoute;
  site: SiteDefinition;
}

const resolve = cache(async (path: string): Promise<ResolvedPage> => {
  const { isEnabled: isDraft } = await draftMode();

  const site = await resolveSite();

  const route = resolveRoute({
    segments: path ? path.split('/') : [],
    locales: site.locales,
    defaultLocale: site.defaultLocale,
  });

  const response = await foundation.page.getPage(route.path, route.locale, { draft: isDraft });

  return { response, route, site };
});

export function resolvePage(segments: string[]): Promise<ResolvedPage> {
  return resolve(segments.join('/'));
}
