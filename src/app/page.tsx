import { createFoundation } from '@/core/foundation';
import { PageRenderer } from '@/core/renderer';

export default async function HomePage() {
  const foundation = createFoundation();
  const page = await foundation.page.getPage('/');

  return <PageRenderer page={page} registry={foundation.modules} />;
}
