import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import { callArg } from '@/testing/callArg';

import { ApiClient } from './ApiClient';
import { ApiRequestError } from './errors';

/** O `RequestInit` que este cliente monta, na forma que os testes lhe lêem. */
interface FetchInit {
  headers?: Record<string, string>;
  cache?: string;
  next?: { revalidate?: number; tags?: string[] };
}

function requestUrl(fetch: Mock): string {
  return String(callArg(fetch));
}

function requestInit(fetch: Mock): FetchInit {
  return callArg<FetchInit>(fetch, 1);
}

function createClient(token?: string) {
  return new ApiClient({
    url: 'https://cms.example.com/api/',
    token,
    revalidate: 60,
  });
}

function mockFetch(response: Response | Promise<never>) {
  const fetch = vi.fn().mockReturnValue(response);
  vi.stubGlobal('fetch', fetch);

  return fetch;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('ApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the parsed body', async () => {
    mockFetch(jsonResponse({ name: 'Next Foundation' }));

    const body = await createClient().get('/site');

    expect(body).toEqual({ name: 'Next Foundation' });
  });

  it('joins the base url with the endpoint without doubling the slash', async () => {
    const fetch = mockFetch(jsonResponse({}));

    await createClient().get('/site');

    expect(requestUrl(fetch)).toBe('https://cms.example.com/api/site');
  });

  it('appends the params and omits the undefined ones', async () => {
    const fetch = mockFetch(jsonResponse({}));

    await createClient().get('/pages', {
      params: { path: 'servicos', locale: 'pt-PT', draft: undefined },
    });

    const url = new URL(requestUrl(fetch));

    expect(url.searchParams.get('path')).toBe('servicos');
    expect(url.searchParams.get('locale')).toBe('pt-PT');
    expect(url.searchParams.has('draft')).toBe(false);
  });

  it('sends the token as a bearer header when configured', async () => {
    const fetch = mockFetch(jsonResponse({}));

    await createClient('s3cret').get('/site');

    expect(requestInit(fetch)).toMatchObject({
      headers: { Authorization: 'Bearer s3cret' },
    });
  });

  it('omits the authorization header when there is no token', async () => {
    const fetch = mockFetch(jsonResponse({}));

    await createClient().get('/site');

    expect(requestInit(fetch).headers).not.toHaveProperty('Authorization');
  });

  it('sends the headers the request asks for', async () => {
    const fetch = mockFetch(jsonResponse({}));

    await createClient().get('/sobre-nos', { headers: { 'X-Site': 'super-bock' } });

    expect(requestInit(fetch)).toMatchObject({
      headers: { 'X-Site': 'super-bock' },
    });
  });

  it('lets the request override a configured header', async () => {
    const fetch = mockFetch(jsonResponse({}));

    await createClient('s3cret').get('/sobre-nos', {
      headers: { Authorization: 'Basic other' },
    });

    expect(requestInit(fetch).headers?.Authorization).toBe('Basic other');
  });

  it('caches published requests with the configured revalidate and tags', async () => {
    const fetch = mockFetch(jsonResponse({}));

    await createClient().get('/pages', { tags: ['pages'] });

    expect(requestInit(fetch)).toMatchObject({
      next: { revalidate: 60, tags: ['pages'] },
    });
  });

  it('bypasses the cache for drafts', async () => {
    const fetch = mockFetch(jsonResponse({}));

    await createClient().get('/pages', { draft: true, tags: ['pages'] });

    const init = requestInit(fetch);

    expect(init.cache).toBe('no-store');
    expect(init.next).toBeUndefined();
  });

  it('returns undefined on 404', async () => {
    mockFetch(new Response(null, { status: 404 }));

    await expect(createClient().get('/pages')).resolves.toBeUndefined();
  });

  it('throws with the status on a non-ok response', async () => {
    mockFetch(new Response(null, { status: 500 }));

    await expect(createClient().get('/pages')).rejects.toThrow(ApiRequestError);
    await expect(createClient().get('/pages')).rejects.toMatchObject({ status: 500 });
  });

  it('throws when the body is not json', async () => {
    mockFetch(new Response('<html>nope</html>', { status: 200 }));

    await expect(createClient().get('/pages')).rejects.toThrow(/not JSON/);
  });

  it('wraps a network failure', async () => {
    mockFetch(Promise.reject(new Error('ECONNREFUSED')));

    await expect(createClient().get('/pages')).rejects.toThrow(ApiRequestError);
  });
});
