import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { apiEnv } from './apiEnv';

const KEYS = ['API_URL', 'API_TOKEN', 'API_REVALIDATE'] as const;

const saved: Record<string, string | undefined> = {};

function set(values: Partial<Record<(typeof KEYS)[number], string>>): void {
  for (const key of KEYS) {
    delete process.env[key];
  }

  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }
}

beforeEach(() => {
  for (const key of KEYS) {
    saved[key] = process.env[key];
  }
});

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = saved[key];
    }
  }
});

describe('apiEnv', () => {
  it('reads a well-formed environment', () => {
    set({ API_URL: 'https://cms.exemplo.pt/api', API_TOKEN: 'abc', API_REVALIDATE: '30' });

    expect(apiEnv()).toEqual({
      API_URL: 'https://cms.exemplo.pt/api',
      API_TOKEN: 'abc',
      API_REVALIDATE: 30,
    });
  });

  it('defaults the revalidation window, and treats a blank value as absent', () => {
    set({ API_URL: 'https://cms.exemplo.pt/api' });
    expect(apiEnv().API_REVALIDATE).toBe(60);

    set({ API_URL: 'https://cms.exemplo.pt/api', API_REVALIDATE: '   ' });
    expect(apiEnv().API_REVALIDATE).toBe(60);
  });

  it('treats a blank token as no token, instead of sending "Bearer "', () => {
    set({ API_URL: 'https://cms.exemplo.pt/api', API_TOKEN: '' });

    expect(apiEnv().API_TOKEN).toBeUndefined();
  });

  it('says which variable is missing, and who needs it', () => {
    set({});

    expect(() => apiEnv()).toThrow(/API_URL/);
    expect(() => apiEnv()).toThrow(/the "api" provider/);
  });

  it('refuses a URL that is not absolute, instead of failing on the first request', () => {
    set({ API_URL: '/api' });

    expect(() => apiEnv()).toThrow(/absolute URL/);
  });

  it('refuses a trailing slash, because the endpoint is appended to it', () => {
    set({ API_URL: 'https://cms.exemplo.pt/api/' });

    expect(() => apiEnv()).toThrow(/slash/);
  });

  it.each(['dois', '1.5', '-1'])('refuses a revalidation window of %s', (value) => {
    set({ API_URL: 'https://cms.exemplo.pt/api', API_REVALIDATE: value });

    expect(() => apiEnv()).toThrow(/API_REVALIDATE/);
  });

  it('reports every problem at once, not the first one', () => {
    set({ API_URL: 'nope', API_REVALIDATE: 'dois' });

    let message = '';

    try {
      apiEnv();
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }

    expect(message).toContain('API_URL');
    expect(message).toContain('API_REVALIDATE');
  });
});
