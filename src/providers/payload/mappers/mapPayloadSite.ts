import type { Site } from '@payload-types';

import type { SiteDefinition } from '@/core/site';

import { payloadDefaultLocale } from '@/providers/payload/locales';

export function mapPayloadSite(site: Site): SiteDefinition {
  const locales = site.enabledLocales ?? [];

  if (locales.length === 0) {
    // O routing não pára — cai no `payloadDefaultLocale` logo abaixo — mas o site
    // fica a servir um idioma que ninguém escolheu. Sem o aviso, a única pista era
    // o `PageUrl` deixar de renderizar no admin.
    console.warn(
      'The `site` global has no enabledLocales. Falling back to the Payload default locale — fill it in the admin, under Website → Site Settings.',
    );
  }

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
