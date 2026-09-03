import { afterEach, describe, expect, it, vi } from 'vitest';

import { logModuleError } from './logModuleError';

function capture(report: Parameters<typeof logModuleError>[0]): string {
  const parts: string[] = [];

  const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
    parts.push(args.map(String).join(' '));
  });

  logModuleError(report);
  spy.mockRestore();

  return parts.join(' ');
}

describe('logModuleError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('names the module, because the alias is what a reader can act on', () => {
    expect(capture({ alias: 'hero', failure: 'not-registered' })).toContain('"hero"');
  });

  it('says what to check for a module that is not registered', () => {
    const line = capture({ alias: 'hero', failure: 'not-registered' });

    expect(line).toContain('src/modules/index.ts');
  });

  it('says what diverged for data that failed its schema', () => {
    const line = capture({ alias: 'hero', failure: 'invalid-data' });

    expect(line).toContain('schema');
  });

  it('prints the cause when there is one', () => {
    const line = capture({
      alias: 'hero',
      failure: 'invalid-data',
      cause: new Error('expected string'),
    });

    expect(line).toContain('expected string');
  });

  it('prints no trailing undefined when there is no cause', () => {
    expect(capture({ alias: 'hero', failure: 'not-registered' })).not.toContain('undefined');
  });

  it('falls back to the raw failure rather than saying nothing about it', () => {
    const line = capture({
      alias: 'hero',
      failure: 'algo-novo' as 'not-registered',
    });

    expect(line).toContain('algo-novo');
  });
});
