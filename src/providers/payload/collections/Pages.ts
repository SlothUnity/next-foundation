import type { CollectionConfig } from 'payload';

import { pageBlocks } from '@/providers/payload/blocks';
import { revalidatePagesOnChange, revalidatePagesOnDelete } from '@/providers/payload/cache';
import { mapPayloadSite } from '@/providers/payload/mappers/mapPayloadSite';
import { breadcrumbsField } from '@/providers/payload/plugins';
import { getLivePreviewUrl } from '@/providers/payload/utils/getLivePreviewUrl';

export const Pages: CollectionConfig = {
  slug: 'pages',

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

        // Devolver `undefined` desliga o separador de pré-visualização. É a única
        // das duas saídas honestas: com o segredo em falta, o link que se gerasse
        // aqui respondia 403 dentro do iframe e não dizia a ninguém porquê.
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

          // Pelo `mapPayloadSite` e não por `enabledLocales?.[0]`: a regra do locale
          // por omissão é dele, e ele resolve sempre. A leitura em duplicado que
          // aqui estava desligava o preview em silêncio com o global por preencher.
          defaultLocale: mapPayloadSite(site).defaultLocale,

          previewSecret,
        });
      },
    },
  },

  fields: [
    // Tabs
    {
      type: 'tabs',
      tabs: [
        // Configuration
        {
          label: 'Configuration',
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
        //Modules
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
