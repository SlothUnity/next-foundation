import type { ErrorReporter } from './ErrorReporter.types';

const WHY: Record<string, string> = {
  'not-registered': 'it is not registered — check src/modules/index.ts and the alias in the CMS',
  'invalid-data': 'its data did not match its schema — the content and the schema have diverged',
};

export const logModuleError: ErrorReporter = ({ alias, failure, cause }) => {
  const why = WHY[failure] ?? failure;

  console.error(`Module "${alias}" was dropped from the page because ${why}.`, cause ?? '');
};
