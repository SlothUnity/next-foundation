import { cache } from 'react';

import { draftMode } from 'next/headers';

import { foundation } from '@/core/foundation/foundation';
import type { PageDefinition } from '@/core/pages';
import type { ResolvedRoute } from '@/core/routing';
import { resolveRoute } from '@/core/routing';
import type { SiteDefinition } from '@/core/site';

import { resolveSite } from '../resolveSite';

export interface ResolvedPage {
  page: PageDefinition;
  route: ResolvedRoute;
  site: SiteDefinition;
}

const resolve = cache(async (path: string): Promise<ResolvedPage | undefined> => {
  const { isEnabled: isDraft } = await draftMode();

  const site = await resolveSite();

  const route = resolveRoute({
    segments: path ? path.split('/') : [],
    locales: site.locales,
    defaultLocale: site.defaultLocale,
  });

  const page = await foundation.page.getPage(route.path, route.locale, { draft: isDraft });

  if (!page) {
    return undefined;
  }

  return { page, route, site };
});

export function resolvePage(segments: string[]): Promise<ResolvedPage | undefined> {
  return resolve(segments.join('/'));
}
