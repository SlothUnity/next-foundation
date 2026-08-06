import type { ModuleRegistry } from '@/core/registry';
import type { ModuleInstance } from '@/types';

interface RenderModuleProps {
  module: ModuleInstance;
  registry: ModuleRegistry;
}

export function renderModule({ module, registry }: RenderModuleProps) {
  const definition = registry.getByAlias(module.alias);

  if (!definition) {
    throw new Error(`Module "${module.alias}" is not registered.`);
  }

  const Component = definition.component;

  return <Component {...module.data} />;
}
