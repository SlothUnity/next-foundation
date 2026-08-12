import { draftMode } from 'next/headers';

import { provider } from '@/providers/provider';

import { resolvePage } from './resolvePage';

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

  const Preview = provider.preview;

  return (
    <html lang={resolved?.page.meta.locale}>
      <body>
        {children}

        {isDraft && Preview ? <Preview /> : null}
      </body>
    </html>
  );
}
