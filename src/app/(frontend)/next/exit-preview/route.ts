import { draftMode } from 'next/headers';

/**
 * POST, e não GET: desligar o modo rascunho muda estado, e um GET anónimo era
 * accionável por qualquer `<img src>` de terceiros (CSRF).
 */
export async function POST(): Promise<Response> {
  const draft = await draftMode();
  draft.disable();

  return new Response('Draft mode disabled');
}

export async function GET(): Promise<Response> {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'POST' },
  });
}
