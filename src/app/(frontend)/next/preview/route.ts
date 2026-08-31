import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

import { getPayload } from 'payload';
import config from '@payload-config';

import { isSafeRedirectPath } from '@/core/routing';

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);

  const path = searchParams.get('path');
  const previewSecret = searchParams.get('previewSecret');

  if (!previewSecret || previewSecret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid preview secret', { status: 403 });
  }

  if (!isSafeRedirectPath(path)) {
    return new Response('Invalid path', { status: 400 });
  }

  const payload = await getPayload({ config });

  const { user } = await payload.auth({ headers: request.headers });

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const draft = await draftMode();
  draft.enable();

  redirect(path);
}
