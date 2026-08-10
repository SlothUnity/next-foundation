import { PageRenderer } from '@/core/renderer';
import { foundation } from '@/core/foundation';
import { notFound } from 'next/navigation';

export default async function HomePage() {
  const page = await foundation.page.getPage('/');

  if (!page) {
    notFound();
  }

  return <PageRenderer page={page} foundation={foundation} />;
}
