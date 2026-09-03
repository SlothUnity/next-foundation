import { describe, expect, it } from 'vitest';

import { ApiContractError } from '../errors';

import { mapApiPaths } from './mapApiPaths';

describe('mapApiPaths', () => {
  it('refuses to guess, and says where to write the mapping', () => {
    expect(() => mapApiPaths([{ path: '/sobre-nos' }])).toThrow(ApiContractError);

    expect(() => mapApiPaths([])).toThrow(/mapApiPaths\.ts/);
  });

  it('describes what the API actually returned, so the shape is visible in the error', () => {
    expect(() => mapApiPaths([{ path: '/' }, { path: '/en' }])).toThrow('an array of 2 item(s)');

    expect(() => mapApiPaths({ items: [] })).toThrow('an object with keys: items');
  });
});
