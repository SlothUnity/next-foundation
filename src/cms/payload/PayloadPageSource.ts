import { getPayload } from 'payload';

import config from '@payload-config';

import { PageSource } from '@/core/pages/PageSource';
import type { PageDefinition } from '@/types';

import { isSupportedLocale, type SupportedLocale } from './config/locales';
import { mapPayloadPage } from './PayloadPageMapper';

export class PayloadPageSource extends PageSource {
  async getPage(slug: string, locale?: string): Promise<PageDefinition | undefined> {
    if (!locale || !isSupportedLocale(locale)) {
      return undefined;
    }

    const payloadLocale: SupportedLocale = locale;

    const payload = await getPayload({ config });

    const result = await payload.find({
      collection: 'pages',
      locale: payloadLocale,
      fallbackLocale: false,

      where: slug
        ? { slug: { equals: slug } }
        : {
            isHome: {
              equals: true,
            },
          },

      limit: 1,
    });

    const page = result.docs[0];

    if (!page) {
      return undefined;
    }

    return mapPayloadPage(page, payloadLocale);
  }
}
