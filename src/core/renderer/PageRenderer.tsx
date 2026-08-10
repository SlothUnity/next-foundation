import { Fragment } from 'react';

import type { Foundation } from '@/core/foundation';
import type { PageDefinition } from '@/types';

import { renderModule } from './renderModule';

interface PageRendererProps {
  page: PageDefinition;
  foundation: Foundation;
}

export function PageRenderer({ page, foundation }: PageRendererProps) {
  return (
    <>
      {page.navigation &&
        renderModule({
          module: page.navigation,
          foundation,
        })}

      <main>
        {page.main.map((module) => (
          <Fragment key={module.id}>
            {renderModule({
              module,
              foundation,
            })}
          </Fragment>
        ))}
      </main>

      {page.footer &&
        renderModule({
          module: page.footer,
          foundation,
        })}
    </>
  );
}
