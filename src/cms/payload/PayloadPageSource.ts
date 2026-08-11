import { getPayload } from 'payload';

import config from '@payload-config';

import { PageSource } from '@/core/pages/PageSource';
import type { PageDefinition } from '@/types';

import { isSupportedLocale, type SupportedLocale } from './config/locales';
import { mapPayloadPage } from './PayloadPageMapper';

export class PayloadPageSource extends PageSource {
  async getPage(slug: string, locale?: SupportedLocale): Promise<PageDefinition | undefined> {
    if (locale && !isSupportedLocale(locale)) {
      return undefined;
    }

    const payload = await getPayload({ config });

    const payloadLocale: SupportedLocale | undefined = locale;

    const result = await payload.find({
      collection: 'pages',
      locale: payloadLocale,
      fallbackLocale: false,

      where: {
        slug: {
          equals: slug,
        },
      },

      limit: 1,
    });

    const page = result.docs[0];

    console.log(page);

    if (!page) {
      return undefined;
    }

    return mapPayloadPage(page, payloadLocale ?? 'pt-PT');
  }
}
