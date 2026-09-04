import type { PageResponse } from '@/core/pages';

import { getPayloadClient } from '@/providers/payload/getPayloadClient';
import type { SupportedLocale } from '@/providers/payload/locales';
import { mapPayloadPage } from '@/providers/payload/mappers/mapPayloadPage';
import { loadPayloadAlternates } from '@/providers/payload/sources/loadPayloadAlternates';
import { loadPayloadLayout } from '@/providers/payload/sources/loadPayloadLayout';
import {
  resolvePayloadNotFoundPage,
  resolvePayloadPage,
} from '@/providers/payload/sources/resolvePayloadPage';

export async function loadPayloadPage(
  path: string,
  locale: SupportedLocale,
  draft: boolean,
  locales: string[] = [],
  defaultLocale: string = locale,
): Promise<PageResponse> {
  const payload = await getPayloadClient();

  const page = await resolvePayloadPage(payload, path, locale, draft);

  if (page) {
    const [alternates, layout] = await Promise.all([
      loadPayloadAlternates(payload, page.id, locales, defaultLocale, locale),
      loadPayloadLayout(payload, locale),
    ]);

    return { status: 'ok', page: { ...mapPayloadPage(page, locale, alternates), ...layout } };
  }

  const notFound = await resolvePayloadNotFoundPage(payload, locale, draft);

  if (!notFound) {
    return { status: 'notFound' };
  }

  const layout = await loadPayloadLayout(payload, locale);

  return {
    status: 'notFound',
    page: { ...mapPayloadPage(notFound, locale), ...layout },
  };
}
