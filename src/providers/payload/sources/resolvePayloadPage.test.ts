import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import type { Payload, Where } from 'payload';

import { callArg } from '@/testing/callArg';

import { resolvePayloadNotFoundPage, resolvePayloadPage } from './resolvePayloadPage';

const PAGE = { id: 1, title: 'Sobre nós' };

function createPayload(docs: unknown[] = [PAGE]) {
  const find = vi.fn().mockResolvedValue({ docs });

  return { payload: { find } as unknown as Payload, find };
}

/** A forma que estes testes assumem da consulta — declarada, não presumida. */
interface PageQuery {
  where: Where;
  draft: boolean;
  collection: string;
  locale: string;
}

function argsOf(find: Mock): PageQuery {
  return callArg<PageQuery>(find);
}

describe('resolvePayloadPage', () => {
  it('looks the homepage up by isHome when the path is empty', async () => {
    const { payload, find } = createPayload();

    await resolvePayloadPage(payload, '', 'pt-PT');

    expect(argsOf(find).where).toMatchObject({
      and: [{ isHome: { equals: true } }, { _status: { equals: 'published' } }],
    });
  });

  it('looks a page up by its breadcrumb url, with a leading slash', async () => {
    const { payload, find } = createPayload();

    await resolvePayloadPage(payload, 'sobre-nos', 'pt-PT');

    expect(argsOf(find).where).toMatchObject({
      and: [{ 'breadcrumbs.url': { equals: '/sobre-nos' } }, { _status: { equals: 'published' } }],
    });
  });

  it('keeps unpublished pages off the public site', async () => {
    const { payload, find } = createPayload();

    await resolvePayloadPage(payload, 'sobre-nos', 'pt-PT', false);

    // Com overrideAccess: true o Payload não filtra nada por si. Este _status é
    // a única coisa que impede um rascunho de aparecer a um visitante anónimo.
    expect(JSON.stringify(argsOf(find).where)).toContain('published');
  });

  it('drops the published filter in draft mode, so editors see their work', async () => {
    const { payload, find } = createPayload();

    await resolvePayloadPage(payload, 'sobre-nos', 'pt-PT', true);

    expect(argsOf(find).where).toEqual({ 'breadcrumbs.url': { equals: '/sobre-nos' } });
    expect(JSON.stringify(argsOf(find).where)).not.toContain('published');
  });

  it('asks for one page, without falling back to another locale', async () => {
    const { payload, find } = createPayload();

    await resolvePayloadPage(payload, 'sobre-nos', 'en-GB');

    expect(argsOf(find)).toMatchObject({
      collection: 'pages',
      locale: 'en-GB',
      fallbackLocale: false,
      overrideAccess: true,
      limit: 1,
      depth: 2,
    });
  });

  it('forwards the draft flag to Payload', async () => {
    const { payload, find } = createPayload();

    await resolvePayloadPage(payload, 'sobre-nos', 'pt-PT', true);

    expect(argsOf(find).draft).toBe(true);
  });

  it('defaults to a published read when no draft flag is given', async () => {
    const { payload, find } = createPayload();

    await resolvePayloadPage(payload, 'sobre-nos', 'pt-PT');

    expect(argsOf(find).draft).toBe(false);
  });

  it('returns the first document found', async () => {
    const { payload } = createPayload();

    await expect(resolvePayloadPage(payload, 'sobre-nos', 'pt-PT')).resolves.toBe(PAGE);
  });

  it('returns undefined when there is no such page', async () => {
    const { payload } = createPayload([]);

    await expect(resolvePayloadPage(payload, 'nao-existe', 'pt-PT')).resolves.toBeUndefined();
  });
});

describe('resolvePayloadNotFoundPage', () => {
  it('looks the error page up by the is404 flag', async () => {
    const { payload, find } = createPayload();

    await resolvePayloadNotFoundPage(payload, 'pt-PT');

    expect(argsOf(find).where).toMatchObject({
      and: [{ is404: { equals: true } }, { _status: { equals: 'published' } }],
    });
  });

  it('keeps an unpublished error page off the public site', async () => {
    const { payload, find } = createPayload();

    await resolvePayloadNotFoundPage(payload, 'pt-PT');

    // Um 404 em rascunho é pior do que nenhum: aparecia a toda a gente sem ninguém
    // o ter publicado.
    expect(JSON.stringify(argsOf(find).where)).toContain('published');
  });

  it('shows the draft error page in preview', async () => {
    const { payload, find } = createPayload();

    await resolvePayloadNotFoundPage(payload, 'pt-PT', true);

    expect(argsOf(find).where).toEqual({ is404: { equals: true } });
    expect(argsOf(find).draft).toBe(true);
  });

  it('reads it in the requested locale, without falling back', async () => {
    const { payload, find } = createPayload();

    await resolvePayloadNotFoundPage(payload, 'en-GB');

    expect(argsOf(find)).toMatchObject({
      collection: 'pages',
      locale: 'en-GB',
      fallbackLocale: false,
      limit: 1,
    });
  });

  it('returns undefined when nobody marked a page as the error page', async () => {
    const { payload } = createPayload([]);

    // Estado legítimo, não erro: um site acabado de instalar ainda não a tem, e a
    // aplicação desenha o fallback mínimo.
    await expect(resolvePayloadNotFoundPage(payload, 'pt-PT')).resolves.toBeUndefined();
  });
});
