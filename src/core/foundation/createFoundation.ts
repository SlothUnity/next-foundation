import { ModuleRegistry } from '@/core/registry';
import { registerModules } from '@/core/setup';

import { createProviders } from '@/provider/createProviders';

import type { Foundation } from '@/types';

export function createFoundation(): Foundation {
  const providers = createProviders();

  const foundation: Foundation = {
    modules: new ModuleRegistry(),
    page: providers.page,
    site: providers.site,
  };

  registerModules(foundation);

  return foundation;
}
