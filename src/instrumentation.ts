import type { Instrumentation } from 'next';

function causeChain(error: unknown, seen = new Set<unknown>()): string[] {
  if (!(error instanceof Error) || seen.has(error)) {
    return [];
  }

  seen.add(error);

  const { cause } = error;

  if (cause === undefined) {
    return [];
  }

  const described = cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);

  return [described, ...causeChain(cause, seen)];
}

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const { message, digest, stack } = error as Error & { digest?: string };

  const causes = causeChain(error).map((cause, depth) => `  caused: ${'  '.repeat(depth)}${cause}`);

  console.error(
    [
      'Unhandled error while serving a request.',
      `  where:  ${context.routerKind} ${context.routeType} ${context.routePath ?? request.path}`,
      `  digest: ${digest ?? '(none)'}`,
      `  error:  ${message}`,
      ...causes,
      stack ?? '',
    ]
      .filter(Boolean)
      .join('\n'),
  );
};
