'use client';

import { useField, useLocale } from '@payloadcms/ui';

import { createPagePath } from '@/core/routing';

export default function PageUrl() {
  const { value: slug } = useField<string>({
    path: 'slug',
  });

  const locale = useLocale();

  if (!slug || !locale?.code) {
    return null;
  }

  const defaultLocale = 'pt-PT';

  const path = createPagePath({
    slug,
    locale: locale.code,
    defaultLocale,
  });

  return (
    <div>
      <span>URL: </span>

      <a href={window.location.origin + path} target="_blank" rel="noopener noreferrer">
        {window.location.origin + path}
      </a>
    </div>
  );
}
