import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPayloadClient, find } = vi.hoisted(() => {
  const find = vi.fn();

  return { getPayloadClient: vi.fn().mockResolvedValue({ find }), find };
});

vi.mock('@/providers/payload/getPayloadClient', () => ({ getPayloadClient }));

import { callArg } from '@/testing/callArg';

import { loadPayloadRedirects, normalizeRedirectPath } from './loadPayloadRedirects';

function queryOf(callIndex: number) {
  return callArg<{ depth?: number; where?: unknown; select?: unknown }>(find, 0, callIndex);
}

function withDocs(redirects: unknown[], pages: unknown[] = [], totalDocs = redirects.length) {
  find.mockReset();
  find.mockResolvedValueOnce({ docs: redirects, totalDocs });
  find.mockResolvedValue({ docs: pages, totalDocs: pages.length });
}

function page(id: number, url: string) {
  return { id, breadcrumbs: [{ url }] };
}

describe('normalizeRedirectPath', () => {
  it('strips the slashes the editor writes and the provider does not send', () => {
    expect(normalizeRedirectPath('/pagina-antiga')).toBe('pagina-antiga');
    expect(normalizeRedirectPath('/pagina-antiga/')).toBe('pagina-antiga');
    expect(normalizeRedirectPath('  /a/b  ')).toBe('a/b');
  });

  it('turns the root into the empty path, which is how the homepage arrives', () => {
    expect(normalizeRedirectPath('/')).toBe('');
  });
});

describe('loadPayloadRedirects', () => {
  beforeEach(() => {
    find.mockReset();
    vi.restoreAllMocks();
  });

  it('reads the whole table in one query, in the requested locale', async () => {
    withDocs([]);

    await loadPayloadRedirects('en-GB', 'pt-PT');

    expect(queryOf(0)).toMatchObject({
      collection: 'redirects',
      locale: 'en-GB',
      fallbackLocale: false,
      overrideAccess: true,
      depth: 0,
    });
  });

  it('does not drag the target pages in with the redirects', async () => {
    withDocs([{ from: '/a', type: 'reference', reference: 7 }], [page(7, '/sobre-nos')]);

    await loadPayloadRedirects('pt-PT', 'pt-PT');

    expect(queryOf(0).depth).toBe(0);
  });

  it('resolves every referenced page in a single second query', async () => {
    withDocs(
      [
        { from: '/a', type: 'reference', reference: 7 },
        { from: '/b', type: 'reference', reference: 9 },
      ],
      [page(7, '/sobre-nos'), page(9, '/contactos')],
    );

    await loadPayloadRedirects('pt-PT', 'pt-PT');

    expect(find).toHaveBeenCalledTimes(2);
    expect(queryOf(1)).toMatchObject({
      collection: 'pages',
      depth: 0,
      select: { breadcrumbs: true },
    });
    expect(JSON.stringify(queryOf(1).where)).toContain('[7,9]');
  });

  it('skips the second query when nothing points at a page', async () => {
    withDocs([{ from: '/a', type: 'custom', custom: '/b' }]);

    await loadPayloadRedirects('pt-PT', 'pt-PT');

    expect(find).toHaveBeenCalledTimes(1);
  });

  it('derives the destination from the page breadcrumb', async () => {
    withDocs(
      [{ from: '/pagina-antiga', type: 'reference', reference: 7 }],
      [page(7, '/sobre-nos')],
    );

    await expect(loadPayloadRedirects('pt-PT', 'pt-PT')).resolves.toEqual({
      'pagina-antiga': { to: '/sobre-nos', permanent: false },
    });
  });

  it('prefixes the destination in a language that is not the default', async () => {
    withDocs([{ from: '/old-page', type: 'reference', reference: 7 }], [page(7, '/about-us')]);

    await expect(loadPayloadRedirects('en-GB', 'pt-PT')).resolves.toEqual({
      'old-page': { to: '/en/about-us', permanent: false },
    });
  });

  it('sends a redirect to the homepage to the right root per language', async () => {
    withDocs([{ from: '/old-home', type: 'reference', reference: 1 }], [page(1, '/')]);

    await expect(loadPayloadRedirects('en-GB', 'pt-PT')).resolves.toEqual({
      'old-home': { to: '/en', permanent: false },
    });
  });

  it('asks only for published target pages', async () => {
    withDocs([{ from: '/a', type: 'reference', reference: 7 }], [page(7, '/b')]);

    await loadPayloadRedirects('pt-PT', 'pt-PT');

    expect(JSON.stringify(queryOf(1).where)).toContain('published');
  });

  it('drops a redirect whose target is unpublished, and says why', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    withDocs([{ from: '/a', type: 'reference', reference: 7 }], []);

    await expect(loadPayloadRedirects('pt-PT', 'pt-PT')).resolves.toEqual({});

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('/a'));
  });

  it('keeps the custom path verbatim', async () => {
    withDocs([{ from: '/a', type: 'custom', custom: '/en/anything', permanent: true }]);

    await expect(loadPayloadRedirects('pt-PT', 'pt-PT')).resolves.toEqual({
      a: { to: '/en/anything', permanent: true },
    });
  });

  it('skips a locale that has no translation for the redirect', async () => {
    withDocs([{ from: null, type: 'custom', custom: null }]);

    await expect(loadPayloadRedirects('en-GB', 'pt-PT')).resolves.toEqual({});
  });

  it('refuses a custom destination that leaves this site, and names it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    withDocs([{ from: '/a', type: 'custom', custom: 'https://sitemau.com' }]);

    await expect(loadPayloadRedirects('pt-PT', 'pt-PT')).resolves.toEqual({});

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('/a'));
  });

  it('says out loud when the table is larger than what it serves', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    withDocs([{ from: '/a', type: 'custom', custom: '/b' }], [], 4000);

    await loadPayloadRedirects('pt-PT', 'pt-PT');

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('4000'));
  });
});
