import { afterEach, describe, expect, it, vi } from 'vitest';

const original = { ...process.env };

async function loadCreateProvider() {
  vi.resetModules();

  return (await import('./createProvider')).createProvider;
}

describe('createProvider', { timeout: 60_000 }, () => {
  afterEach(() => {
    process.env = { ...original };
    vi.resetModules();
  });

  it('serves the mock provider with no Payload configuration at all', async () => {
    delete process.env.PAYLOAD_SECRET;
    delete process.env.DATABASE_URL;
    process.env.PROVIDER = 'mock';

    const createProvider = await loadCreateProvider();
    const provider = createProvider();

    await expect(provider.site.getSite()).resolves.toMatchObject({
      name: 'Next Foundation',
    });
  });

  it('serves a page from the mocks without touching a database', async () => {
    delete process.env.PAYLOAD_SECRET;
    delete process.env.DATABASE_URL;
    process.env.PROVIDER = 'mock';

    const createProvider = await loadCreateProvider();
    const response = await createProvider().page.getPage('');

    expect(response).toMatchObject({
      status: 'ok',
      page: { main: [{ alias: 'hero' }] },
    });
  });

  it('would notice: evaluating the Payload config without a secret does throw', async () => {
    delete process.env.PAYLOAD_SECRET;
    vi.resetModules();

    await expect(import('@payload-config')).rejects.toThrow(/PAYLOAD_SECRET/);
  });

  it('refuses an unknown provider instead of falling back', async () => {
    process.env.PROVIDER = 'payloadd';

    const createProvider = await loadCreateProvider();

    expect(() => createProvider()).toThrow(/Unsupported PROVIDER "payloadd"/);
  });
});
