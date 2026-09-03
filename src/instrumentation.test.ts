import { afterEach, describe, expect, it, vi } from 'vitest';

import { onRequestError } from './instrumentation';

type Args = Parameters<typeof onRequestError>;

function call(error: unknown, path = '/sobre-nos'): string {
  const lines: string[] = [];

  const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
    lines.push(args.map(String).join(' '));
  });

  onRequestError(
    error as Args[0],
    { path, method: 'GET', headers: {} } as Args[1],
    { routerKind: 'App Router', routePath: path, routeType: 'render' } as Args[2],
  );

  spy.mockRestore();

  return lines.join('\n');
}

describe('onRequestError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('names the route, so an error is attributable without a stack', () => {
    expect(call(new Error('rebentou'))).toContain('/sobre-nos');
    expect(call(new Error('rebentou'))).toContain('App Router render');
  });

  it('carries the digest, which is the only thing the error boundary shows the visitor', () => {
    const error = Object.assign(new Error('rebentou'), { digest: '1234567890' });

    expect(call(error)).toContain('1234567890');
  });

  it('says so when there is no digest, instead of printing undefined', () => {
    expect(call(new Error('rebentou'))).toContain('(none)');
  });

  it('falls back to the request path when the route has none', () => {
    const lines = (() => {
      const out: string[] = [];

      const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
        out.push(args.map(String).join(' '));
      });

      onRequestError(
        new Error('rebentou') as Args[0],
        { path: '/robots.txt', method: 'GET', headers: {} } as Args[1],
        { routerKind: 'App Router', routeType: 'route' } as Args[2],
      );

      spy.mockRestore();

      return out.join('\n');
    })();

    expect(lines).toContain('/robots.txt');
  });
});
