import { beforeEach, describe, expect, it, vi } from 'vitest';

import { callArg } from '@/testing/callArg';

const find = vi.fn();

vi.mock('@/providers/payload/getPayloadClient', () => ({
  getPayloadClient: () => Promise.resolve({ find }),
}));

const { loadPayloadPaths } = await import('./loadPayloadPaths');

function page(url: string | null, updatedAt = '2026-01-01T00:00:00.000Z') {
  return {
    breadcrumbs: url === null ? [] : [{ url }],
    updatedAt,
  };
}

function answer(docs: unknown[], totalDocs = docs.length) {
  return { docs, totalDocs };
}

describe('loadPayloadPaths', () => {
  beforeEach(() => {
    find.mockReset();
  });

  it('does not prefix the default locale and does prefix the others', async () => {
    find.mockResolvedValueOnce(answer([page('/sobre-nos')]));
    find.mockResolvedValueOnce(answer([page('/about-us')]));

    const paths = await loadPayloadPaths(['pt-PT', 'en-GB'], 'pt-PT');

    expect(paths).toEqual([
      { path: '/sobre-nos', locale: 'pt-PT', updatedAt: '2026-01-01T00:00:00.000Z' },
      { path: '/en/about-us', locale: 'en-GB', updatedAt: '2026-01-01T00:00:00.000Z' },
    ]);
  });

  it('asks only for published pages, and never for the 404 page', async () => {
    find.mockResolvedValue(answer([]));

    await loadPayloadPaths(['pt-PT'], 'pt-PT');

    expect(callArg<{ where: { and: unknown[] } }>(find).where.and).toEqual([
      { _status: { equals: 'published' } },
      { is404: { not_equals: true } },
    ]);
  });

  it('reads only the two fields it needs', async () => {
    find.mockResolvedValue(answer([]));

    await loadPayloadPaths(['pt-PT'], 'pt-PT');

    const { select, depth } = callArg<{ select: unknown; depth: number }>(find);

    expect(select).toEqual({ breadcrumbs: true, updatedAt: true });
    expect(depth).toBe(0);
  });

  it('skips a page with no breadcrumb, which has no URL to list', async () => {
    find.mockResolvedValue(answer([page(null), page('/sobre-nos')]));

    await expect(loadPayloadPaths(['pt-PT'], 'pt-PT')).resolves.toHaveLength(1);
  });

  it('ignores a locale the code no longer supports instead of querying for it', async () => {
    find.mockResolvedValue(answer([]));

    await expect(loadPayloadPaths(['de-DE'], 'pt-PT')).resolves.toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });

  it('warns rather than truncating in silence', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    find.mockResolvedValue(answer([page('/sobre-nos')], 6000));

    await loadPayloadPaths(['pt-PT'], 'pt-PT');

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('of 6000 pages'));

    warn.mockRestore();
  });
});
