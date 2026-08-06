import { createFoundation } from '@/core/foundation';
import { PageRenderer } from '@/core/renderer';

import homePage from '@/mocks/pages/home';

export default function HomePage() {
  const foundation = createFoundation();

  return <PageRenderer page={homePage} registry={foundation.modules} />;
}
