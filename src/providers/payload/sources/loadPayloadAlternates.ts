import type { Payload } from 'payload';

import { createPagePath } from '@/core/routing';

interface Breadcrumb {
  url?: string | null;
}

type LocalisedBreadcrumbs = Record<string, Breadcrumb[] | null | undefined>;

function depthOf(url: string): number {
  return url.split('/').filter(Boolean).length;
}

export async function loadPayloadAlternates(
  payload: Payload,
  id: number | string,
  locales: string[],
  defaultLocale: string,
  locale?: string,
): Promise<Record<string, string>> {
  const doc = await payload.findByID({
    collection: 'pages',
    id,
    locale: 'all',
    depth: 0,
    overrideAccess: true,
    select: { breadcrumbs: true },
  });

  const localised = doc.breadcrumbs as unknown as LocalisedBreadcrumbs | undefined;

  if (!localised) {
    return {};
  }

  const resolvedUrl = locale ? localised[locale]?.at(-1)?.url : undefined;

  const expectedDepth = typeof resolvedUrl === 'string' ? depthOf(resolvedUrl) : undefined;

  const alternates: Record<string, string> = {};

  for (const alternate of locales) {
    const url = localised[alternate]?.at(-1)?.url;

    if (typeof url !== 'string') {
      continue;
    }

    if (expectedDepth !== undefined && depthOf(url) < expectedDepth) {
      console.warn(
        `The page has no title in ${alternate}, so its URL there is "${url}" — a path that belongs to another page. Leaving hreflang="${alternate}" out until it is translated.`,
      );

      continue;
    }

    alternates[alternate] = createPagePath({ path: url, locale: alternate, defaultLocale });
  }

  return alternates;
}
