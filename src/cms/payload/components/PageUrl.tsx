'use client';

import { useEffect, useState } from 'react';
import { useField, useLocale } from '@payloadcms/ui';

import { createPagePath } from '@/core/routing';

interface SiteSettings {
  enabledLocales?: string[];
}

export default function PageUrl() {
  const { value: pageUrl } = useField<string>({
    path: 'pageUrl',
  });

  const locale = useLocale();

  const [defaultLocale, setDefaultLocale] = useState<string>();

  useEffect(() => {
    async function loadSite() {
      const response = await fetch('/api/globals/site');

      if (!response.ok) {
        return;
      }

      const site: SiteSettings = await response.json();

      setDefaultLocale(site.enabledLocales?.[0]);
    }

    void loadSite();
  }, []);

  if (!defaultLocale || !locale?.code) {
    return null;
  }

  const path = createPagePath({
    path: pageUrl ?? '',
    locale: locale.code,
    defaultLocale,
  });

  const url = `${window.location.origin}${path}`;

  return (
    <div>
      <div>Page URL</div>

      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    </div>
  );
}
