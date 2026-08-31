import type { Site } from '@payload-types';

import type { SiteDefinition } from '@/core/site';

import { payloadDefaultLocale } from '@/providers/payload/locales';

export function mapPayloadSite(site: Site): SiteDefinition {
  const locales = site.enabledLocales ?? [];

  return {
    name: site.name,
    locales,

    // O campo é ordenável no admin e a sua descrição promete que «the first language is
    // the default» — é essa promessa que se cumpre aqui. Com o global por preencher não
    // há resposta possível vinda dos dados, e o `defaultLocale` do payload.config é o
    // único valor que o CMS garante conhecer.
    defaultLocale: locales[0] ?? payloadDefaultLocale,
  };
}
