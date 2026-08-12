import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs';

import { createSlug } from '../utils/createSlug';

export const nestedDocs = nestedDocsPlugin({
  collections: ['pages'],

  breadcrumbsFieldSlug: 'breadcrumbs',

  generateLabel: (_, doc) => {
    return typeof doc.title === 'string' ? doc.title : '';
  },

  generateURL: (docs) => {
    const segments = docs
      .filter((doc) => !doc.isHome)
      .map((doc) => {
        if (typeof doc.title !== 'string') {
          return '';
        }

        return createSlug(doc.title);
      })
      .filter(Boolean);

    return `/${segments.join('/')}`;
  },
});
