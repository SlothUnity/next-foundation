import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { Foundation, Module, PageDefinition } from '@/types';

import { PageRenderer } from './PageRenderer';

afterEach(() => {
  cleanup();
});

function createTestModule(alias: string): Module {
  return {
    alias,
    name: alias,
    component: () => <div data-testid={`module-${alias}`}>{alias}</div>,
  };
}

function createTestFoundation(): Foundation {
  const registeredModules = [
    createTestModule('test-navigation'),
    createTestModule('test-main-a'),
    createTestModule('test-main-b'),
    createTestModule('test-footer'),
  ];

  return {
    modules: {
      getByAlias: (alias: string) => registeredModules.find((module) => module.alias === alias),
    } as Foundation['modules'],

    page: {} as Foundation['page'],

    site: {
      async getSite() {
        return {
          name: 'Test Site',
          locales: ['pt-PT'],
        };
      },
    },
  };
}

describe('PageRenderer', () => {
  it('renders navigation, main modules, and footer', () => {
    const foundation = createTestFoundation();

    const page: PageDefinition = {
      meta: {
        locale: 'pt-PT',
      },

      navigation: {
        id: 'navigation-1',
        alias: 'test-navigation',
        data: {},
      },

      main: [
        {
          id: 'main-1',
          alias: 'test-main-a',
          data: {},
        },
        {
          id: 'main-2',
          alias: 'test-main-b',
          data: {},
        },
      ],

      footer: {
        id: 'footer-1',
        alias: 'test-footer',
        data: {},
      },
    };

    render(<PageRenderer page={page} foundation={foundation} />);

    expect(screen.getByTestId('module-test-navigation')).toBeInTheDocument();

    expect(screen.getByTestId('module-test-main-a')).toBeInTheDocument();

    expect(screen.getByTestId('module-test-main-b')).toBeInTheDocument();

    expect(screen.getByTestId('module-test-footer')).toBeInTheDocument();
  });

  it('renders main modules when navigation and footer are absent', () => {
    const foundation = createTestFoundation();

    const page: PageDefinition = {
      meta: {
        locale: 'pt-PT',
      },

      main: [
        {
          id: 'main-1',
          alias: 'test-main-a',
          data: {},
        },
        {
          id: 'main-2',
          alias: 'test-main-b',
          data: {},
        },
      ],
    };

    render(<PageRenderer page={page} foundation={foundation} />);

    expect(screen.getByTestId('module-test-main-a')).toBeInTheDocument();

    expect(screen.getByTestId('module-test-main-b')).toBeInTheDocument();

    expect(screen.queryByTestId('module-test-navigation')).not.toBeInTheDocument();

    expect(screen.queryByTestId('module-test-footer')).not.toBeInTheDocument();
  });
});
