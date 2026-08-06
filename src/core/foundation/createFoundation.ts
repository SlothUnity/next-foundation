import { ModuleRegistry } from '@/core/registry';
import { registerModules } from '@/core/setup';

import type { Foundation } from './Foundation';

export function createFoundation(): Foundation {
  const foundation: Foundation = {
    modules: new ModuleRegistry(),
  };

  registerModules(foundation);

  return foundation;
}
