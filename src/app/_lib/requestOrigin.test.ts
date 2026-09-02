import { beforeEach, describe, expect, it, vi } from 'vitest';

let incoming: Record<string, string> = {};

vi.mock('next/headers', () => ({
  headers: () =>
    Promise.resolve({
      get: (name: string) => incoming[name.toLowerCase()] ?? null,
    }),
}));

const { requestOrigin } = await import('./requestOrigin');

describe('requestOrigin', () => {
  beforeEach(() => {
    incoming = {};
  });

  it('assumes https for a real host, because that is what a deploy serves', async () => {
    incoming = { host: 'exemplo.pt' };

    await expect(requestOrigin()).resolves.toBe('https://exemplo.pt');
  });

  it('assumes http on localhost, so the sitemap works in development', async () => {
    incoming = { host: 'localhost:3000' };

    await expect(requestOrigin()).resolves.toBe('http://localhost:3000');
  });

  it('trusts the proxy over the guess', async () => {
    incoming = { host: 'localhost:3000', 'x-forwarded-proto': 'https' };

    await expect(requestOrigin()).resolves.toBe('https://localhost:3000');
  });

  it('takes the first hop when the proxy chains them', async () => {
    incoming = { host: 'exemplo.pt', 'x-forwarded-proto': 'https,http' };

    await expect(requestOrigin()).resolves.toBe('https://exemplo.pt');
  });

  it('prefers the forwarded host, which is the domain the visitor typed', async () => {
    incoming = { host: 'internal.vercel.app', 'x-forwarded-host': 'exemplo.pt' };

    await expect(requestOrigin()).resolves.toBe('https://exemplo.pt');
  });

  it('refuses to invent a host, because a relative sitemap is an invalid one', async () => {
    await expect(requestOrigin()).rejects.toThrow(/no host/);
  });
});
