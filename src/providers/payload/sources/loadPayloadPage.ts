import type { PageResponse } from '@/core/pages';

import { getPayloadClient } from '@/providers/payload/getPayloadClient';
import type { SupportedLocale } from '@/providers/payload/locales';
import { mapPayloadPage } from '@/providers/payload/mappers/mapPayloadPage';
import {
  resolvePayloadNotFoundPage,
  resolvePayloadPage,
} from '@/providers/payload/sources/resolvePayloadPage';

export async function loadPayloadPage(
  path: string,
  locale: SupportedLocale,
  draft: boolean,
): Promise<PageResponse> {
  const payload = await getPayloadClient();

  const page = await resolvePayloadPage(payload, path, locale, draft);

  if (page) {
    return { status: 'ok', page: mapPayloadPage(page, locale) };
  }

  const notFound = await resolvePayloadNotFoundPage(payload, locale, draft);

  return {
    status: 'notFound',
    page: notFound ? mapPayloadPage(notFound, locale) : undefined,
  };
}
