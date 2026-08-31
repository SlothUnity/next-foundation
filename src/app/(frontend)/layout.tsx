import { draftMode, headers } from 'next/headers';

import { resolveRoute } from '@/core/routing';
import { provider } from '@/providers/provider';

import { PATHNAME_HEADER } from '@/proxy';

import { resolveSite } from './resolveSite';

interface LayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: LayoutProps) {
  const { isEnabled: isDraft } = await draftMode();

  const site = await resolveSite();

  const pathname = (await headers()).get(PATHNAME_HEADER) ?? '';

  const { locale } = resolveRoute({
    segments: pathname.split('/').filter(Boolean),
    locales: site.locales,
    defaultLocale: site.defaultLocale,
  });

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
