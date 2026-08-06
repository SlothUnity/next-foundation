import type { PageDefinition } from '@/types';

import type { ModuleRegistry } from '@/core/registry';

import { renderModule } from './renderModule';

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
          <div key={`${module.alias}-${index}`}>
            {renderModule({
              module,
              registry,
            })}
          </div>
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
