import { provider } from '@/providers/provider';

import { createFoundation } from './createFoundation';

export const foundation = createFoundation({
  page: provider.page,
  site: provider.site,
});
