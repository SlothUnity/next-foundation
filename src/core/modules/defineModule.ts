import type { Module, ModuleProps } from './Module.types';

export function defineModule<TProps extends ModuleProps>(module: Module<TProps>): Module<TProps> {
  return module;
}
