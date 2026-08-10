import { Fragment } from 'react';

import type { PageDefinition, Foundation } from '@/types';

import { ModuleRenderer } from './ModuleRenderer';

interface PageRendererProps {
  page: PageDefinition;
  foundation: Foundation;
}

export function PageRenderer({ page, foundation }: PageRendererProps) {
  return (
    <>
      {page.navigation && <ModuleRenderer module={page.navigation} foundation={foundation} />}

      <main>
        {page.main.map((module) => (
          <Fragment key={module.id}>
            <ModuleRenderer module={module} foundation={foundation} />
          </Fragment>
        ))}
      </main>

      {page.footer && <ModuleRenderer module={page.footer} foundation={foundation} />}
    </>
  );
}
