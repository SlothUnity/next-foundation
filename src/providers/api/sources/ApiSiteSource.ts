import type { SiteDefinition } from '@/core/site';
import { SiteSource } from '@/core/site';

export class ApiSiteSource extends SiteSource {
  async getSite(): Promise<SiteDefinition> {
    return {
      name: 'Site',
      locales: ['pt-PT'],
    };
  }
}
