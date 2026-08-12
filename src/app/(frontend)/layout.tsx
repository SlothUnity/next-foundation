import { draftMode } from 'next/headers';

import { provider } from '@/providers/provider';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled: isDraft } = await draftMode();

  const Preview = provider.preview;

  return (
    <html>
      <body>
        {children}

        {isDraft && Preview ? <Preview /> : null}
      </body>
    </html>
  );
}
