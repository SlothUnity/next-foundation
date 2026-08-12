import type { PageSource } from '@/core/pages/PageSource';
import type { SiteSource } from '@/core/site/SiteSource';

import { MockPageSource, MockSiteSource } from './mocks';
import { PayloadPageSource } from './payload/PayloadPageSource';
import { PayloadSiteSource } from './payload/PayloadSiteSource';

interface Providers {
  page: PageSource;
  site: SiteSource;
}

export function createProviders(): Providers {
  const provider = process.env.PROVIDER ?? 'payload';

  switch (provider) {
    case 'mock':
      return {
        page: new MockPageSource(),
        site: new MockSiteSource(),
      };

    case 'payload':
      return {
        page: new PayloadPageSource(),
        site: new PayloadSiteSource(),
      };

    default:
      throw new Error(`Unsupported PROVIDER "${provider}".`);
  }
}
