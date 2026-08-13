import { describe, expect, it, vi } from 'vitest';

import type { Payload } from 'payload';

import { resolvePayloadPage } from './resolvePayloadPage';

const PAGE = { id: 1, title: 'Sobre nós' };

function createPayload(docs: unknown[] = [PAGE]) {
  const find = vi.fn().mockResolvedValue({ docs });

  return { payload: { find } as unknown as Payload, find };
}

function argsOf(find: ReturnType<typeof vi.fn>) {
  return find.mock.calls[0][0];
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
