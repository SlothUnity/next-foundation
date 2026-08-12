import { SiteSource } from '@/core/site/SiteSource';

import { mockSite } from './siteSettings';

export class MockSiteSource extends SiteSource {
  async getSite() {
    return mockSite;
  }
}
