import { Fragment } from 'react';

import type { Foundation } from '@/core/foundation';
import type { PageDefinition } from '@/core/pages';

import { MAIN_LANDMARK_ID } from './landmarks';
import { ModuleRenderer } from './ModuleRenderer';

interface PageRendererProps {
  page: PageDefinition;
  foundation: Foundation;
}

export function PageRenderer({ page, foundation }: PageRendererProps) {
  return (
    <>
      {page.navigation && (
        <nav>
          <ModuleRenderer module={page.navigation} foundation={foundation} />
        </nav>
      )}

      <main id={MAIN_LANDMARK_ID}>
        {page.main.map((module) => (
          <Fragment key={module.id}>
            <ModuleRenderer module={module} foundation={foundation} />
          </Fragment>
        ))}
      </main>

      {page.footer && (
        <footer>
          <ModuleRenderer module={page.footer} foundation={foundation} />
        </footer>
      )}
    </>
  );
}
