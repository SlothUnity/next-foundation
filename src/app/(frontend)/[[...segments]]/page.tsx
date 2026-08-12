import type { Metadata } from 'next';
import { draftMode } from 'next/headers';

import { notFound } from 'next/navigation';

import { foundation } from '@/core/foundation';
import { PageRenderer } from '@/core/renderer';
import { resolveRoute } from '@/core/routing';

import { createMetadata } from '@/utils/createMetadata';

interface PageProps {
  params: Promise<{
    segments?: string[];
  }>;
}

async function resolvePage({ params }: PageProps) {
  const { segments = [] } = await params;
  const { isEnabled: isDraft } = await draftMode();

  const site = await foundation.site.getSite();

  const route = resolveRoute({
    segments,
    locales: site.locales,
  });

  if (!route) {
    return undefined;
  }

  const page = await foundation.page.getPage(route.path, route.locale, { draft: isDraft });

  if (!page) {
    return undefined;
  }

  return {
    page,
    route,
    site,
  };
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const result = await resolvePage(props);

  if (!result) {
    return {};
  }

  return createMetadata(result.page.meta);
}

export default async function Page(props: PageProps) {
  const result = await resolvePage(props);

  if (!result) {
    notFound();
  }

  return (
    <>
      <PageRenderer page={result.page} foundation={foundation} />
    </>
  );
}
