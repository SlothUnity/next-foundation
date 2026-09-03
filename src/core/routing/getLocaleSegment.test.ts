import { describe, expect, it } from 'vitest';

import { getLocaleSegment } from './getLocaleSegment';

describe('getLocaleSegment', () => {
  it.each([
    ['pt-PT', 'pt'],
    ['en-GB', 'en'],
    ['fr-CA', 'fr'],
  ])('takes the language out of %s', (locale, segment) => {
    expect(getLocaleSegment(locale)).toBe(segment);
  });

  it('accepts a locale that is already just a language', () => {
    expect(getLocaleSegment('pt')).toBe('pt');
  });

  it('lowercases, because a URL segment is compared in lower case', () => {
    expect(getLocaleSegment('PT-pt')).toBe('pt');
    expect(getLocaleSegment('EN')).toBe('en');
  });

  it('survives a locale with more than two parts', () => {
    expect(getLocaleSegment('zh-Hans-CN')).toBe('zh');
  });

  it('gives two regional variants the same segment — the collision routing.md names', () => {
    expect(getLocaleSegment('en-GB')).toBe(getLocaleSegment('en-US'));
  });
});
