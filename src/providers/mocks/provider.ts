import type { Provider } from '@/providers/Provider.types';

import { MockPageSource } from './sources/MockPageSource';
import { MockSiteSource } from './sources/MockSiteSource';

export const mockProvider: Provider = {
  page: new MockPageSource(),
  site: new MockSiteSource(),
};
