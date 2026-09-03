import type { Site } from '@payload-types';

import type { SiteDefinition } from '@/core/site';

import { payloadDefaultLocale } from '@/providers/payload/locales';

export function mapPayloadSite(site: Site): SiteDefinition {
  const locales = site.enabledLocales ?? [];

  if (locales.length === 0) {
    console.warn(
      'The `site` global has no enabledLocales. Falling back to the Payload default locale — fill it in the admin, under Website → Site Settings.',
    );
  }

  if (!site.name) {
    console.warn(
      'The `site` global has no name. The page title template falls back to the page title alone — fill it in the admin, under Website → Site Settings.',
    );
  }

  return {
    name: site.name || '',
    locales,

    defaultLocale: locales[0] ?? payloadDefaultLocale,
  };
}
