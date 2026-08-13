import { draftMode } from 'next/headers';

import { provider } from '@/providers/provider';

import { resolvePage } from './resolvePage';
import { resolveSite } from './resolveSite';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    segments?: string[];
  }>;
}

export default async function RootLayout({ children, params }: LayoutProps) {
  const { segments = [] } = await params;
  const { isEnabled: isDraft } = await draftMode();

  const resolved = await resolvePage(segments);

  // O lang descreve a língua do conteúdo, não a preferência do visitante. Quando a
  // página não resolve (404, erro), o que se desenha é o not-found/error deste
  // projeto, escrito no locale por omissão do site — logo é esse o lang correcto.
  // O resolveSite está em cache, portanto isto não custa uma segunda consulta.
  const site = await resolveSite();
  const locale = resolved?.page.meta.locale ?? site.locales[0];

  const Preview = provider.preview;

  return (
    <html lang={locale}>
      <body>
        {children}

        {isDraft && Preview ? <Preview /> : null}
      </body>
    </html>
  );
}
