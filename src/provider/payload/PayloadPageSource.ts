import { getPayload } from 'payload';

import config from '../../../payload.config';

import { PageSource } from '@/core/pages/PageSource';
import type { PageDefinition } from '@/types';

import { isSupportedLocale, type SupportedLocale } from './config/locales';

import { mapPayloadPage } from './PayloadPageMapper';
import { resolvePayloadPage } from './resolvePayloadPage';

export class PayloadPageSource extends PageSource {
  async getPage(path: string, locale?: string): Promise<PageDefinition | undefined> {
    if (!locale || !isSupportedLocale(locale)) {
      return undefined;
    }

    const payloadLocale: SupportedLocale = locale;

    const payload = await getPayload({
      config,
    });

    const page = await resolvePayloadPage(payload, path, payloadLocale);

    if (!page) {
      return undefined;
    }

    return mapPayloadPage(page, payloadLocale);
  }
}
