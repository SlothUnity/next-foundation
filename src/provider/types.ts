import type { ComponentType } from 'react';

import type { PageSource } from '@/core/pages/PageSource';
import type { SiteSource } from '@/core/site/SiteSource';

export interface Provider {
  page: PageSource;
  site: SiteSource;
  preview?: ComponentType;
}
