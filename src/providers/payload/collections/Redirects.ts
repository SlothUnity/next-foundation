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

const isInternalPath: TextFieldSingleValidation = (value) => {
  if (!value) {
    return true;
  }

  if (!isSafeRedirectPath(value)) {
    return 'Use a path on this site, starting with "/" — for example /sobre-nos.';
  }

  return true;
};

const validateFrom: TextFieldSingleValidation = (value, options) => {
  if (!value) {
    return 'Enter the old path this redirect answers for.';
  }

  return isInternalPath(value, options);
};

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

  if (value === siblingData.from) {
    return 'A redirect cannot point at itself.';
  }

  return true;
};

const validateReference: RelationshipFieldSingleValidation = (value, options) => {
  const { type } = options.siblingData as { type?: string };

  if (type === 'custom') {
    return true;
  }

  return value ? true : 'Choose the page to redirect to.';
};

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
