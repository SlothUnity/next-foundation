import { PageRenderer } from '@/core/renderer';
import { foundation } from '@/core/foundation';
import { notFound } from 'next/navigation';
import { resolveRoute } from '@/core/routing';

interface PageProps {
  params: Promise<{
    segments?: string[];
  }>;
}

export default async function Page({ params }: PageProps) {
  const { segments = [] } = await params;

  console.log('Segments:', segments);

  const site = await foundation.site.getSite();

  const route = resolveRoute({
    segments,
    locales: site.locales,
  });

  if (!route) {
    notFound();
  }

  const page = await foundation.page.getPage(route.slug, route.locale);

  console.log('Page:', page);

  if (!page) {
    notFound();
  }

  return <PageRenderer page={page} foundation={foundation} />;
}
