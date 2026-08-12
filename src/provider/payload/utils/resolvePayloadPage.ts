import type { Payload } from 'payload';

import type { Page } from '@payload-types';
import type { SupportedLocale } from '@/provider/payload/config/locales';

export async function resolvePayloadPage(
  payload: Payload,
  path: string,
  locale: SupportedLocale,
  draft = false,
): Promise<Page | undefined> {
  const result = await payload.find({
    collection: 'pages',
    locale,
    fallbackLocale: false,
    draft,
    overrideAccess: draft,
    where: !path ? { isHome: { equals: true } } : { 'breadcrumbs.url': { equals: `/${path}` } },
    limit: 1,
    depth: 2,
  });

  return result.docs[0];
}
