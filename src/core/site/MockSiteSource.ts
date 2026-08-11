import type { SiteDefinition } from '@/types';

import { SiteSource } from './SiteSource';

export class MockSiteSource extends SiteSource {
  async getSite(): Promise<SiteDefinition> {
    return {
      name: 'Next Foundation',
      locales: ['pt-PT', 'en-GB'],
    };
  }
}
