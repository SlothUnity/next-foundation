import type { Foundation } from '@/core/foundation';
import { ModuleRenderError, ModuleValidationError } from '@/core/errors';

import type { ModuleInstance } from '@/types';

import { ModuleErrorFallback } from './ModuleErrorFallback';

interface ModuleRendererProps {
  module: ModuleInstance;
  foundation: Foundation;
}

export function ModuleRenderer({ module, foundation }: ModuleRendererProps) {
  const definition = foundation.modules.getByAlias(module.alias);

  if (!definition) {
    if (process.env.NODE_ENV === 'development') {
      throw new ModuleRenderError(`Module "${module.alias}" is not registered.`);
    }

    return <ModuleErrorFallback alias={module.alias} />;
  }

  let data = module.data;

  if (definition.schema) {
    try {
      data = definition.schema.parse(module.data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        throw new ModuleValidationError(`Module "${module.alias}" data validation failed.`, {
          cause: error,
        });
      }

      return <ModuleErrorFallback alias={module.alias} />;
    }
  }

  const Component = definition.component;

  return <Component {...data} />;
}
