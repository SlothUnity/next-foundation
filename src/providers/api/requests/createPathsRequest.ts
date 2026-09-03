import type { ApiRequest } from '../Api.types';

export interface PathsRequestContext {
  locales: string[];
  defaultLocale: string;
}

export function createPathsRequest({ locales }: PathsRequestContext): ApiRequest {
  return {
    endpoint: '/paths',
    params: { locales: locales.join(',') },
  };
}
