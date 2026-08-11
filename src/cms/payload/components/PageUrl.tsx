'use client';

import { useField } from '@payloadcms/ui';

export default function PageUrl() {
  const { value: slug } = useField<string>({
    path: 'slug',
  });

  const trimmedSlug = slug?.trim();

  if (!trimmedSlug) {
    return null;
  }

  const url = `/${encodeURIComponent(trimmedSlug)}`;

  return (
    <div>
      <span>URL: </span>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir ${url} em uma nova aba`}
      >
        {url}
      </a>
    </div>
  );
}
