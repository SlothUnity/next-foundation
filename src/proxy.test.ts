import { describe, expect, it } from 'vitest';

import { NextRequest } from 'next/server';

import { config, PATHNAME_HEADER, proxy } from './proxy';

function run(path: string, headers: Record<string, string> = {}) {
  return proxy(new NextRequest(`https://exemplo.pt${path}`, { headers }));
}

describe('proxy', () => {
  it('tells the layout which path was asked for, which the App Router does not', () => {
    const response = run('/en/about-us');

    expect(response.headers.get('x-middleware-override-headers')).toContain(PATHNAME_HEADER);
    expect(response.headers.get(`x-middleware-request-${PATHNAME_HEADER}`)).toBe('/en/about-us');
  });

  it('keeps the query out of it, because the header carries a path', () => {
    const response = run('/noticias?pagina=2');

    expect(response.headers.get(`x-middleware-request-${PATHNAME_HEADER}`)).toBe('/noticias');
  });

  it('passes the request through instead of rewriting or redirecting it', () => {
    const response = run('/');

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('does not drop the headers the request already had', () => {
    const response = run('/', { 'accept-language': 'pt-PT' });

    expect(response.headers.get('x-middleware-override-headers')).toContain('accept-language');
  });
});

describe('the paths the proxy runs on', () => {
  const pattern = new RegExp(`^${config.matcher[0]}$`);

  const covers = (path: string) => pattern.test(path);

  it.each(['/', '/sobre-nos', '/en/about-us', '/servicos/consultoria'])('covers %s', (path) => {
    expect(covers(path)).toBe(true);
  });

  it.each(['/admin', '/admin/collections/pages', '/api/media/file/logo.png', '/next/preview'])(
    'leaves %s to the CMS or the framework',
    (path) => {
      expect(covers(path)).toBe(false);
    },
  );

  it.each(['/favicon.ico', '/_next/static/chunk.js', '/sitemap.xml'])(
    'leaves %s alone, because it is a file and not a page',
    (path) => {
      expect(covers(path)).toBe(false);
    },
  );

  it.each(['/administracao', '/apiario', '/apis-e-abelhas'])(
    'covers %s — a page whose name merely starts like a reserved prefix',
    (path) => {
      expect(covers(path)).toBe(true);
    },
  );
});
