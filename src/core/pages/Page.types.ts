import type { ModuleInstance } from '@/core/modules';

export interface Meta {
  locale?: string;

  title?: string;
  description?: string;

  ogTitle?: string;
  ogDescription?: string;

  noIndex?: boolean;
  noFollow?: boolean;
}

export interface PageDefinition {
  meta: Meta;
  navigation?: ModuleInstance;
  main: ModuleInstance[];
  footer?: ModuleInstance;
}
