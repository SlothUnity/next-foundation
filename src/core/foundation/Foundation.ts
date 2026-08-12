import { providers } from '@/provider/providers';

import { createFoundation } from './createFoundation';

export const foundation = createFoundation({
  page: providers.page,
  site: providers.site,
});
