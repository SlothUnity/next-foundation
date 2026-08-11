import type { CollectionConfig, RelationshipFieldSingleValidation } from 'payload';

import { pageBlocks } from '@/cms/payload/blocks';
import { seoFields } from '@/cms/payload/fields/seoFields';

import { createSlug } from '../../utils/createSlug';

interface PageSiblingData {
  isHome?: boolean;
}

const validateParent: RelationshipFieldSingleValidation = (value, { siblingData }) => {
  const pageData = siblingData as PageSiblingData;

  if (pageData.isHome && value) {
    return 'Homepage cannot have a parent page.';
  }

  return true;
};

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

    // Parent Page field
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'pages',
      label: 'Parent Page',

      admin: {
        description: 'Select a parent page to create a nested page hierarchy.',

        condition: (_, siblingData) => {
          const pageData = siblingData as PageSiblingData;

          return !pageData.isHome;
        },
      },

      hooks: {
        beforeValidate: [
          ({ value, siblingData }) => {
            const pageData = siblingData as PageSiblingData;

            if (pageData.isHome) {
              return null;
            }

            return value;
          },
        ],
      },

      validate: validateParent,

      filterOptions: ({ id }) => {
        if (!id) {
          return true;
        }

        return {
          id: {
            not_equals: id,
          },
        };
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

    // Url field
    {
      name: 'pageUrl',
      type: 'text',
      label: 'Page URL',
      localized: true,

      admin: {
        readOnly: true,

        components: {
          Field: '/cms/payload/components/PageUrl#default',
        },
      },

      hooks: {
        beforeValidate: [
          async ({ siblingData, req, value }) => {
            if (siblingData?.isHome) {
              return '';
            }

            if (typeof siblingData?.title !== 'string') {
              return value;
            }

            const segment = createSlug(siblingData.title);

            const parent = siblingData?.parent;

            if (!parent) {
              return segment;
            }

            const parentId = typeof parent === 'object' ? parent.id : parent;

            const parentPage = await req.payload.findByID({
              collection: 'pages',
              id: parentId,
              locale: req.locale,
              fallbackLocale: false,
              depth: 0,
              req,
            });

            if (parentPage.isHome) {
              return segment;
            }

            return [parentPage.pageUrl, segment].filter(Boolean).join('/');
          },
        ],
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
