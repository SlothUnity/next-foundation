import type { PageDefinition } from '@/core/pages';

import { PageSource } from '@/core/pages/PageSource';
import type { GetPageOptions } from '@/core/pages/PageSource';

import { getPayloadClient } from '@/providers/payload/getPayloadClient';
import { isSupportedLocale, type SupportedLocale } from '@/providers/payload/locales';

import { mapPayloadPage } from '@/providers/payload/mappers/mapPayloadPage';
import { resolvePayloadPage } from '@/providers/payload/sources/resolvePayloadPage';

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

    const payload = await getPayloadClient();

    const page = await resolvePayloadPage(payload, path, payloadLocale, options?.draft ?? false);

    if (!page) {
      return undefined;
    }

    return mapPayloadPage(page, payloadLocale);
  }
}
