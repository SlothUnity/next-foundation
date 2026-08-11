import { PayloadSiteSource } from '@/provider/payload/PayloadSiteSource';

import { MockSiteSource } from './MockSiteSource';
import type { SiteSource } from './SiteSource';

export function createSiteSource(): SiteSource {
  switch (process.env.CMS_SOURCE) {
    case 'payload':
      return new PayloadSiteSource();

    case 'mock':
      return new MockSiteSource();

    default:
      throw new Error(`Unsupported CMS_SOURCE "${process.env.CMS_SOURCE}".`);
  }
}
