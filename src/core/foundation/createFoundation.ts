import { ModuleRegistry } from '@/core/registry';
import { registerModules } from '@/core/setup';
import { createPageSource } from '@/core/pages/createPageSource';
import { createSiteSource } from '@/core/site/createSiteSource';

import type { Foundation } from '@/types';

export function createFoundation(): Foundation {
  const foundation: Foundation = {
    modules: new ModuleRegistry(),
    page: createPageSource(),
    site: createSiteSource(),
  };

  registerModules(foundation);

  return foundation;
}
