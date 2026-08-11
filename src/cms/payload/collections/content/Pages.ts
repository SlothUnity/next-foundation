import type { CollectionConfig } from 'payload';

import { pageBlocks } from '@/cms/payload/blocks';
import { seoFields } from '@/cms/payload/fields/seoFields';

import { createSlug } from '../../utils/createSlug';

export const Pages: CollectionConfig = {
  slug: 'pages',

  labels: {
    singular: 'Page',
    plural: 'Pages',
  },

  admin: {
    group: 'Content',
    useAsTitle: 'title',
  },

  versions: {
    drafts: true,
  },

  fields: [
    {
      name: 'isHome',
      type: 'checkbox',
      label: 'Homepage',
      defaultValue: false,

      admin: {
        description: 'Use this page as the homepage of the website.',
      },
    },

    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      localized: true,
    },

    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      localized: true,
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          ({ data, value }) => {
            if (typeof data?.title === 'string') {
              return createSlug(data.title);
            }

            return value;
          },
        ],
      },
    },

    {
      name: 'pageUrl',
      type: 'ui',
      admin: {
        components: {
          Field: '/cms/payload/components/PageUrl#default',
        },
      },
    },

    {
      type: 'tabs',

      tabs: [
        {
          label: 'Modules',

          fields: [
            {
              name: 'main',
              type: 'blocks',
              label: 'Modules',
              blocks: pageBlocks,
            },
          ],
        },

        {
          label: 'SEO',
          fields: seoFields,
        },
      ],
    },
  ],
};
