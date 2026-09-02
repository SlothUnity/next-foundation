import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPayloadClient, resolvePayloadNotFoundPage, resolvePayloadPage } = vi.hoisted(() => ({
  getPayloadClient: vi.fn().mockResolvedValue({}),
  resolvePayloadNotFoundPage: vi.fn(),
  resolvePayloadPage: vi.fn(),
}));

vi.mock('@/providers/payload/getPayloadClient', () => ({ getPayloadClient }));
vi.mock('@/providers/payload/sources/resolvePayloadPage', () => ({
  resolvePayloadNotFoundPage,
  resolvePayloadPage,
}));

import { loadPayloadPage } from './loadPayloadPage';

function payloadPage(title: string) {
  return { id: 1, meta: { title }, main: [] };
}

describe('loadPayloadPage', () => {
  beforeEach(() => {
    resolvePayloadPage.mockReset().mockResolvedValue(undefined);
    resolvePayloadNotFoundPage.mockReset().mockResolvedValue(undefined);
  });

  it('maps a page that exists into an ok response', async () => {
    resolvePayloadPage.mockResolvedValue(payloadPage('Sobre nós'));

    await expect(loadPayloadPage('sobre-nos', 'pt-PT', false)).resolves.toMatchObject({
      status: 'ok',
      page: { meta: { title: 'Sobre nós', locale: 'pt-PT' } },
    });
  });

  it('does not go looking for the error page when the path resolves', async () => {
    resolvePayloadPage.mockResolvedValue(payloadPage('Sobre nós'));

    await loadPayloadPage('sobre-nos', 'pt-PT', false);

    expect(resolvePayloadNotFoundPage).not.toHaveBeenCalled();
  });

  it('serves the CMS error page as the content of a notFound', async () => {
    resolvePayloadNotFoundPage.mockResolvedValue(payloadPage('Página não encontrada'));

    await expect(loadPayloadPage('nao-existe', 'pt-PT', false)).resolves.toMatchObject({
      status: 'notFound',
      page: { meta: { title: 'Página não encontrada' } },
    });
  });

  it('answers notFound without a page when nobody marked one', async () => {
    await expect(loadPayloadPage('nao-existe', 'pt-PT', false)).resolves.toEqual({
      status: 'notFound',
      page: undefined,
    });
  });

  it('carries the draft flag into both queries', async () => {
    await loadPayloadPage('nao-existe', 'pt-PT', true);

    expect(resolvePayloadPage).toHaveBeenCalledWith({}, 'nao-existe', 'pt-PT', true);
    expect(resolvePayloadNotFoundPage).toHaveBeenCalledWith({}, 'pt-PT', true);
  });
});
