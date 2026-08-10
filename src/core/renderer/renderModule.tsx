import type { Foundation } from '@/core/foundation';
import type { ModuleInstance } from '@/types';

interface RenderModuleProps {
  module: ModuleInstance;
  foundation: Foundation;
}

export function renderModule({ module, foundation }: RenderModuleProps) {
  const definition = foundation.modules.getByAlias(module.alias);

  if (!definition) {
    throw new Error(`Module "${module.alias}" is not registered.`);
  }

  const Component = definition.component;

  return <Component {...module.data} />;
}
