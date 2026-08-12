import type { Provider } from '@/providers/Provider.types';

import { MockPageSource } from './MockPageSource';
import { MockSiteSource } from './MockSiteSource';

export const mockProvider: Provider = {
  page: new MockPageSource(),
  site: new MockSiteSource(),
};
