import { cache } from 'react';

import { foundation } from '@/core/foundation/foundation';
import type { SiteDefinition } from '@/core/site';

export const resolveSite = cache(async (): Promise<SiteDefinition> => {
  return foundation.site.getSite();
});
