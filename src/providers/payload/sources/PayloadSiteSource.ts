import { SiteSource } from '@/core/site';
import type { SiteDefinition } from '@/core/site';

import { getCachedSite } from '@/providers/payload/cache/getCachedSite';

export class PayloadSiteSource extends SiteSource {
  async getSite(): Promise<SiteDefinition> {
    return getCachedSite();
  }
}
