import type { PageResponse } from '@/core/pages';

import { PageSource } from '@/core/pages/PageSource';

import { mockSite } from '../mockSite';
import { mockNotFoundPages, mockPages, mockRedirects } from '../pages';

export class MockPageSource extends PageSource {
  /**
   * A ordem é a de qualquer CMS: primeiro o redirect, senão a página, senão o 404.
   *
   * O redirect vem antes da página de propósito. Se um caminho tiver as duas coisas,
   * ganha o redirect — é o que permite substituir uma página sem a apagar.
   */
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
}
