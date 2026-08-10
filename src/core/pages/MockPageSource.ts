import type { PageDefinition } from '@/types';

import homePage from '@/mocks/pages/home';

import { PageSource } from './PageSource';

export class MockPageSource extends PageSource {
  async getPage(slug: string, locale?: string): Promise<PageDefinition | undefined> {
    void locale;

    const pages: Record<string, PageDefinition> = {
      '/': homePage,
    };

    return pages[slug];
  }
}
