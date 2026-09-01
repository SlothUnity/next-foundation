import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { apiProvider } from './provider';

let server: Server;
let requested: string[] = [];

beforeAll(async () => {
  server = createServer((request, response) => {
    requested.push(request.url ?? '');

    if (request.url === '/content/sobre-nos') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ metadata: { title: 'Sobre nós' }, sections: [] }));
      return;
    }

    response.writeHead(404).end();
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  const { port } = server.address() as AddressInfo;
  process.env.API_URL = `http://127.0.0.1:${port}/content`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  requested = [];
});

describe('apiProvider', () => {
  it('serves the site settings without calling the api', async () => {
    const site = await apiProvider.site.getSite();

    expect(site.locales).toHaveLength(1);
    expect(requested).toEqual([]);
  });

  it('requests the page path over http', async () => {
    await apiProvider.page.getPage('sobre-nos', 'pt-PT').catch(() => undefined);

    expect(requested).toEqual(['/content/sobre-nos']);
  });

  it('requests a nested path whole', async () => {
    await apiProvider.page.getPage('en/about-us', 'pt-PT').catch(() => undefined);

    expect(requested).toEqual(['/content/en/about-us']);
  });

  it('answers notFound for a path the api does not know', async () => {
    await expect(apiProvider.page.getPage('nao-existe', 'pt-PT')).resolves.toEqual({
      status: 'notFound',
    });
  });

  it('delivers the response body to the mapper untouched', async () => {
    await expect(apiProvider.page.getPage('sobre-nos', 'pt-PT')).rejects.toThrow(
      /an object with keys: metadata, sections/,
    );
  });

  it('does not declare a preview mechanism', () => {
    expect(apiProvider.preview).toBeUndefined();
  });
});
