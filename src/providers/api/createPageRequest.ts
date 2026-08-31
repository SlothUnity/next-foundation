import type { ApiRequest } from './Api.types';

export interface PageRequestContext {
  path: string;
  locale: string;
  draft?: boolean;
}

export function createPageRequest({ path }: PageRequestContext): ApiRequest {
  return {
    endpoint: `/${path}`,
  };
}
