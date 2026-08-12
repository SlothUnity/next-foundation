import type { Provider } from '@/provider/types';

import { MockPageSource } from './pages';
import { MockSiteSource } from './site';

export const mockProvider: Provider = {
  page: new MockPageSource(),
  site: new MockSiteSource(),
};
