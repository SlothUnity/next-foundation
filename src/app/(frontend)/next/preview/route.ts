import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

import { getPayload } from 'payload';
import config from '@payload-config';

import { isSafeRedirectPath } from '@/core/routing';

import { verifyPreviewToken } from '@/providers/payload/utils/previewToken';

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);

  const path = searchParams.get('path');

  const previewSecret = process.env.PREVIEW_SECRET;

  if (!previewSecret) {
    return new Response('Preview is disabled: PREVIEW_SECRET is not set.', { status: 503 });
  }

  // Antes da assinatura: o caminho entra no que foi assinado, portanto tem de ser
  // o mesmo caminho que se vai usar a seguir.
  if (!isSafeRedirectPath(path)) {
    return new Response('Invalid path', { status: 400 });
  }

  const token = verifyPreviewToken(searchParams.get('token'), path, previewSecret);

  if (token === 'expired') {
    // Um link velho não é um ataque — é uma vista de edição aberta há muito tempo.
    // Dizer qual é a diferença poupa uma investigação a quem estiver do outro lado.
    return new Response('Preview link has expired. Reload the admin and try again.', {
      status: 403,
    });
  }

  if (token === 'invalid') {
    return new Response('Invalid preview token', { status: 403 });
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
