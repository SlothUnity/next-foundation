import { getPayload } from 'payload';

import config from '@payload-config';

import type { PageDefinition } from '@/types';

import { PageSource } from '@/core/pages/PageSource';
import type { GetPageOptions } from '@/core/pages/PageSource';

import { isSupportedLocale, type SupportedLocale } from '@/provider/payload/config/locales';

import { mapPayloadPage } from '@/provider/payload/mappers/PayloadPageMapper';
import { resolvePayloadPage } from '@/provider/payload/utils/resolvePayloadPage';

export class PayloadPageSource extends PageSource {
  async getPage(
    path: string,
    locale?: string,
    options?: GetPageOptions,
  ): Promise<PageDefinition | undefined> {
    if (!locale || !isSupportedLocale(locale)) {
      return undefined;
    }

    const payloadLocale: SupportedLocale = locale;

    const payload = await getPayload({
      config,
    });

    const page = await resolvePayloadPage(payload, path, payloadLocale, options?.draft ?? false);

    if (!page) {
      return undefined;
    }

    return mapPayloadPage(page, payloadLocale);
  }
}
