import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';

import type { Payload, Where } from 'payload';

import { callArg } from '@/testing/callArg';

import { resolvePayloadNotFoundPage, resolvePayloadPage } from './resolvePayloadPage';

const PAGE = { id: 1, title: 'Sobre nós' };

function crumbs(...urls: string[]) {
  return urls.map((url) => ({ url }));
}

function createPayload(docs: unknown[] = [PAGE], found: unknown = PAGE) {
  const find = vi.fn().mockResolvedValue({ docs });
  const findByID = vi.fn().mockResolvedValue(found);

  return { payload: { find, findByID } as unknown as Payload, find, findByID };
}

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

  it('reads the homepage in one query, with the content populated', async () => {
    const { payload, find, findByID } = createPayload();

    await resolvePayloadPage(payload, '', 'pt-PT');

    expect(argsOf(find)).toMatchObject({ limit: 1, depth: 2 });
    expect(findByID).not.toHaveBeenCalled();
  });

  it('looks a page up by its breadcrumb url, with a leading slash', async () => {
    const { payload, find } = createPayload([{ id: 1, breadcrumbs: crumbs('/sobre-nos') }]);

    await resolvePayloadPage(payload, 'sobre-nos', 'pt-PT');

    expect(argsOf(find).where).toMatchObject({
      and: [{ 'breadcrumbs.url': { equals: '/sobre-nos' } }, { _status: { equals: 'published' } }],
    });
  });

  it('keeps unpublished pages off the public site', async () => {
    const { payload, find } = createPayload([{ id: 1, breadcrumbs: crumbs('/sobre-nos') }]);

    await resolvePayloadPage(payload, 'sobre-nos', 'pt-PT', false);

    expect(JSON.stringify(argsOf(find).where)).toContain('published');
  });

  it('drops the published filter in draft mode, so editors see their work', async () => {
    const { payload, find } = createPayload([{ id: 1, breadcrumbs: crumbs('/sobre-nos') }]);

    await resolvePayloadPage(payload, 'sobre-nos', 'pt-PT', true);

    expect(argsOf(find).where).toEqual({ 'breadcrumbs.url': { equals: '/sobre-nos' } });
    expect(JSON.stringify(argsOf(find).where)).not.toContain('published');
  });

  it('asks the candidate query for breadcrumbs only, and for every match', async () => {
    const { payload, find } = createPayload([{ id: 1, breadcrumbs: crumbs('/sobre-nos') }]);

    await resolvePayloadPage(payload, 'sobre-nos', 'en-GB');

    expect(argsOf(find)).toMatchObject({
      collection: 'pages',
      locale: 'en-GB',
      fallbackLocale: false,
      overrideAccess: true,
      limit: 0,
      depth: 0,
      select: { breadcrumbs: true },
    });
  });

  it('reads the page it picked by id, with the content populated', async () => {
    const { payload, findByID } = createPayload([{ id: 7, breadcrumbs: crumbs('/sobre-nos') }]);

    await resolvePayloadPage(payload, 'sobre-nos', 'en-GB', true);

    expect(callArg(findByID)).toMatchObject({
      collection: 'pages',
      id: 7,
      locale: 'en-GB',
      fallbackLocale: false,
      draft: true,
      overrideAccess: true,
      depth: 2,
    });
  });

  it('forwards the draft flag to Payload', async () => {
    const { payload, find } = createPayload([{ id: 1, breadcrumbs: crumbs('/sobre-nos') }]);

    await resolvePayloadPage(payload, 'sobre-nos', 'pt-PT', true);

    expect(argsOf(find).draft).toBe(true);
  });

  it('defaults to a published read when no draft flag is given', async () => {
    const { payload, find } = createPayload([{ id: 1, breadcrumbs: crumbs('/sobre-nos') }]);

    await resolvePayloadPage(payload, 'sobre-nos', 'pt-PT');

    expect(argsOf(find).draft).toBe(false);
  });

  it('returns the page it read', async () => {
    const { payload } = createPayload([{ id: 1, breadcrumbs: crumbs('/sobre-nos') }], PAGE);

    await expect(resolvePayloadPage(payload, 'sobre-nos', 'pt-PT')).resolves.toBe(PAGE);
  });

  it('returns undefined when there is no such page', async () => {
    const { payload, findByID } = createPayload([]);

    await expect(resolvePayloadPage(payload, 'nao-existe', 'pt-PT')).resolves.toBeUndefined();
    expect(findByID).not.toHaveBeenCalled();
  });
});

describe('resolvePayloadPage against a page hierarchy', () => {
  const PARENT = { id: 1, breadcrumbs: crumbs('/servicos') };
  const CHILD = { id: 2, breadcrumbs: crumbs('/servicos', '/servicos/consultoria') };

  it('serves the parent, and not a descendant that carries the same crumb', async () => {
    const { payload, findByID } = createPayload([CHILD, PARENT]);

    await resolvePayloadPage(payload, 'servicos', 'pt-PT');

    expect(callArg<{ id: number }>(findByID).id).toBe(PARENT.id);
  });

  it('picks the parent even when the query answers with descendants first', async () => {
    const grandchild = { id: 3, breadcrumbs: crumbs('/servicos', '/servicos/a', '/servicos/a/b') };

    const { payload, findByID } = createPayload([grandchild, CHILD, PARENT]);

    await resolvePayloadPage(payload, 'servicos', 'pt-PT');

    expect(callArg<{ id: number }>(findByID).id).toBe(PARENT.id);
  });

  it('serves the child on the child url', async () => {
    const { payload, findByID } = createPayload([CHILD]);

    await resolvePayloadPage(payload, 'servicos/consultoria', 'pt-PT');

    expect(callArg<{ id: number }>(findByID).id).toBe(CHILD.id);
  });

  it('answers undefined when the url is only an ancestor crumb of other pages', async () => {
    const { payload, findByID } = createPayload([CHILD]);

    await expect(resolvePayloadPage(payload, 'servicos', 'pt-PT')).resolves.toBeUndefined();
    expect(findByID).not.toHaveBeenCalled();
  });

  it('treats a page with no breadcrumbs as no match, instead of guessing', async () => {
    const { payload, findByID } = createPayload([{ id: 9 }]);

    await expect(resolvePayloadPage(payload, 'servicos', 'pt-PT')).resolves.toBeUndefined();
    expect(findByID).not.toHaveBeenCalled();
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

    await expect(resolvePayloadNotFoundPage(payload, 'pt-PT')).resolves.toBeUndefined();
  });
});
