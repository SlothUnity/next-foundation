import { seoPlugin } from '@payloadcms/plugin-seo';

export const seo = seoPlugin({
  collections: ['pages'],
  uploadsCollection: 'media',

  tabbedUI: true,

  generateTitle: ({ doc }) => {
    return typeof doc?.title === 'string' ? doc.title : '';
  },

  fields: ({ defaultFields }) => [
    ...defaultFields.map((field) => {
      if ('name' in field && ['title', 'description', 'image'].includes(field.name)) {
        return {
          ...field,
          required: false,
        };
      }

      return field;
    }),

    {
      name: 'ogTitle',
      type: 'text',
      label: 'Open Graph Title',

      admin: {
        description:
          'Optional. Overrides the SEO title when sharing this page on social platforms.',
      },
    },

    {
      name: 'ogDescription',
      type: 'textarea',
      label: 'Open Graph Description',

      admin: {
        description:
          'Optional. Overrides the SEO description when sharing this page on social platforms.',
      },
    },

    {
      name: 'noIndex',
      type: 'checkbox',
      label: 'No Index',
      defaultValue: false,

      admin: {
        description: 'Prevent search engines from indexing this page.',
      },
    },

    {
      name: 'noFollow',
      type: 'checkbox',
      label: 'No Follow',
      defaultValue: false,

      admin: {
        description: 'Tell search engines not to follow links on this page.',
      },
    },
  ],
});
