import type { PageDefinition } from '@/types';
import { PageSource } from './PageSource';
import homePage from '@/mocks/pages/home';

export class MockPageSource extends PageSource {
  async getPage(slug: string, locale?: string): Promise<PageDefinition> {
    void slug;
    void locale;
    return homePage;
  }
}
