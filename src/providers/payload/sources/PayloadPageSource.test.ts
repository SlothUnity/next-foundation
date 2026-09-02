import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PayloadPageSource } from './PayloadPageSource';

const { getCachedPage, getCachedRedirects, getCachedSite, loadPayloadPage } = vi.hoisted(() => ({
  getCachedPage: vi.fn().mockResolvedValue(undefined),
  getCachedRedirects: vi.fn().mockResolvedValue({}),
  getCachedSite: vi.fn().mockResolvedValue({ name: 'Foundation', locales: [], defaultLocale: '' }),
  loadPayloadPage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/providers/payload/cache/getCachedPage', () => ({ getCachedPage }));
vi.mock('@/providers/payload/cache/getCachedRedirects', () => ({ getCachedRedirects }));
vi.mock('@/providers/payload/cache/getCachedSite', () => ({ getCachedSite }));
vi.mock('@/providers/payload/sources/loadPayloadPage', () => ({ loadPayloadPage }));

const source = new PayloadPageSource();

describe('PayloadPageSource', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getCachedPage.mockClear();
    loadPayloadPage.mockClear();
    getCachedSite.mockClear();
    getCachedRedirects.mockClear();
    getCachedRedirects.mockResolvedValue({});
    getCachedSite.mockResolvedValue({ name: 'Foundation', locales: [], defaultLocale: 'pt-PT' });
  });

  it('reads a public page through the cache', async () => {
    await source.getPage('sobre-nos', 'pt-PT');

    expect(getCachedPage).toHaveBeenCalledWith('sobre-nos', 'pt-PT');
    expect(loadPayloadPage).not.toHaveBeenCalled();
  });

  it('keeps a draft out of the cache', async () => {
    // O que o editor vê é a versão dele. Guardá-la arriscava servi-la a um visitante.
    await source.getPage('sobre-nos', 'pt-PT', { draft: true });

    expect(loadPayloadPage).toHaveBeenCalledWith('sobre-nos', 'pt-PT', true);
    expect(getCachedPage).not.toHaveBeenCalled();
  });

  it('asks the site for its default locale when none is given', async () => {
    await source.getPage('sobre-nos');

    expect(getCachedSite).toHaveBeenCalled();
    expect(getCachedPage).toHaveBeenCalledWith('sobre-nos', 'pt-PT');
  });

  it('gives up on a locale this provider does not know', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(source.getPage('sobre-nos', 'fr-FR')).resolves.toEqual({ status: 'notFound' });

    expect(getCachedPage).not.toHaveBeenCalled();
  });

  it('answers a redirect before it looks for any page', async () => {
    getCachedRedirects.mockResolvedValue({ 'pagina-antiga': { to: '/', permanent: true } });

    await expect(source.getPage('pagina-antiga', 'pt-PT')).resolves.toEqual({
      status: 'redirect',
      to: '/',
      permanent: true,
    });

    // O redirect ganha à página: é o que permite substituir um URL sem apagar o
    // conteúdo que estava nele.
    expect(getCachedPage).not.toHaveBeenCalled();
  });

  it('reads the redirects of the locale being served, against the site default', async () => {
    await source.getPage('sobre-nos', 'en-GB');

    // O default entra na chave da cache de propósito: os destinos por referência
    // trazem o prefixo de idioma, e lido dentro do loader mudá-lo deixava entradas
    // com prefixos errados sem nada que as invalidasse.
    expect(getCachedRedirects).toHaveBeenCalledWith('en-GB', 'pt-PT');
  });

  it('does not let a redirect hijack a preview', async () => {
    getCachedRedirects.mockResolvedValue({ 'pagina-antiga': { to: '/', permanent: true } });

    // O editor pediu este documento. Um redirect a apanhar o caminho dele partia a
    // pré-visualização da própria página que ele está a escrever.
    await source.getPage('pagina-antiga', 'pt-PT', { draft: true });

    expect(loadPayloadPage).toHaveBeenCalledWith('pagina-antiga', 'pt-PT', true);
    expect(getCachedRedirects).not.toHaveBeenCalled();
  });

  it('says out loud that the locale is a configuration divergence', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Um visitante não chega aqui — o resolveRoute só devolve locales que o global
    // declara. Sem o aviso, isto ficava indistinguível de uma página inexistente.
    await source.getPage('sobre-nos', 'fr-FR');

    expect(String(warn.mock.calls[0][0])).toContain('fr-FR');
  });
});
