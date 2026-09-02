import type { PageResponse } from '@/core/pages';

import type { GetPageOptions } from '@/core/pages/PageSource';
import { PageSource } from '@/core/pages/PageSource';

import type { ApiClient } from '../ApiClient';
import { createApiClient } from '../createApiClient';
import { createPageRequest } from '../createPageRequest';
import { mapApiPage } from '../mappers/mapApiPage';
import { ApiSiteSource } from './ApiSiteSource';

export class ApiPageSource extends PageSource {
  private readonly site = new ApiSiteSource();

  constructor(private readonly client?: ApiClient) {
    super();
  }

  async getPage(path: string, locale?: string, options?: GetPageOptions): Promise<PageResponse> {
    const resolvedLocale = locale ?? (await this.site.getSite()).defaultLocale;

    const request = createPageRequest({ path, locale: resolvedLocale, draft: options?.draft });

    const client = this.client ?? createApiClient();

    const raw = await client.get(request.endpoint, {
      params: request.params,
      headers: request.headers,
      draft: options?.draft,
      tags: ['pages', `page:${request.endpoint}`],
    });

    if (raw === undefined || raw === null) {
      return { status: 'notFound' };
    }

    return { status: 'ok', page: mapApiPage(raw) };
  }
}
