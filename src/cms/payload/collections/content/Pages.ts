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

      validate: async (value, { id, req }) => {
        if (!value) {
          return true;
        }

        const existingHomepages = await req.payload.find({
          collection: 'pages',
          where: {
            and: [
              {
                isHome: {
                  equals: true,
                },
              },
              ...(id
                ? [
                    {
                      id: {
                        not_equals: id,
                      },
                    },
                  ]
                : []),
            ],
          },
          limit: 1,
        });

        if (existingHomepages.docs.length > 0) {
          return 'A homepage already exists.';
        }

        return true;
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
            if (typeof data?.title === 'string' && !data?.isHome) {
              return createSlug(data.title);
            } else if (data?.isHome) {
              return '/';
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
