import type { PageDefinition } from '@/types';

import { PageSource } from '@/core/pages/PageSource';

import homePage from '@/provider/mocks/pages/data/home';

export class MockPageSource extends PageSource {
  async getPage(path: string, locale?: string): Promise<PageDefinition | undefined> {
    void locale;

    const pages: Record<string, PageDefinition> = {
      '': homePage,
    };

    return pages[path];
  }
}
