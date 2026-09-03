import type { Payload } from 'payload';

import { createPagePath } from '@/core/routing';

interface Breadcrumb {
  url?: string | null;
}

type LocalisedBreadcrumbs = Record<string, Breadcrumb[] | null | undefined>;

export async function loadPayloadAlternates(
  payload: Payload,
  id: number | string,
  locales: string[],
  defaultLocale: string,
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

  const alternates: Record<string, string> = {};

  for (const locale of locales) {
    const url = localised[locale]?.at(-1)?.url;

    if (typeof url !== 'string') {
      continue;
    }

    alternates[locale] = createPagePath({ path: url, locale, defaultLocale });
  }

  return alternates;
}
