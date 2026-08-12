import type { Provider } from '@/providers/Provider.types';

import { ApiPageSource } from './sources/ApiPageSource';
import { ApiSiteSource } from './sources/ApiSiteSource';

export const apiProvider: Provider = {
  page: new ApiPageSource(),
  site: new ApiSiteSource(),
};
