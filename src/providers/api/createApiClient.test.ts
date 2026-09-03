import { afterEach, describe, expect, it } from 'vitest';

import { ApiClient } from './ApiClient';
import { createApiClient } from './createApiClient';

const original = { ...process.env };

describe('createApiClient', () => {
  afterEach(() => {
    process.env = { ...original };
  });

  it('builds a client from the environment', () => {
    process.env.API_URL = 'https://cms.example.com/api';

    expect(createApiClient()).toBeInstanceOf(ApiClient);
  });

  it('throws when API_URL is missing, naming the variable and who needs it', () => {
    delete process.env.API_URL;

    expect(() => createApiClient()).toThrow(/API_URL/);
    expect(() => createApiClient()).toThrow(/the "api" provider/);
  });

  it('rejects an invalid API_REVALIDATE instead of guessing', () => {
    process.env.API_URL = 'https://cms.example.com/api';
    process.env.API_REVALIDATE = 'daily';

    expect(() => createApiClient()).toThrow(/API_REVALIDATE/);
  });
});
