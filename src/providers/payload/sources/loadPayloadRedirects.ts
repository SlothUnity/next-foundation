import type { Payload } from 'payload';

import type { Redirect } from '@payload-types';
import { createPagePath, isSafeRedirectPath } from '@/core/routing';
import { getPayloadClient } from '@/providers/payload/getPayloadClient';
import type { SupportedLocale } from '@/providers/payload/locales';

const REDIRECT_LIMIT = 1000;

export interface PayloadRedirect {
  to: string;
  permanent: boolean;
}

export function normalizeRedirectPath(from: string): string {
  return from.trim().replace(/^\/+/, '').replace(/\/+$/, '');
}

async function resolveTargets(
  payload: Payload,
  ids: Set<number | string>,
  locale: SupportedLocale,
  defaultLocale: string,
): Promise<Map<number | string, string>> {
  const targets = new Map<number | string, string>();

  if (ids.size === 0) {
    return targets;
  }

  const result = await payload.find({
    collection: 'pages',
    locale,
    fallbackLocale: false,
    overrideAccess: true,
    where: {
      and: [{ id: { in: [...ids] } }, { _status: { equals: 'published' } }],
    },
    limit: ids.size,
    depth: 0,
    select: { breadcrumbs: true },
  });

  for (const page of result.docs) {
    const url = page.breadcrumbs?.at(-1)?.url;

    if (!url) {
      continue;
    }

    targets.set(
      page.id,
      createPagePath({ path: normalizeRedirectPath(url), locale, defaultLocale }),
    );
  }

  return targets;
}

export async function loadPayloadRedirects(
  locale: SupportedLocale,
  defaultLocale: string,
): Promise<Record<string, PayloadRedirect>> {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: 'redirects',
    locale,
    fallbackLocale: false,
    overrideAccess: true,
    limit: REDIRECT_LIMIT,
    depth: 0,
  });

  if (result.totalDocs > result.docs.length) {
    console.warn(
      `Only the first ${REDIRECT_LIMIT} of ${result.totalDocs} redirects are served. The rest answer 404 — raise REDIRECT_LIMIT in loadPayloadRedirects.ts, or prune the table.`,
    );
  }

  const referenced = new Set<number | string>();

  for (const doc of result.docs) {
    if (
      doc.type !== 'custom' &&
      (typeof doc.reference === 'number' || typeof doc.reference === 'string')
    ) {
      referenced.add(doc.reference);
    }
  }

  const targets = await resolveTargets(payload, referenced, locale, defaultLocale);

  const map: Record<string, PayloadRedirect> = {};

  for (const doc of result.docs) {
    if (!doc.from) {
      continue;
    }

    const to = resolveDestination(doc, targets);

    if (!to) {
      continue;
    }

    map[normalizeRedirectPath(doc.from)] = { to, permanent: doc.permanent ?? false };
  }

  return map;
}

function resolveDestination(
  doc: Redirect,
  targets: Map<number | string, string>,
): string | undefined {
  if (doc.type === 'custom') {
    if (!doc.custom || !isSafeRedirectPath(doc.custom)) {
      console.warn(`Redirect "${doc.from}" has no usable custom path and was ignored.`);

      return undefined;
    }

    return doc.custom;
  }

  const id = typeof doc.reference === 'object' && doc.reference ? doc.reference.id : doc.reference;

  if (id === null || id === undefined) {
    console.warn(`Redirect "${doc.from}" points at no page and was ignored.`);

    return undefined;
  }

  const to = targets.get(id);

  if (!to) {
    console.warn(
      `Redirect "${doc.from}" points at page ${id}, which is unpublished, untranslated or gone. Ignored, so the browser does not cache a redirect to a 404.`,
    );

    return undefined;
  }

  return to;
}
