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

describe('the cause, which was the part that never reached the log', () => {
  it('prints the cause of a wrapped error', () => {
    const error = new Error('Request to https://cms failed.', {
      cause: new Error('connect ECONNREFUSED 127.0.0.1:443'),
    });

    expect(call(error)).toContain('ECONNREFUSED');
  });

  it('names the cause type, because that is what says which layer failed', () => {
    const cause = Object.assign(new Error('title: expected string'), { name: 'ZodError' });

    expect(call(new Error('data validation failed.', { cause }))).toContain('ZodError');
  });

  it('walks a chain of causes, deepest included', () => {
    const root = new Error('socket hang up');
    const middle = new Error('fetch failed', { cause: root });

    const log = call(new Error('Request failed.', { cause: middle }));

    expect(log).toContain('fetch failed');
    expect(log).toContain('socket hang up');
  });

  it('handles a cause that is not an Error, instead of printing [object Object]', () => {
    expect(call(new Error('rebentou', { cause: 'E263' }))).toContain('E263');
  });

  it('survives a cause that points back at the error', () => {
    const error: Error & { cause?: unknown } = new Error('ciclo');
    error.cause = error;

    expect(() => call(error)).not.toThrow();
  });

  it('prints the stack, which is what makes the message locatable', () => {
    expect(call(new Error('rebentou'))).toContain('instrumentation.test.ts');
  });

  it('says nothing extra when there is no cause', () => {
    expect(call(new Error('rebentou'))).not.toContain('caused:');
  });
});
