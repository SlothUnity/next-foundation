import type { PageDefinition } from '@/core/pages';

import { PageSource } from '@/core/pages/PageSource';

import { mockHomePage } from './mockHomePage';

export class MockPageSource extends PageSource {
  async getPage(path: string, locale?: string): Promise<PageDefinition | undefined> {
    void locale;

    const pages: Record<string, PageDefinition> = {
      '': mockHomePage,
    };

    return pages[path];
  }
}
