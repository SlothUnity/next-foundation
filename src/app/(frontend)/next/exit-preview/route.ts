import { draftMode } from 'next/headers';

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
