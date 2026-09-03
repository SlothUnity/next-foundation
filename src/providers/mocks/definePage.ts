import type { Module, ModuleInstance, ModuleProps } from '@/core/modules';
import type { Meta, PageDefinition } from '@/core/pages';

import type { MockLocale } from './mockSite';

export interface MockBlock {
  alias: string;
  name?: string;
  data: ModuleProps;
}

export interface MockPageContent {
  path: string;

  meta?: Omit<Meta, 'locale'>;

  navigation?: MockBlock[];
  main: MockBlock[];
  footer?: MockBlock[];
}

export interface MockPage {
  path: string;
  locale: MockLocale;
  page: PageDefinition;
}

export function block<TProps extends ModuleProps>(
  module: Module<TProps>,
  data: TProps,
  name?: string,
): MockBlock {
  return {
    alias: module.alias,
    name: name ?? module.name,
    data,
  };
}

function toInstance(mockBlock: MockBlock, id: string): ModuleInstance {
  return {
    id,
    name: mockBlock.name,
    alias: mockBlock.alias,
    data: mockBlock.data,
  };
}

function toRegion(mockBlocks: MockBlock[], region: string): ModuleInstance[] {
  return mockBlocks.map((mockBlock, index) =>
    toInstance(mockBlock, `${region}-${mockBlock.alias}-${index + 1}`),
  );
}

export function definePage(translations: Partial<Record<MockLocale, MockPageContent>>): MockPage[] {
  return Object.entries(translations).map(([locale, content]) => ({
    path: content.path,
    locale: locale as MockLocale,

    page: {
      meta: { ...content.meta, locale },

      ...(content.navigation ? { navigation: toRegion(content.navigation, 'navigation') } : {}),

      main: toRegion(content.main, 'main'),

      ...(content.footer ? { footer: toRegion(content.footer, 'footer') } : {}),
    },
  }));
}
