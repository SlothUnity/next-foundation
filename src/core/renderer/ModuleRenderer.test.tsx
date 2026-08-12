import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createFoundation } from '@/core/foundation';
import { MockPageSource, MockSiteSource } from '@/provider/mocks';

import { ModuleRenderer } from './ModuleRenderer';

vi.stubEnv('NODE_ENV', 'development');

function createTestFoundation() {
  return createFoundation({
    page: new MockPageSource(),
    site: new MockSiteSource(),
  });
}

describe('ModuleRenderer', () => {
  it('renders a registered module with validated data', () => {
    const foundation = createTestFoundation();

    render(
      <ModuleRenderer
        foundation={foundation}
        module={{
          id: 'hero-1',
          alias: 'hero',
          name: 'Hero',
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
    const foundation = createTestFoundation();

    expect(() =>
      render(
        <ModuleRenderer
          foundation={foundation}
          module={{
            id: 'hero-1',
            alias: 'hero',
            name: 'Hero',
            data: {
              subtitle: 'Missing title',
            },
          }}
        />,
      ),
    ).toThrow('Module "hero" data validation failed.');
  });

  it('throws when module alias is not registered in development', () => {
    const foundation = createTestFoundation();

    expect(() =>
      render(
        <ModuleRenderer
          foundation={foundation}
          module={{
            id: 'unknown-1',
            alias: 'does-not-exist',
            name: 'Unknown',
            data: {},
          }}
        />,
      ),
    ).toThrow('Module "does-not-exist" is not registered.');
  });
});
