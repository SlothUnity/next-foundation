import type { Payload, Where } from 'payload';

import type { Page } from '@payload-types';
import type { SupportedLocale } from '@/providers/payload/locales';

export async function resolvePayloadPage(
  payload: Payload,
  path: string,
  locale: SupportedLocale,
  draft = false,
): Promise<Page | undefined> {
  const byPath: Where = !path
    ? { isHome: { equals: true } }
    : { 'breadcrumbs.url': { equals: `/${path}` } };

  const where: Where = draft ? byPath : { and: [byPath, { _status: { equals: 'published' } }] };

  const result = await payload.find({
    collection: 'pages',
    locale,
    fallbackLocale: false,
    draft,
    overrideAccess: true,
    where,
    limit: 1,
    depth: 2,
  });

  return result.docs[0];
}
