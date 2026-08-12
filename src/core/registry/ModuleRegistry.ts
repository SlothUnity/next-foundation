import { Registry } from './Registry';

import type { Module, ModuleProps } from '@/core/modules';

export class ModuleRegistry extends Registry<string, Module> {
  register<TProps extends ModuleProps>(module: Module<TProps>): void {
    this.add(module.alias, module);
  }

  getByAlias(alias: string): Module | undefined {
    return this.get(alias);
  }
}
