import { describe, expect, it } from 'vitest';

import { ApiContractError } from '../errors';

import { describeBody } from './describeBody';
import { mapApiPage } from './mapApiPage';
import { optionalFlag, optionalList, optionalText } from './normalize';

describe('mapApiPage', () => {
  it('says it has no mapping yet, instead of returning an empty page', () => {
    expect(() => mapApiPage({ metadata: {} })).toThrow(ApiContractError);
  });

  it('points at the file to edit', () => {
    expect(() => mapApiPage({})).toThrow(/mapApiPage\.ts/);
  });

  it('reports what the api actually returned', () => {
    expect(() => mapApiPage({ metadata: {}, sections: [], navigationHeader: {} })).toThrow(
      /metadata, sections, navigationHeader/,
    );
  });
});

describe('describeBody', () => {
  it('lists the top level keys of an object', () => {
    expect(describeBody({ metadata: {}, sections: [] })).toBe(
      'an object with keys: metadata, sections',
    );
  });

  it('counts the items of an array', () => {
    expect(describeBody([1, 2, 3])).toBe('an array of 3 item(s)');
  });

  it('names null, so it is not confused with an empty object', () => {
    expect(describeBody(null)).toBe('null');
  });

  it('describes a primitive by its type', () => {
    expect(describeBody('<html>')).toBe('string');
  });

  it('describes an object with no keys', () => {
    expect(describeBody({})).toBe('an object with no keys');
  });
});

describe('normalize', () => {
  it('turns an empty string into an absent value', () => {
    expect(optionalText('')).toBeUndefined();
    expect(optionalText('   ')).toBeUndefined();
  });

  it('turns null and non-strings into an absent value', () => {
    expect(optionalText(null)).toBeUndefined();
    expect(optionalText(42)).toBeUndefined();
  });

  it('trims text with content', () => {
    expect(optionalText('  Sobre nós  ')).toBe('Sobre nós');
  });

  it('accepts the shapes a cms uses for true', () => {
    expect(optionalFlag(true)).toBe(true);
    expect(optionalFlag('true')).toBe(true);
    expect(optionalFlag(1)).toBe(true);
  });

  it('treats anything else as false', () => {
    expect(optionalFlag(null)).toBe(false);
    expect(optionalFlag('yes')).toBe(false);
    expect(optionalFlag(undefined)).toBe(false);
  });

  it('always produces a list', () => {
    expect(optionalList(null)).toEqual([]);
    expect(optionalList(undefined)).toEqual([]);
    expect(optionalList([1])).toEqual([1]);
    expect(optionalList({ id: 1 })).toEqual([{ id: 1 }]);
  });
});
