import type { ModuleRegistry } from '@/core/registry';
import type { PageSource } from '@/core/pages/PageSource';

export interface Foundation {
  modules: ModuleRegistry;
  page: PageSource;
}
