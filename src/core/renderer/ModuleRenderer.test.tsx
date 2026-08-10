import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createFoundation } from '@/core/foundation';

import { ModuleRenderer } from './ModuleRenderer';

vi.stubEnv('NODE_ENV', 'development');

describe('ModuleRenderer', () => {
  it('renders a registered module with validated data', () => {
    const foundation = createFoundation();

    render(
      <ModuleRenderer
        foundation={foundation}
        module={{
          id: 'hero-1',
          alias: 'hero',
          data: {
            title: 'Hello Foundation',
            subtitle: 'Testing the renderer',
          },
        }}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Hello Foundation',
      }),
    ).toBeInTheDocument();

    expect(screen.getByText('Testing the renderer')).toBeInTheDocument();
  });

  it('throws when module data is invalid in development', () => {
    const foundation = createFoundation();

    expect(() =>
      render(
        <ModuleRenderer
          foundation={foundation}
          module={{
            id: 'hero-1',
            alias: 'hero',
            data: {
              subtitle: 'Missing title',
            },
          }}
        />,
      ),
    ).toThrow('Module "hero" data validation failed.');
  });

  it('throws when module alias is not registered in development', () => {
    const foundation = createFoundation();

    expect(() =>
      render(
        <ModuleRenderer
          foundation={foundation}
          module={{
            id: 'unknown-1',
            alias: 'does-not-exist',
            data: {},
          }}
        />,
      ),
    ).toThrow('Module "does-not-exist" is not registered.');
  });
});
