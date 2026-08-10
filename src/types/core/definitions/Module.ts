import type { ModuleProps, RuntimeModuleComponent } from '../components/Module';

import type { ModuleSchema } from './ModuleSchema';

export interface Module<TProps extends ModuleProps = ModuleProps> {
  alias: string;
  name: string;
  component: RuntimeModuleComponent;
  schema?: ModuleSchema<TProps>;
}
