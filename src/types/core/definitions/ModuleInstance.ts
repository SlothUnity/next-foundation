import type { ModuleProps } from '../components/Module';

export interface ModuleInstance<TData extends ModuleProps = ModuleProps> {
  id: string;
  alias: string;
  data: TData;
}
