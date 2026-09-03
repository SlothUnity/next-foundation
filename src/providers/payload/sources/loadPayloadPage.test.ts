import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findByID, findGlobal, getPayloadClient, resolvePayloadNotFoundPage, resolvePayloadPage } =
  vi.hoisted(() => {
    const findByID = vi.fn();
    const findGlobal = vi.fn();

    return {
      findByID,
      findGlobal,
      getPayloadClient: vi.fn().mockResolvedValue({ findByID, findGlobal }),
      resolvePayloadNotFoundPage: vi.fn(),
      resolvePayloadPage: vi.fn(),
    };
  });

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

    findGlobal.mockReset().mockResolvedValue({ modules: [] });

    findByID.mockReset().mockResolvedValue({
      breadcrumbs: {
        'pt-PT': [{ url: '/sobre-nos' }],
        'en-GB': [{ url: '/about-us' }],
      },
    });
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

    const client = { findByID, findGlobal };

    expect(resolvePayloadPage).toHaveBeenCalledWith(client, 'nao-existe', 'pt-PT', true);

    expect(resolvePayloadNotFoundPage).toHaveBeenCalledWith(client, 'pt-PT', true);
  });

  it('composes the authored layout into the page it answers with', async () => {
    resolvePayloadPage.mockResolvedValue(payloadPage('Sobre nós'));

    findGlobal.mockImplementation(async ({ slug }: { slug: string }) => ({
      modules: [{ id: `${slug}-1`, blockType: 'hero', blockName: null, title: slug }],
    }));

    const response = await loadPayloadPage('sobre-nos', 'pt-PT', false);

    expect(response).toMatchObject({
      status: 'ok',
      page: {
        navigation: [{ id: 'navigation-1', alias: 'hero' }],
        footer: [{ id: 'footer-1', alias: 'hero' }],
      },
    });
  });

  it('gives the CMS error page the same layout, so a 404 is not a bare page', async () => {
    resolvePayloadNotFoundPage.mockResolvedValue(payloadPage('Não encontrada'));

    findGlobal.mockResolvedValue({
      modules: [{ id: 'nav-1', blockType: 'hero', blockName: null, title: 'Menu' }],
    });

    const response = await loadPayloadPage('nao-existe', 'pt-PT', false);

    expect(response).toMatchObject({
      status: 'notFound',
      page: { navigation: [{ id: 'nav-1' }] },
    });
  });

  it('does not read the globals when there is no page at all to decorate', async () => {
    await loadPayloadPage('nao-existe', 'pt-PT', false);

    expect(findGlobal).not.toHaveBeenCalled();
  });

  it('resolves the alternate path of every locale the site serves', async () => {
    resolvePayloadPage.mockResolvedValue(payloadPage('Sobre nós'));

    const response = await loadPayloadPage(
      'sobre-nos',
      'pt-PT',
      false,
      ['pt-PT', 'en-GB'],
      'pt-PT',
    );

    expect(response).toMatchObject({
      page: {
        meta: {
          alternates: { 'pt-PT': '/sobre-nos', 'en-GB': '/en/about-us' },
        },
      },
    });
  });

  it('asks for no alternates when the caller passes no locales', async () => {
    resolvePayloadPage.mockResolvedValue(payloadPage('Sobre nós'));

    const response = await loadPayloadPage('sobre-nos', 'pt-PT', false);

    expect(response).toMatchObject({ page: { meta: { alternates: {} } } });
  });
});
