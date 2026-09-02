import type { Mock } from 'vitest';

/**
 * O argumento que um mock recebeu, com o índice verificado.
 *
 * Existe por causa do `noUncheckedIndexedAccess`: `mock.calls[0][0]` deixa de
 * compilar, e a alternativa era espalhar `!` por duas dúzias de asserções — o que é
 * exactamente a afirmação por verificar que a flag foi ligada para apanhar.
 *
 * Verificar aqui paga-se em mensagens. Um mock que não foi chamado dava
 * `Cannot read properties of undefined`, sem dizer qual nem quantas vezes; agora
 * diz as duas coisas.
 *
 * Só se usa quando o teste **precisa do valor** para calcular algo — construir um
 * `URL`, ler um campo. Para «foi chamado com isto», os matchers do Vitest
 * (`expect.objectContaining`, `expect.stringContaining`) dizem-no melhor.
 *
 * O tipo é do lado de quem chama, e sem default de propósito: sem `T` fica `unknown`,
 * que serve para o passar a `String()` ou a um `expect`. Quem precisa de descer aos
 * campos declara a forma que espera — e isso deixa escrito no teste o que ele assume.
 */
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
