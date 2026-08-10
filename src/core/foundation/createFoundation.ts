import { ModuleRegistry } from '@/core/registry';
import { registerModules } from '@/core/setup';
import { MockPageSource } from '@/core/pages/MockPageSource';

import type { Foundation } from '@/types';

export function createFoundation(): Foundation {
  const foundation: Foundation = {
    modules: new ModuleRegistry(),
    page: new MockPageSource(),
  };

  registerModules(foundation);

  return foundation;
}
