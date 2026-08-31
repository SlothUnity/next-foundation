import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { foundation } from '@/core/foundation/foundation';
import { PageRenderer } from '@/core/renderer';

import { createMetadata } from '../_lib/createMetadata';
import { resolvePage } from '../_lib/resolvePage';

interface PageProps {
  params: Promise<{
    segments?: string[];
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { segments = [] } = await params;

  const resolved = await resolvePage(segments);

  if (!resolved) {
    return {};
  }

  return createMetadata(resolved.page.meta);
}

export default async function Page({ params }: PageProps) {
  const { segments = [] } = await params;

  const resolved = await resolvePage(segments);

  if (!resolved) {
    notFound();
  }

  return <PageRenderer page={resolved.page} foundation={foundation} />;
}
