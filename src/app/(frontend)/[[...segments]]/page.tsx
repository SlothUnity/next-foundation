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

  const { response } = await resolvePage(segments);

  if (response.status === 'redirect') {
    return {};
  }

  // Forçado, e não deixado ao editor: uma página de erro nunca deve ser indexada, e é
  // a foundation que o garante. Substitui a `<meta robots>` que o Next injectava
  // sozinho enquanto isto passava pelo `notFound()`. Vale também para o fallback, que
  // não tem meta nenhuma vinda da origem.
  const noIndex = response.status === 'notFound' ? true : response.page.meta.noIndex;

  return createMetadata({ ...response.page?.meta, noIndex });
}

/**
 * Um só caminho de render, para os três status.
 *
 * Não há `notFound()` aqui, e é deliberado: o `notFound()` do Next entrega a UI
 * pelo stream depois de o shell já ter saído, e neste projecto — com duas raízes de
 * route group — o shell que sai é o do Next, vazio. Um 404 renderizado como
 * qualquer outra página chega inteiro ao HTML servido, dentro do nosso layout.
 *
 * O preço é o status HTTP passar a 200. Ver [TODO.md](../../../../docs/TODO.md).
 */
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
