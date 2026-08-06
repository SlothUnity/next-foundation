import type { Meta } from './Meta';
import type { ModuleInstance } from './ModuleInstance';

export interface PageDefinition {
  meta: Meta;
  navigation?: ModuleInstance;
  main: ModuleInstance[];
  footer?: ModuleInstance;
}
