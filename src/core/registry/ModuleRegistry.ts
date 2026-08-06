import { Registry } from './Registry';

import type { Module } from '@/types';

export class ModuleRegistry extends Registry<string, Module> {
  register(module: Module): void {
    this.add(module.alias, module);
  }

  getByAlias(alias: string): Module | undefined {
    return this.get(alias);
  }
}
