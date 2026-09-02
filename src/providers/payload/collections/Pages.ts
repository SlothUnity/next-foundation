import type { CollectionConfig } from 'payload';

import { pageBlocks } from '@/providers/payload/blocks';
import { revalidatePagesOnChange, revalidatePagesOnDelete } from '@/providers/payload/cache';
import { uniqueFlagField } from '@/providers/payload/fields';
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
            uniqueFlagField({
              name: 'isHome',
              label: 'Root Page',
              description: 'Use this page as the homepage of the website.',
              taken: 'A homepage already exists.',
              collection: 'pages',
            }),

            // Not Found Page (is404) field
            //
            // O gémeo do isHome, e por isso escrito com a mesma fábrica: as duas
            // regras de unicidade são a mesma, e mantê-las em duplicado era ficar
            // à espera de corrigir uma e esquecer a outra.
            //
            // A página continua a ter URL próprio e a responder nele — o que esta
            // marca acrescenta é ser servida quando nenhum outro caminho encaixa.
            uniqueFlagField({
              name: 'is404',
              label: 'Not Found Page',
              description:
                'Serve this page when no other page matches the URL. It is never indexed.',
              taken: 'A not found page already exists.',
              collection: 'pages',
            }),

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
