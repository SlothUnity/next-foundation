import type { Payload } from 'payload';

import type { PagePath } from '@/core/pages';
import { createPagePath } from '@/core/routing';
import { getPayloadClient } from '@/providers/payload/getPayloadClient';
import { isSupportedLocale } from '@/providers/payload/locales';

const PATH_LIMIT = 5000;

async function loadLocale(
  payload: Payload,
  locale: string,
  defaultLocale: string,
): Promise<PagePath[]> {
  if (!isSupportedLocale(locale)) {
    return [];
  }

  const result = await payload.find({
    collection: 'pages',
    locale,
    fallbackLocale: false,
    overrideAccess: true,
    limit: PATH_LIMIT,
    depth: 0,
    select: { breadcrumbs: true, updatedAt: true },

    where: {
      and: [{ _status: { equals: 'published' } }, { is404: { not_equals: true } }],
    },
  });

  if (result.totalDocs > result.docs.length) {
    console.warn(
      `Only the first ${PATH_LIMIT} of ${result.totalDocs} pages in "${locale}" are listed. Raise PATH_LIMIT in loadPayloadPaths.ts.`,
    );
  }

  const paths: PagePath[] = [];

  for (const page of result.docs) {
    const url = page.breadcrumbs?.at(-1)?.url;

    if (typeof url !== 'string') {
      continue;
    }

    paths.push({
      path: createPagePath({ path: url, locale, defaultLocale }),
      locale,
      updatedAt: page.updatedAt,
    });
  }

  return paths;
}

export async function loadPayloadPaths(
  locales: string[],
  defaultLocale: string,
): Promise<PagePath[]> {
  const payload = await getPayloadClient();

  const perLocale = await Promise.all(
    locales.map((locale) => loadLocale(payload, locale, defaultLocale)),
  );

  return perLocale.flat();
}
