import { ModuleRegistry } from '@/core/registry';
import { registerModules } from '@/core/setup';

import type { PageSource } from '@/core/pages';
import type { SiteSource } from '@/core/site';
import type { Foundation } from './Foundation.types';

interface CreateFoundationOptions {
  page: PageSource;
  site: SiteSource;
}

export function createFoundation({ page, site }: CreateFoundationOptions): Foundation {
  const foundation: Foundation = {
    modules: new ModuleRegistry(),
    page,
    site,
  };

  registerModules(foundation);

  return foundation;
}
