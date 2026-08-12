import { SiteSource } from '@/core/site/SiteSource';

import { mockSite } from './data/site';

export class MockSiteSource extends SiteSource {
  async getSite() {
    return mockSite;
  }
}
