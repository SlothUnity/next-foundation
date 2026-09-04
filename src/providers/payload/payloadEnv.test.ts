import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { payloadEnv } from './payloadEnv';

const KEYS = [
  'DATABASE_URL',
  'PAYLOAD_SECRET',
  'NEXT_PUBLIC_SERVER_URL',
  'PREVIEW_SECRET',
] as const;

type Key = (typeof KEYS)[number];

const REQUIRED: Key[] = ['DATABASE_URL', 'PAYLOAD_SECRET', 'NEXT_PUBLIC_SERVER_URL'];

const saved: Record<string, string | undefined> = {};

const WORKING: Record<Key, string> = {
  DATABASE_URL: 'postgresql://user:pw@db.exemplo.pt:5432/site',
  PAYLOAD_SECRET: 'r6Qv2yLpX9wKmTnB4hJsD8fGzA3cE7uV',
  NEXT_PUBLIC_SERVER_URL: 'https://exemplo.pt',
  PREVIEW_SECRET: 'H4kPz7nRtY2wQmS9bXcV6dL3jF8gN5aU',
};

function set(overrides: Partial<Record<Key, string | null>> = {}): void {
  for (const key of KEYS) {
    const override = overrides[key];

    if (override === null) {
      delete process.env[key];
      continue;
    }

    process.env[key] = override ?? WORKING[key];
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

describe('payloadEnv', () => {
  it('reads a well-formed environment', () => {
    set();

    expect(payloadEnv()).toEqual(WORKING);
  });

  it.each(['postgres://u:p@h:5432/d', 'postgresql://u:p@h:5432/d'])(
    'accepts %s, because Supabase hands out both',
    (url) => {
      set({ DATABASE_URL: url });

      expect(payloadEnv().DATABASE_URL).toBe(url);
    },
  );

  it('refuses a connection string that is not Postgres', () => {
    set({ DATABASE_URL: 'mysql://u:p@h:3306/d' });

    expect(() => payloadEnv()).toThrow(/postgres/);
  });

  it('refuses a trailing slash on the public URL, and says why it breaks in silence', () => {
    set({ NEXT_PUBLIC_SERVER_URL: 'https://exemplo.pt/' });

    expect(() => payloadEnv()).toThrow(/Live Preview/);
  });

  it('refuses a public URL that is not absolute', () => {
    set({ NEXT_PUBLIC_SERVER_URL: 'exemplo.pt' });

    expect(() => payloadEnv()).toThrow(/absolute URL/);
  });

  it('names all three at once when the environment is empty, instead of one per run', () => {
    set({ DATABASE_URL: null, PAYLOAD_SECRET: null, NEXT_PUBLIC_SERVER_URL: null });

    let message = '';

    try {
      payloadEnv();
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }

    for (const key of REQUIRED) {
      expect(message).toContain(key);
    }

    expect(message).not.toContain('PREVIEW_SECRET');
  });
});

describe('the two secrets that sign things', () => {
  it('refuses a PAYLOAD_SECRET shorter than 32 characters', () => {
    set({ PAYLOAD_SECRET: 'x' });

    expect(() => payloadEnv()).toThrow(/PAYLOAD_SECRET: must be at least 32 characters/);
  });

  it('says what the secret signs, so the length reads as a reason and not a rule', () => {
    set({ PAYLOAD_SECRET: 'curto' });

    expect(() => payloadEnv()).toThrow(/signs the admin session tokens/);
  });

  it('accepts a PREVIEW_SECRET that is absent, because preview is optional', () => {
    set({ PREVIEW_SECRET: null });

    expect(payloadEnv().PREVIEW_SECRET).toBeUndefined();
  });

  it('refuses a PREVIEW_SECRET that is present and weak, which is worse than absent', () => {
    set({ PREVIEW_SECRET: 'segredo' });

    expect(() => payloadEnv()).toThrow(/PREVIEW_SECRET: must be at least 32 characters/);
  });

  it('reports both secrets at once when both are weak', () => {
    set({ PAYLOAD_SECRET: 'a', PREVIEW_SECRET: 'b' });

    const message = String(expectThrow());

    expect(message).toContain('PAYLOAD_SECRET');
    expect(message).toContain('PREVIEW_SECRET');
  });
});

function expectThrow(): unknown {
  try {
    payloadEnv();
  } catch (error) {
    return error;
  }

  throw new Error('payloadEnv did not throw');
}
