import type { Site } from '@payload-types';

import type { SiteDefinition } from '@/core/site';

export function mapPayloadSite(site: Site): SiteDefinition {
  return {
    name: site.name,
    locales: site.enabledLocales ?? [],
  };
}
