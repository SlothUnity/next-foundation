import type { PageResponse } from './Page.types';

export interface GetPageOptions {
  draft?: boolean;
}

export abstract class PageSource {
  abstract getPage(path: string, locale?: string, options?: GetPageOptions): Promise<PageResponse>;
}
