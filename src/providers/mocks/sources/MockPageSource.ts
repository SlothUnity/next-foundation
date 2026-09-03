import type { PagePath, PageResponse } from '@/core/pages';

import { PageSource } from '@/core/pages/PageSource';
import { createPagePath } from '@/core/routing';

import { mockSite } from '../mockSite';
import { mockNotFoundPages, mockPages, mockRedirects } from '../pages';

export class MockPageSource extends PageSource {
  async getPage(path: string, locale?: string): Promise<PageResponse> {
    const resolvedLocale = locale ?? mockSite.defaultLocale;

    const redirect = mockRedirects.find(
      (entry) => entry.path === path && entry.locale === resolvedLocale,
    );

    if (redirect) {
      return { status: 'redirect', to: redirect.to, permanent: redirect.permanent };
    }

    const match = mockPages.find(
      (mockPage) => mockPage.path === path && mockPage.locale === resolvedLocale,
    );

    if (match) {
      return { status: 'ok', page: match.page };
    }

    const notFound = mockNotFoundPages.find((mockPage) => mockPage.locale === resolvedLocale);

    return { status: 'notFound', page: notFound?.page };
  }

  async listPaths(): Promise<PagePath[]> {
    return mockPages.map((mockPage) => ({
      path: createPagePath({
        path: mockPage.path,
        locale: mockPage.locale,
        defaultLocale: mockSite.defaultLocale,
      }),

      locale: mockPage.locale,
      noIndex: mockPage.page.meta.noIndex ?? false,
    }));
  }
}
