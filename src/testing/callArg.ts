import type { Mock } from 'vitest';

export function callArg<T = unknown>(mock: Mock, argIndex = 0, callIndex = 0): T {
  const { calls } = mock.mock;

  const call = calls[callIndex];

  if (!call) {
    throw new Error(
      `Expected the mock to have been called at least ${callIndex + 1} time(s), but it was called ${calls.length}.`,
    );
  }

  if (argIndex >= call.length) {
    throw new Error(
      `Expected call ${callIndex + 1} to have at least ${argIndex + 1} argument(s), but it had ${call.length}.`,
    );
  }

  return call[argIndex] as T;
}
