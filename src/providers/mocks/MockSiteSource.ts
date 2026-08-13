import { SiteSource } from '@/core/site/SiteSource';

import { mockSite } from './mockSite';

export class MockSiteSource extends SiteSource {
  async getSite() {
    return mockSite;
  }
}
