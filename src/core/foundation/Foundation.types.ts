import type { ModuleRegistry } from '@/core/registry';
import type { PageSource } from '@/core/pages/PageSource';
import type { SiteSource } from '@/core/site';

export interface Foundation {
  modules: ModuleRegistry;
  page: PageSource;
  site: SiteSource;
}
