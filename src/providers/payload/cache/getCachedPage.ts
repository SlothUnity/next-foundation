import { unstable_cache } from 'next/cache';

import type { SupportedLocale } from '@/providers/payload/locales';
import { loadPayloadPage } from '@/providers/payload/sources/loadPayloadPage';

import { PAGES_TAG } from './tags';

export const getCachedPage = unstable_cache(
  (path: string, locale: SupportedLocale, locales: string[], defaultLocale: string) =>
    loadPayloadPage(path, locale, false, locales, defaultLocale),
  ['payload:page:response'],
  { tags: [PAGES_TAG] },
);
