import type { ModuleComponent } from '../components/Module';
import { ModuleSchema } from './ModuleSchema';

export interface Module {
  alias: string;
  name: string;
  component: ModuleComponent;
  schema?: ModuleSchema;
}
