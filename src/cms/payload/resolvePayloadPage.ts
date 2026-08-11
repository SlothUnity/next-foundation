import type { Payload } from 'payload';

import type { Page } from '@payload-types';
import type { SupportedLocale } from './config/locales';

export async function resolvePayloadPage(
  payload: Payload,
  path: string,
  locale: SupportedLocale,
): Promise<Page | undefined> {
  if (!path) {
    const result = await payload.find({
      collection: 'pages',
      locale,
      fallbackLocale: false,
      where: {
        isHome: {
          equals: true,
        },
      },
      limit: 1,
      depth: 0,
    });

    return result.docs[0];
  }

  const result = await payload.find({
    collection: 'pages',
    locale,
    fallbackLocale: false,
    where: {
      'breadcrumbs.url': {
        equals: `/${path}`,
      },
    },
    limit: 1,
    depth: 0,
  });

  return result.docs[0];
}
