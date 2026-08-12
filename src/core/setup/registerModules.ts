import * as modules from '@/modules';

import type { Foundation } from '@/core/foundation';

export function registerModules(foundation: Foundation): void {
  Object.values(modules).forEach((module) => {
    foundation.modules.register(module);
  });
}
