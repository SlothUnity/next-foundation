import { Fragment } from 'react';

import type { Foundation } from '@/core/foundation';
import type { ModuleInstance } from '@/core/modules';
import type { PageDefinition } from '@/core/pages';

import { MAIN_LANDMARK_ID } from './landmarks';
import { ModuleRenderer } from './ModuleRenderer';

interface PageRendererProps {
  page: PageDefinition;
  foundation: Foundation;
}

function Region({ modules, foundation }: { modules: ModuleInstance[]; foundation: Foundation }) {
  return modules.map((module) => (
    <Fragment key={module.id}>
      <ModuleRenderer module={module} foundation={foundation} />
    </Fragment>
  ));
}

export function PageRenderer({ page, foundation }: PageRendererProps) {
  const navigation = page.navigation ?? [];
  const footer = page.footer ?? [];

  return (
    <>
      {navigation.length > 0 && (
        <nav>
          <Region modules={navigation} foundation={foundation} />
        </nav>
      )}

      <main id={MAIN_LANDMARK_ID}>
        <Region modules={page.main} foundation={foundation} />
      </main>

      {footer.length > 0 && (
        <footer>
          <Region modules={footer} foundation={foundation} />
        </footer>
      )}
    </>
  );
}
