import type { Instrumentation } from 'next';

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const { message, digest } = error as Error & { digest?: string };

  console.error(
    [
      'Unhandled error while serving a request.',
      `  where:  ${context.routerKind} ${context.routeType} ${context.routePath ?? request.path}`,
      `  digest: ${digest ?? '(none)'}`,
      `  error:  ${message}`,
    ].join('\n'),
  );
};
