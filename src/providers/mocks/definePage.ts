import type { Module, ModuleInstance, ModuleProps } from '@/core/modules';
import type { Meta, PageDefinition } from '@/core/pages';

import type { MockLocale } from './mockSite';

export interface MockBlock {
  alias: string;
  name?: string;
  data: ModuleProps;
}

export interface MockPageContent {
  /**
   * O caminho sem locale e sem barra inicial. A homepage é `''`.
   *
   * Vive dentro de cada tradução, e não ao lado delas, porque um slug traduz-se como
   * qualquer outro conteúdo: `sobre-nos` em português é `about-us` em inglês.
   */
  path: string;

  /** Sem `locale`: esse é a chave da tradução, e não se escreve duas vezes. */
  meta?: Omit<Meta, 'locale'>;

  navigation?: MockBlock;
  main: MockBlock[];
  footer?: MockBlock;
}

export interface MockPage {
  path: string;
  locale: MockLocale;
  page: PageDefinition;
}

/**
 * Coloca um módulo numa página, com o `data` verificado contra o tipo desse módulo.
 *
 * Recebe a definição do módulo em vez do alias em texto. É a diferença entre um erro
 * de escrita rebentar no editor e rebentar em runtime como «Module "heor" is not
 * registered» — e dá o autocomplete do `data`, que escrevendo à mão não existia.
 */
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

/**
 * Uma página, em todos os idiomas em que existe.
 *
 * As traduções entram juntas, com o locale por chave, para acrescentar um idioma ser
 * acrescentar uma chave — e não criar um ficheiro com um sufixo no nome e lembrar-se
 * de o registar. Devolve uma entrada por tradução, que é a forma que o
 * `MockPageSource` procura.
 *
 * Os ids são derivados do alias e da posição em vez de escritos à mão: o
 * `ModuleRenderer` exige-os únicos dentro da página, e dois `hero-1` colados por
 * copy-paste davam uma key repetida em React, que falha em silêncio.
 */
export function definePage(translations: Partial<Record<MockLocale, MockPageContent>>): MockPage[] {
  return Object.entries(translations).map(([locale, content]) => ({
    path: content.path,
    locale: locale as MockLocale,

    page: {
      meta: { ...content.meta, locale },

      ...(content.navigation
        ? { navigation: toInstance(content.navigation, `${content.navigation.alias}-navigation`) }
        : {}),

      main: content.main.map((mockBlock, index) =>
        toInstance(mockBlock, `${mockBlock.alias}-${index + 1}`),
      ),

      ...(content.footer
        ? { footer: toInstance(content.footer, `${content.footer.alias}-footer`) }
        : {}),
    },
  }));
}
