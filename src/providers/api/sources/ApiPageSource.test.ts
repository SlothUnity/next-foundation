import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import { callArg } from '@/testing/callArg';

import type { ApiClient } from '../client/ApiClient';

import { ApiPageSource } from './ApiPageSource';

const ANY_BODY = { anything: true };

function createSource(body: unknown) {
  const get = vi.fn().mockResolvedValue(body);
  const source = new ApiPageSource({ get } as unknown as ApiClient);

  return { source, get };
}

function endpointOf(get: Mock): string {
  return String(callArg(get));
}

function optionsOf(get: Mock) {
  return callArg(get, 1);
}

describe('ApiPageSource', () => {
  it('asks the api for the path it was given', async () => {
    const { source, get } = createSource(ANY_BODY);

    await source.getPage('sobre-nos', 'pt-PT').catch(() => undefined);

    expect(endpointOf(get)).toBe('/sobre-nos');
  });

  it('forwards a locale segment as part of the path', async () => {
    const { source, get } = createSource(ANY_BODY);

    await source.getPage('en/about-us', 'pt-PT').catch(() => undefined);

    expect(endpointOf(get)).toBe('/en/about-us');
  });

  it('asks for the root on the homepage', async () => {
    const { source, get } = createSource(ANY_BODY);

    await source.getPage('', 'pt-PT').catch(() => undefined);

    expect(endpointOf(get)).toBe('/');
  });

  it('tags the request with the endpoint, for selective revalidation', async () => {
    const { source, get } = createSource(ANY_BODY);

    await source.getPage('sobre-nos', 'pt-PT').catch(() => undefined);

    expect(optionsOf(get)).toMatchObject({
      tags: ['pages', 'page:/sobre-nos'],
    });
  });

  it('passes the draft flag through to the client', async () => {
    const { source, get } = createSource(ANY_BODY);

    await source.getPage('sobre-nos', 'pt-PT', { draft: true }).catch(() => undefined);

    expect(optionsOf(get)).toMatchObject({ draft: true });
  });

  it('answers notFound when the api has no page', async () => {
    const { source } = createSource(undefined);

    await expect(source.getPage('nao-existe', 'pt-PT')).resolves.toEqual({ status: 'notFound' });
  });

  it('answers notFound when the api returns an empty body', async () => {
    const { source } = createSource(null);

    await expect(source.getPage('nao-existe', 'pt-PT')).resolves.toEqual({ status: 'notFound' });
  });

  it('hands the body to the mapper untouched', async () => {
    const { source } = createSource({ metadata: {}, sections: [] });

    await expect(source.getPage('sobre-nos', 'pt-PT')).rejects.toThrow(/metadata, sections/);
  });
});

describe('ApiPageSource, when asked to list its paths', () => {
  it('asks one endpoint for every locale the site declares', async () => {
    const { source, get } = createSource([{ path: '/' }]);

    await source.listPaths().catch(() => undefined);

    expect(endpointOf(get)).toBe('/paths');
    expect(optionsOf(get)).toMatchObject({ params: { locales: 'pt-PT' } });
  });

  it('tags the response so a revalidation route can reach it', async () => {
    const { source, get } = createSource([]);

    await source.listPaths().catch(() => undefined);

    expect(optionsOf(get)).toMatchObject({ tags: ['pages', 'paths'] });
  });

  it('hands the body to the mapper, which refuses to guess until someone writes it', async () => {
    const { source } = createSource([{ path: '/sobre-nos' }]);

    await expect(source.listPaths()).rejects.toThrow(/mapApiPaths\.ts/);
  });
});
