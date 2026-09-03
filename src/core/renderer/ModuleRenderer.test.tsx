import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFoundation } from '@/core/foundation';
import { TestPageSource, TestSiteSource } from '@/testing/testSources';

import { ModuleRenderer } from './ModuleRenderer';

vi.stubEnv('NODE_ENV', 'development');

function createTestFoundation() {
  return createFoundation({
    page: new TestPageSource(),
    site: new TestSiteSource(),
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

describe('ModuleRenderer, in production', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
  });

  it('renders nothing when the alias is not registered, instead of throwing', () => {
    const { container } = render(
      <ModuleRenderer
        foundation={createTestFoundation()}
        module={{ id: 'unknown-1', alias: 'does-not-exist', name: 'Unknown', data: {} }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the data no longer matches the schema', () => {
    const { container } = render(
      <ModuleRenderer
        foundation={createTestFoundation()}
        module={{
          id: 'hero-invalid-1',
          alias: 'hero',
          name: 'Hero',
          data: { subtitle: 'Missing title' },
        }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
