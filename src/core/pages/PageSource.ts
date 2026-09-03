import type { PagePath, PageQuery, PageResponse } from './Page.types';

export interface GetPageOptions {
  draft?: boolean;
  query?: PageQuery;
}

export abstract class PageSource {
  abstract getPage(path: string, locale?: string, options?: GetPageOptions): Promise<PageResponse>;

  listPaths?(): Promise<PagePath[]>;
}
