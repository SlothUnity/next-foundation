import type { PageDefinition } from '@/core/pages';

import type { GetPageOptions } from '@/core/pages/PageSource';
import { PageSource } from '@/core/pages/PageSource';

import type { ApiClient } from '../ApiClient';
import { createApiClient } from '../createApiClient';
import { createPageRequest } from '../createPageRequest';
import { mapApiPage } from '../mappers/mapApiPage';

export class ApiPageSource extends PageSource {
  constructor(private readonly client?: ApiClient) {
    super();
  }

  async getPage(
    path: string,
    locale?: string,
    options?: GetPageOptions,
  ): Promise<PageDefinition | undefined> {
    void locale;

    const request = createPageRequest({ path, draft: options?.draft });

    const client = this.client ?? createApiClient();

    const raw = await client.get(request.endpoint, {
      params: request.params,
      headers: request.headers,
      draft: options?.draft,
      tags: ['pages', `page:${request.endpoint}`],
    });

    if (raw === undefined || raw === null) {
      return undefined;
    }

    return mapApiPage(raw);
  }
}
