import { NextResponse, type NextRequest } from 'next/server';

export const PATHNAME_HEADER = 'x-pathname';

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);

  headers.set(PATHNAME_HEADER, request.nextUrl.pathname);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!admin|api|next/|_next/|.*\\.[\\w]+$).*)'],
};
