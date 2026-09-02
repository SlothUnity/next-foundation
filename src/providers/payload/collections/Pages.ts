import type { CollectionConfig } from 'payload';

import { isEditor } from '@/providers/payload/access';
import { pageBlocks } from '@/providers/payload/blocks';
import { revalidatePagesOnChange, revalidatePagesOnDelete } from '@/providers/payload/cache';
import { uniqueFlagField } from '@/providers/payload/fields';
import { mapPayloadSite } from '@/providers/payload/mappers/mapPayloadSite';
import { breadcrumbsField } from '@/providers/payload/plugins';
import { getLivePreviewUrl } from '@/providers/payload/utils/getLivePreviewUrl';

export const Pages: CollectionConfig = {
  slug: 'pages',

  access: {
    read: isEditor,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },

  hooks: {
    afterChange: [revalidatePagesOnChange],
    afterDelete: [revalidatePagesOnDelete],
  },

  versions: {
    drafts: {
      autosave: {
        interval: 375,
      },
    },
  },

  labels: {
    singular: 'Page',
    plural: 'Pages',
  },

  admin: {
    group: 'Content',
    useAsTitle: 'title',

    livePreview: {
      url: async ({ data, locale, req }) => {
        const previewSecret = process.env.PREVIEW_SECRET;

        if (!previewSecret) {
          req.payload.logger.error(
            'PREVIEW_SECRET is not set: Live Preview is disabled. Add it to .env.local.',
          );

          return undefined;
        }

        const site = await req.payload.findGlobal({ slug: 'site', depth: 0 });

        return getLivePreviewUrl({
          breadcrumbs: data?.breadcrumbs,
          locale: locale.code,

          defaultLocale: mapPayloadSite(site).defaultLocale,

          previewSecret,
        });
      },
    },
  },

  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Configuration',
          fields: [
            uniqueFlagField({
              name: 'isHome',
              label: 'Root Page',
              description: 'Use this page as the homepage of the website.',
              taken: 'A homepage already exists.',
              collection: 'pages',
            }),

            uniqueFlagField({
              name: 'is404',
              label: 'Not Found Page',
              description:
                'Serve this page when no other page matches the URL. It is never indexed.',
              taken: 'A not found page already exists.',
              collection: 'pages',
            }),

            {
              name: 'title',
              type: 'text',
              label: 'Title',
              required: true,
              localized: true,
            },

            breadcrumbsField,
            {
              name: 'pageUrl',
              type: 'ui',

              admin: {
                components: {
                  Field: '/providers/payload/components/PageUrl#default',
                },
              },
            },
          ],
        },
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
      ],
    },
  ],
};
