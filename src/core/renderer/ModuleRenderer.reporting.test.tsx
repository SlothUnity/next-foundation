import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { render } from '@testing-library/react';
import { z } from 'zod';

import type { Foundation } from '@/core/foundation';
import type { ErrorReporter } from '@/core/observability';

import { ModuleRenderer } from './ModuleRenderer';

const original = process.env.NODE_ENV;

function foundationWith(
  reportError: ErrorReporter,
  registered: { alias: string; schema?: z.ZodType }[],
): Foundation {
  return {
    modules: {
      getByAlias: (alias: string) => {
        const found = registered.find((module) => module.alias === alias);

        return found ? { ...found, component: () => null } : undefined;
      },
    } as unknown as Foundation['modules'],

    page: {} as Foundation['page'],
    site: {} as Foundation['site'],
    reportError,
  };
}

describe('the module degradation path, in production', () => {
  beforeAll(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterAll(() => {
    vi.stubEnv('NODE_ENV', original ?? 'test');
  });

  it('reports an unregistered module instead of dropping it in silence', () => {
    const reportError = vi.fn();

    render(
      <ModuleRenderer
        module={{ id: '1', alias: 'ausente', data: {} }}
        foundation={foundationWith(reportError, [])}
      />,
    );

    expect(reportError).toHaveBeenCalledWith({ alias: 'ausente', failure: 'not-registered' });
  });

  it('reports data that no longer matches the schema, and carries the cause', () => {
    const reportError = vi.fn();

    render(
      <ModuleRenderer
        module={{ id: '2', alias: 'hero', data: { title: 42 } }}
        foundation={foundationWith(reportError, [
          { alias: 'hero', schema: z.object({ title: z.string() }) },
        ])}
      />,
    );

    expect(reportError).toHaveBeenCalledTimes(1);

    const report = reportError.mock.calls[0]?.[0];

    expect(report).toMatchObject({ alias: 'hero', failure: 'invalid-data' });
    expect(report?.cause).toBeInstanceOf(Error);
  });

  it('stays quiet when the module renders, so the signal means something', () => {
    const reportError = vi.fn();

    render(
      <ModuleRenderer
        module={{ id: '3', alias: 'hero', data: { title: 'Olá' } }}
        foundation={foundationWith(reportError, [
          { alias: 'hero', schema: z.object({ title: z.string() }) },
        ])}
      />,
    );

    expect(reportError).not.toHaveBeenCalled();
  });
});
