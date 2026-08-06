import type { ModuleComponent } from '../components/Module';

export interface Module {
  alias: string;
  name: string;
  component: ModuleComponent;
}
