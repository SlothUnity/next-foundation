import { describe, expect, it, vi } from 'vitest';

import type { ApiClient } from '../ApiClient';

import { ApiPageSource } from './ApiPageSource';

const ANY_BODY = { anything: true };

function createSource(body: unknown) {
  const get = vi.fn().mockResolvedValue(body);
  const source = new ApiPageSource({ get } as unknown as ApiClient);

  return { source, get };
}

function endpointOf(get: ReturnType<typeof vi.fn>): string {
  return String(get.mock.calls[0][0]);
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

    expect(get.mock.calls[0][1]).toMatchObject({
      tags: ['pages', 'page:/sobre-nos'],
    });
  });

  it('passes the draft flag through to the client', async () => {
    const { source, get } = createSource(ANY_BODY);

    await source.getPage('sobre-nos', 'pt-PT', { draft: true }).catch(() => undefined);

    expect(get.mock.calls[0][1]).toMatchObject({ draft: true });
  });

  it('answers notFound when the api has no page', async () => {
    const { source } = createSource(undefined);

    // Sem página de erro: onde vive a dela é uma característica da API que se ligar.
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
