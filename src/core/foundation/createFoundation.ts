import type { ErrorReporter } from '@/core/observability';
import { logModuleError } from '@/core/observability';
import { ModuleRegistry } from '@/core/registry';
import { registerModules } from '@/core/setup';

import type { PageSource } from '@/core/pages';
import type { SiteSource } from '@/core/site';
import type { Foundation } from './Foundation.types';

interface CreateFoundationOptions {
  page: PageSource;
  site: SiteSource;
  reportError?: ErrorReporter;
}

export function createFoundation({
  page,
  site,
  reportError = logModuleError,
}: CreateFoundationOptions): Foundation {
  const foundation: Foundation = {
    modules: new ModuleRegistry(),
    page,
    site,
    reportError,
  };

  registerModules(foundation);

  return foundation;
}
