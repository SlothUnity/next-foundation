import type { CollectionConfig } from 'payload';

import { pageBlocks } from '@/provider/payload/blocks';
import { seoFields } from '@/provider/payload/fields/seoFields';

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
    // Root Page (isHome) field
    {
      name: 'isHome',
      type: 'checkbox',
      label: 'Root Page',
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

    // Title field
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      localized: true,
    },

    // Page URL field
    {
      name: 'pageUrl',
      type: 'ui',

      admin: {
        components: {
          Field: '/provider/payload/components/PageUrl#default',
        },
      },
    },

    // Content and SEO tabs
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
