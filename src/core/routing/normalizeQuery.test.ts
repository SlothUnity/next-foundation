import { describe, expect, it } from 'vitest';

import { normalizeQuery, queryKey } from './normalizeQuery';

describe('normalizeQuery', () => {
  it('keeps a single value and a repeated one', () => {
    expect(normalizeQuery({ page: '2', tag: ['a', 'b'] })).toEqual({
      page: '2',
      tag: ['a', 'b'],
    });
  });

  it('drops keys Next reports as undefined', () => {
    expect(normalizeQuery({ page: '2', empty: undefined })).toEqual({ page: '2' });
  });

  it('answers an empty query for a request with none', () => {
    expect(normalizeQuery(undefined)).toEqual({});
    expect(normalizeQuery({})).toEqual({});
  });
});

describe('queryKey', () => {
  it('is the same string whatever order the params arrived in', () => {
    const one = queryKey(normalizeQuery({ sort: 'date', page: '2' }));
    const other = queryKey(normalizeQuery({ page: '2', sort: 'date' }));

    expect(one).toBe(other);
  });

  it('keeps the order of repeated values, because that order is meaningful', () => {
    const one = queryKey(normalizeQuery({ tag: ['a', 'b'] }));
    const other = queryKey(normalizeQuery({ tag: ['b', 'a'] }));

    expect(one).not.toBe(other);
  });

  it('separates two different queries, which is the whole point of the key', () => {
    expect(queryKey(normalizeQuery({ page: '1' }))).not.toBe(
      queryKey(normalizeQuery({ page: '2' })),
    );
  });

  it('round-trips, so the provider sees exactly what the key encodes', () => {
    const query = normalizeQuery({ page: '2', tag: ['a', 'b'] });

    expect(JSON.parse(queryKey(query))).toEqual(query);
  });
});
