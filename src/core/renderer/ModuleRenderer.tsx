import { ModuleRenderError, ModuleValidationError } from '@/core/errors';

import type { Foundation } from '@/core/foundation';
import type { ModuleInstance } from '@/core/modules';

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

  if (!definition.schema && process.env.NODE_ENV === 'development') {
    // Sem schema não há validação nenhuma, e o cast `props as TProps` do
    // createModuleComponent passa a ser uma afirmação sem nada por trás.
    console.warn(
      `Module "${module.alias}" has no schema: its data reaches the component unvalidated.`,
    );
  }

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
