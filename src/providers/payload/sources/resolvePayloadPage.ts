import type { Payload, Where } from 'payload';

import type { Page } from '@payload-types';
import type { SupportedLocale } from '@/providers/payload/locales';

async function findPage(
  payload: Payload,
  match: Where,
  locale: SupportedLocale,
  draft: boolean,
): Promise<Page | undefined> {
  const where: Where = draft ? match : { and: [match, { _status: { equals: 'published' } }] };

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

export async function resolvePayloadPage(
  payload: Payload,
  path: string,
  locale: SupportedLocale,
  draft = false,
): Promise<Page | undefined> {
  const byPath: Where = !path
    ? { isHome: { equals: true } }
    : { 'breadcrumbs.url': { equals: `/${path}` } };

  return findPage(payload, byPath, locale, draft);
}

export async function resolvePayloadNotFoundPage(
  payload: Payload,
  locale: SupportedLocale,
  draft = false,
): Promise<Page | undefined> {
  return findPage(payload, { is404: { equals: true } }, locale, draft);
}
