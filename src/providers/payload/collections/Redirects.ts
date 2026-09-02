import type {
  CollectionConfig,
  RelationshipFieldSingleValidation,
  TextFieldSingleValidation,
} from 'payload';

import { isSafeRedirectPath } from '@/core/routing';
import {
  revalidateRedirectsOnChange,
  revalidateRedirectsOnDelete,
} from '@/providers/payload/cache';

/**
 * Aceita só caminhos da própria origem, e diz porquê quando recusa.
 *
 * A mesma função que fecha o open redirect da rota de pré-visualização. Um redirect
 * para fora do site é uma decisão de projecto — não é difícil de acrescentar, mas
 * não é o que uma foundation deve deixar acontecer por distracção num campo de
 * texto.
 */
const isInternalPath: TextFieldSingleValidation = (value) => {
  if (!value) {
    return true;
  }

  if (!isSafeRedirectPath(value)) {
    return 'Use a path on this site, starting with "/" — for example /sobre-nos.';
  }

  return true;
};

/**
 * O caminho de origem: obrigatório sempre, e da própria origem.
 */
const validateFrom: TextFieldSingleValidation = (value, options) => {
  if (!value) {
    return 'Enter the old path this redirect answers for.';
  }

  return isInternalPath(value, options);
};

/**
 * O destino escrito à mão: obrigatório **só** no modo `custom`.
 *
 * A condição do admin esconde o campo, mas esconder não é o mesmo que dispensar —
 * mais vale a validação decidir pelo `type` do que confiar na UI para isso.
 */
const validateCustom: TextFieldSingleValidation = (value, options) => {
  const siblingData = options.siblingData as { type?: string; from?: string };

  if (siblingData.type !== 'custom') {
    return true;
  }

  if (!value) {
    return 'Enter the path to redirect to, or point this redirect at a page instead.';
  }

  const internal = isInternalPath(value, options);

  if (internal !== true) {
    return internal;
  }

  // Um redirect para si próprio é um ciclo, e o browser corta-o com um erro que não
  // nomeia o culpado. Mais vale recusá-lo enquanto ainda tem nome.
  if (value === siblingData.from) {
    return 'A redirect cannot point at itself.';
  }

  return true;
};

/**
 * A página de destino: obrigatória em tudo menos no modo `custom`.
 */
const validateReference: RelationshipFieldSingleValidation = (value, options) => {
  const { type } = options.siblingData as { type?: string };

  if (type === 'custom') {
    return true;
  }

  return value ? true : 'Choose the page to redirect to.';
};

/**
 * Os redirects do site, uma linha por caminho antigo.
 *
 * Sem versões: não há rascunho de um redirect. Qualquer gravação é uma publicação, e
 * por isso os hooks invalidam sempre, sem a guarda de `_status` que a `Pages` precisa
 * por causa do autosave.
 *
 * **O `from` é localizado e o destino por referência não é**, e a assimetria é o
 * ponto central desta collection.
 *
 * O `from` tem de ser localizado porque um slug traduz-se: `/pagina-antiga` em
 * português não é o mesmo URL que `/old-page` em inglês. Já a página de destino é
 * **um documento**, o mesmo nos dois idiomas — o que muda é o URL dela em cada um, e
 * esse é derivado dos breadcrumbs no momento da leitura. O editor escolhe a página
 * uma vez e cada idioma recebe o seu URL, em vez de haver duas hipóteses de apontar
 * o redirect português para o URL inglês.
 *
 * Ganha-se ainda o que um campo de texto não dá: **se a página de destino mudar de
 * slug, a referência continua certa.** Com o `nestedDocs` a reescrever breadcrumbs,
 * um destino escrito à mão fica a apontar para o vazio sem ninguém dar por isso.
 *
 * O `custom` existe para o que não é uma página do CMS — um ficheiro, uma rota da
 * aplicação. Esse é localizado, porque aí o URL é mesmo escrito à mão.
 *
 * Não se usa o `@payloadcms/plugin-redirects` por três razões: ele não faz a
 * resolução em runtime (só gere a collection), o `redirectTypes` dele são 301/302 e
 * este projecto serve 307/308, e o `from` teria de ser localizado por `overrides` —
 * a essa altura os campos estão reescritos, que é o que está aqui.
 */
export const Redirects: CollectionConfig = {
  slug: 'redirects',

  hooks: {
    afterChange: [revalidateRedirectsOnChange],
    afterDelete: [revalidateRedirectsOnDelete],
  },

  labels: {
    singular: 'Redirect',
    plural: 'Redirects',
  },

  admin: {
    group: 'Content',
    useAsTitle: 'from',
    defaultColumns: ['from', 'type', 'permanent'],
    description: 'Send an old URL somewhere else. Checked before any page is looked up.',
  },

  fields: [
    {
      name: 'from',
      type: 'text',
      label: 'From',
      required: true,
      localized: true,
      index: true,

      admin: {
        description: 'The old path, with a leading slash and no language prefix — /pagina-antiga.',
      },

      validate: validateFrom,
    },

    {
      name: 'type',
      type: 'radio',
      label: 'Redirect to',
      defaultValue: 'reference',

      options: [
        { label: 'A page', value: 'reference' },
        { label: 'A custom path', value: 'custom' },
      ],

      admin: {
        layout: 'horizontal',
        description: 'A page keeps working if its slug changes. A custom path does not.',
      },
    },

    {
      name: 'reference',
      type: 'relationship',
      label: 'Page',
      relationTo: 'pages',

      admin: {
        condition: (_, siblingData) => siblingData?.type !== 'custom',
        description: 'The URL is derived per language from this page, so pick it once.',
      },

      validate: validateReference,
    },

    {
      name: 'custom',
      type: 'text',
      label: 'Custom path',
      localized: true,

      admin: {
        condition: (_, siblingData) => siblingData?.type === 'custom',
        description: 'For what is not a page. Include the language prefix if it needs one.',
      },

      validate: validateCustom,
    },

    {
      name: 'permanent',
      type: 'checkbox',
      label: 'Permanent',
      defaultValue: false,

      admin: {
        description: 'Answer 308 instead of 307. Browsers cache a permanent redirect — be sure.',
      },
    },
  ],
};
