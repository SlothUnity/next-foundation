import { getPayload } from 'payload';

import type { PageDefinition } from '@/types';
import { PageSource } from '@/core/pages/PageSource';

import config from '@payload-config';

export class PayloadPageSource extends PageSource {
  async getPage(slug: string, locale?: string): Promise<PageDefinition | undefined> {
    const payload = await getPayload({ config });

    const result = await payload.find({
      collection: 'pages',
      where: {
        and: [
          {
            slug: {
              equals: slug,
            },
          },
          ...(locale
            ? [
                {
                  'meta.locale': {
                    equals: locale,
                  },
                },
              ]
            : []),
        ],
      },
      limit: 1,
    });

    const page = result.docs[0];

    if (!page) {
      return undefined;
    }

    console.log(page);

    return {
      meta: {
        locale: '',
      },
      main: [],
    };
  }
}
