import type { Field } from 'payload';

export const seoFields: Field[] = [
  {
    name: 'seoTitle',
    type: 'text',
    label: 'SEO Title',
    localized: true,
  },

  {
    name: 'seoDescription',
    type: 'textarea',
    label: 'SEO Description',
    localized: true,
  },

  {
    name: 'noIndex',
    type: 'checkbox',
    label: 'Prevent search engines from indexing this page',
    defaultValue: false,
  },
];
