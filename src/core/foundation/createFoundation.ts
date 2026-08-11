import { ModuleRegistry } from '@/core/registry';
import { registerModules } from '@/core/setup';

import type { Foundation } from '@/types';
import { createPageSource } from '../pages/createPageSource';

export function createFoundation(): Foundation {
  const foundation: Foundation = {
    modules: new ModuleRegistry(),
    page: createPageSource(),
  };

  registerModules(foundation);

  return foundation;
}
