import { createBreadcrumbsField } from '@payloadcms/plugin-nested-docs';

export const breadcrumbsField = createBreadcrumbsField('pages', {
  admin: {
    hidden: true,
  },
});
