import type { Metadata } from 'next';

import { permanentRedirect, redirect } from 'next/navigation';

import { foundation } from '@/core/foundation/foundation';
import { PageRenderer } from '@/core/renderer';

import { createMetadata } from '../_lib/createMetadata';
import { MissingNotFoundPage } from '../_components/MissingNotFoundPage';
import { resolvePage } from '../_lib/resolvePage';

interface PageProps {
  params: Promise<{
    segments?: string[];
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { segments = [] } = await params;

  const { response, route } = await resolvePage(segments);

  if (response.status === 'redirect') {
    return {};
  }

  const noIndex = response.status === 'notFound' ? true : response.page.meta.noIndex;

  return createMetadata({ locale: route.locale, ...response.page?.meta, noIndex });
}

export default async function Page({ params }: PageProps) {
  const { segments = [] } = await params;

  const { response } = await resolvePage(segments);

  if (response.status === 'redirect') {
    return response.permanent ? permanentRedirect(response.to) : redirect(response.to);
  }

  if (!response.page) {
    return <MissingNotFoundPage />;
  }

  return <PageRenderer page={response.page} foundation={foundation} />;
}
