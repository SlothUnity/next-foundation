import type { ApiConfig, ApiParamValue, ApiRequestOptions } from '../Api.types';

import { ApiRequestError } from '../errors';

type NextRequestInit = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

export class ApiClient {
  constructor(private readonly config: ApiConfig) {}

  async get(path: string, options: ApiRequestOptions = {}): Promise<unknown> {
    const url = this.createUrl(path, options.params);

    let response: Response;

    try {
      response = await fetch(url, this.createInit(options));
    } catch (cause) {
      throw new ApiRequestError(`Request to ${url} failed.`, { url, cause });
    }

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      throw new ApiRequestError(`${url} responded with ${response.status}.`, {
        url,
        status: response.status,
      });
    }

    try {
      return await response.json();
    } catch (cause) {
      throw new ApiRequestError(`${url} responded with a body that is not JSON.`, {
        url,
        status: response.status,
        cause,
      });
    }
  }

  private createUrl(path: string, params: Record<string, ApiParamValue> = {}): string {
    const base = `${this.config.url.replace(/\/$/, '')}/`;

    const url = new URL(path.replace(/^\//, ''), base);

    if (!url.href.startsWith(base)) {
      throw new ApiRequestError(`The path "${path}" escapes ${base}.`, { url: url.href });
    }

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }

  private createInit({ draft, tags, headers: requestHeaders }: ApiRequestOptions): NextRequestInit {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (this.config.token) {
      headers.Authorization = `Bearer ${this.config.token}`;
    }

    Object.assign(headers, requestHeaders);

    if (draft) {
      return {
        headers,
        cache: 'no-store',
      };
    }

    return {
      headers,
      next: {
        revalidate: this.config.revalidate,
        tags,
      },
    };
  }
}
