import type { Metadata } from 'next';

import { draftMode, headers } from 'next/headers';

import { requestOrigin } from '@/app/_lib/requestOrigin';
import { resolveRoute } from '@/core/routing';
import { provider } from '@/providers/provider';

import { PATHNAME_HEADER } from '@/proxy';

import { SkipToContent } from './_components/SkipToContent';
import { resolveSite } from './_lib/resolveSite';

import './globals.scss';

interface LayoutProps {
  children: React.ReactNode;
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await resolveSite();

  const origin = await requestOrigin();

  return {
    metadataBase: new URL(origin),

    title: site.name ? { default: site.name, template: `%s · ${site.name}` } : undefined,

    openGraph: {
      siteName: site.name || undefined,
      type: 'website',
    },
  };
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
        <SkipToContent />

        {children}

        {isDraft && Preview ? <Preview /> : null}
      </body>
    </html>
  );
}
