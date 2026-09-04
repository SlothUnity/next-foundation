import type { Payload, Where } from 'payload';

import type { Page } from '@payload-types';
import type { SupportedLocale } from '@/providers/payload/locales';

function onlyPublished(match: Where, draft: boolean): Where {
  return draft ? match : { and: [match, { _status: { equals: 'published' } }] };
}

async function findFlagged(
  payload: Payload,
  match: Where,
  locale: SupportedLocale,
  draft: boolean,
): Promise<Page | undefined> {
  const result = await payload.find({
    collection: 'pages',
    locale,
    fallbackLocale: false,
    draft,
    overrideAccess: true,
    where: onlyPublished(match, draft),
    limit: 1,
    depth: 2,
  });

  return result.docs[0];
}

function ownUrl(page: Pick<Page, 'breadcrumbs'>): string | undefined {
  const breadcrumbs = page.breadcrumbs ?? [];

  return breadcrumbs[breadcrumbs.length - 1]?.url ?? undefined;
}

async function findByUrl(
  payload: Payload,
  url: string,
  locale: SupportedLocale,
  draft: boolean,
): Promise<Page | undefined> {
  const candidates = await payload.find({
    collection: 'pages',
    locale,
    fallbackLocale: false,
    draft,
    overrideAccess: true,
    where: onlyPublished({ 'breadcrumbs.url': { equals: url } }, draft),
    limit: 0,
    depth: 0,
    select: { breadcrumbs: true },
  });

  const match = candidates.docs.find((doc) => ownUrl(doc) === url);

  if (!match) {
    return undefined;
  }

  return payload.findByID({
    collection: 'pages',
    id: match.id,
    locale,
    fallbackLocale: false,
    draft,
    overrideAccess: true,
    depth: 2,
  });
}

export async function resolvePayloadPage(
  payload: Payload,
  path: string,
  locale: SupportedLocale,
  draft = false,
): Promise<Page | undefined> {
  if (!path) {
    return findFlagged(payload, { isHome: { equals: true } }, locale, draft);
  }

  return findByUrl(payload, `/${path}`, locale, draft);
}

export async function resolvePayloadNotFoundPage(
  payload: Payload,
  locale: SupportedLocale,
  draft = false,
): Promise<Page | undefined> {
  return findFlagged(payload, { is404: { equals: true } }, locale, draft);
}
