import type { PageDefinition } from '@/core/pages';

import { PageSource } from '@/core/pages/PageSource';

import { mockSite } from '../mockSite';
import { mockPages } from '../pages';

export class MockPageSource extends PageSource {
  async getPage(path: string, locale?: string): Promise<PageDefinition | undefined> {
    const resolvedLocale = locale ?? mockSite.defaultLocale;

    const match = mockPages.find(
      (mockPage) => mockPage.path === path && mockPage.locale === resolvedLocale,
    );

    return match?.page;
  }
}
