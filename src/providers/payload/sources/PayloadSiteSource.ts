import { SiteSource } from '@/core/site';
import type { SiteDefinition } from '@/core/site';

import { getPayloadClient } from '@/providers/payload/getPayloadClient';

import { mapPayloadSite } from '../mappers/mapPayloadSite';

export class PayloadSiteSource extends SiteSource {
  async getSite(): Promise<SiteDefinition> {
    const payload = await getPayloadClient();

    const site = await payload.findGlobal({
      slug: 'site',
    });

    return mapPayloadSite(site);
  }
}
