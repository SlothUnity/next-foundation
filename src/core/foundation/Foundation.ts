import { createProviders } from '@/provider/createProviders';

import { createFoundation } from './createFoundation';

const providers = createProviders();

export const foundation = createFoundation({
  page: providers.page,
  site: providers.site,
});
