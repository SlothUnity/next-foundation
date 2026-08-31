'use client';

import { useRouter } from 'next/navigation';

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react';

export default function PayloadLivePreview() {
  const router = useRouter();

  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL;

  if (!serverURL) {
    throw new Error('NEXT_PUBLIC_SERVER_URL is required when using the Payload Live Preview.');
  }

  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={serverURL} />;
}
