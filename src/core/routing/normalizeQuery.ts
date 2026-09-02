import type { PageQuery } from '@/core/pages';

export type RawQuery = Record<string, string | string[] | undefined>;

export function normalizeQuery(raw: RawQuery | undefined): PageQuery {
  if (!raw) {
    return {};
  }

  const defined = Object.entries(raw).filter(
    (entry): entry is [string, string | string[]] => entry[1] !== undefined,
  );

  defined.sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));

  return Object.fromEntries(defined);
}

export function queryKey(query: PageQuery): string {
  return JSON.stringify(query);
}
