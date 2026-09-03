import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { payloadEnv } from './payloadEnv';

const KEYS = ['DATABASE_URL', 'PAYLOAD_SECRET', 'NEXT_PUBLIC_SERVER_URL'] as const;

type Key = (typeof KEYS)[number];

const saved: Record<string, string | undefined> = {};

const WORKING: Record<Key, string> = {
  DATABASE_URL: 'postgresql://user:pw@db.exemplo.pt:5432/site',
  PAYLOAD_SECRET: 'um-valor-longo-e-aleatorio',
  NEXT_PUBLIC_SERVER_URL: 'https://exemplo.pt',
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

    for (const key of KEYS) {
      expect(message).toContain(key);
    }
  });
});
