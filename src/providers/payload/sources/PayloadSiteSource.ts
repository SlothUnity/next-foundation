import { getPayload } from 'payload';

import config from '@payload-config';

import { SiteSource } from '@/core/site';
import type { SiteDefinition } from '@/core/site';

import { mapPayloadSite } from '../mappers/mapPayloadSite';

export class PayloadSiteSource extends SiteSource {
  async getSite(): Promise<SiteDefinition> {
    const payload = await getPayload({ config });

    const site = await payload.findGlobal({
      slug: 'site',
    });

    return mapPayloadSite(site);
  }
}
