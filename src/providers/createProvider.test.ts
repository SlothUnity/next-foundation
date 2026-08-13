import { afterEach, describe, expect, it, vi } from 'vitest';

const original = { ...process.env };

/**
 * Importa o createProvider de raiz, para o ambiente preparado no teste valer no
 * momento em que os módulos são avaliados. Sem o resetModules, a primeira
 * importação ficava em cache e os testes seguintes não veriam o ambiente novo.
 */
async function loadCreateProvider() {
  vi.resetModules();

  return (await import('./createProvider')).createProvider;
}

describe('createProvider', () => {
  afterEach(() => {
    process.env = { ...original };
    vi.resetModules();
  });

  it('serves the mock provider with no Payload configuration at all', async () => {
    // A razão de existir do provider mocks é correr o site sem base de dados.
    // Como o createProvider importa os três providers, qualquer avaliação do
    // payload.config.ts aqui exigiria PAYLOAD_SECRET e partia esta promessa.
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
    const page = await createProvider().page.getPage('');

    expect(page?.main[0]).toMatchObject({ alias: 'hero' });
  });

  it('would notice: evaluating the Payload config without a secret does throw', async () => {
    // Sem esta prova, os dois testes acima passariam mesmo que o requireEnv
    // deixasse de exigir seja o que for. É isto que lhes dá valor: a config
    // rebenta se for avaliada, logo o mock só passa por não a avaliar.
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
