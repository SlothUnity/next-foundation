import { draftMode } from 'next/headers';

import { providers } from '@/provider/providers';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled: isDraft } = await draftMode();

  const Preview = providers.preview;

  return (
    <html>
      <body>
        {children}

        {isDraft && Preview ? <Preview /> : null}
      </body>
    </html>
  );
}
