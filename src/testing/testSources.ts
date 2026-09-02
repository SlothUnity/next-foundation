import { PageSource } from '@/core/pages';
import type { PageResponse } from '@/core/pages';
import { SiteSource } from '@/core/site';
import type { SiteDefinition } from '@/core/site';

export class TestPageSource extends PageSource {
  async getPage(): Promise<PageResponse> {
    return { status: 'notFound' };
  }
}

export class TestSiteSource extends SiteSource {
  async getSite(): Promise<SiteDefinition> {
    return {
      name: 'Test Site',
      locales: ['pt-PT'],
      defaultLocale: 'pt-PT',
    };
  }
}
