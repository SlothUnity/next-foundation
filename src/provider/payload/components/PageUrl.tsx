'use client';

import { useEffect, useState } from 'react';
import { useDocumentInfo, useLocale } from '@payloadcms/ui';

import { createPagePath } from '@/core/routing';

interface SiteSettings {
  enabledLocales?: string[];
}

interface Breadcrumb {
  url?: string | null;
}

interface PageData {
  breadcrumbs?: Breadcrumb[] | null;
}

export default function PageUrl() {
  const { id } = useDocumentInfo();
  const locale = useLocale();

  const [defaultLocale, setDefaultLocale] = useState<string>();
  const [pagePath, setPagePath] = useState<string>();

  useEffect(() => {
    async function loadData() {
      console.log('PageUrl: loadData called with id:', id, 'locale:', locale);

      if (!locale?.code) {
        return;
      }

      const siteResponse = await fetch('/api/globals/site');

      if (!siteResponse.ok) {
        return;
      }

      const site: SiteSettings = await siteResponse.json();

      setDefaultLocale(site.enabledLocales?.[0]);

      if (!id) {
        return;
      }

      const pageResponse = await fetch(
        `/api/pages/${id}?locale=${encodeURIComponent(locale.code)}&depth=0`,
      );

      if (!pageResponse.ok) {
        return;
      }

      const page: PageData = await pageResponse.json();

      const lastBreadcrumb = page.breadcrumbs?.[page.breadcrumbs.length - 1];

      setPagePath(lastBreadcrumb?.url ?? '/');
    }

    void loadData();
  }, [id, locale?.code]);

  if (!defaultLocale || !locale?.code || pagePath === undefined) {
    return null;
  }

  const path = createPagePath({
    path: pagePath,
    locale: locale.code,
    defaultLocale,
  });

  const url = `${window.location.origin}${path}`;

  return (
    <div>
      <span>Page URL: </span>

      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    </div>
  );
}
