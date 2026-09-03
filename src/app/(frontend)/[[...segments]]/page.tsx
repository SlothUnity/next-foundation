import type { Metadata } from 'next';

import { permanentRedirect, redirect } from 'next/navigation';

import { foundation } from '@/core/foundation/foundation';
import { PageRenderer } from '@/core/renderer';
import { createPagePath } from '@/core/routing';
import type { RawQuery } from '@/core/routing';

import { createMetadata } from '../_lib/createMetadata';
import { MissingNotFoundPage } from '../_components/MissingNotFoundPage';
import { resolvePage } from '../_lib/resolvePage';

interface PageProps {
  params: Promise<{
    segments?: string[];
  }>;

  searchParams: Promise<RawQuery>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { segments = [] } = await params;

  const { response, route, site } = await resolvePage(segments, await searchParams);

  if (response.status === 'redirect') {
    return {};
  }

  const noIndex = response.status === 'notFound' ? true : response.page.meta.noIndex;

  const canonical = createPagePath({
    path: route.path,
    locale: route.locale,
    defaultLocale: site.defaultLocale,
  });

  return createMetadata({
    meta: { locale: route.locale, ...response.page?.meta, noIndex },
    canonical,
  });
}

export default async function Page({ params, searchParams }: PageProps) {
  const { segments = [] } = await params;

  const { response } = await resolvePage(segments, await searchParams);

  if (response.status === 'redirect') {
    return response.permanent ? permanentRedirect(response.to) : redirect(response.to);
  }

  if (!response.page) {
    return <MissingNotFoundPage />;
  }

  return <PageRenderer page={response.page} foundation={foundation} />;
}
