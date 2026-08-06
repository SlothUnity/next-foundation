import type { PageDefinition } from '@/types';

import type { ModuleRegistry } from '@/core/registry';

import { renderModule } from './renderModule';
import { Fragment } from 'react/jsx-runtime';

interface PageRendererProps {
  page: PageDefinition;
  registry: ModuleRegistry;
}

export function PageRenderer({ page, registry }: PageRendererProps) {
  return (
    <>
      {page.navigation &&
        renderModule({
          module: page.navigation,
          registry,
        })}

      <main>
        {page.main.map((module, index) => (
          <Fragment key={`${module.alias}-${index}`}>
            {renderModule({
              module,
              registry,
            })}
          </Fragment>
        ))}
      </main>

      {page.footer &&
        renderModule({
          module: page.footer,
          registry,
        })}
    </>
  );
}
