import { revalidateTag } from 'next/cache';

/**
 * Código de erro do Next para «não há contexto de pedido» (`E263`). Preferido à
 * mensagem porque a mensagem inclui a expressão que falhou e muda com ela.
 */
const MISSING_REQUEST_CONTEXT = 'E263';

function isOutsideRequest(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    '__NEXT_ERROR_CODE' in error &&
    (error as { __NEXT_ERROR_CODE?: unknown }).__NEXT_ERROR_CODE === MISSING_REQUEST_CONTEXT
  );
}

/**
 * Invalida uma tag a partir de um hook do Payload.
 *
 * Duas coisas que o `revalidateTag` cru não resolve:
 *
 * 1. **O segundo argumento.** A forma de um só argumento está depreciada em Next 16.
 *    O valor recomendado é `'max'`, que marca como velho e serve o conteúdo antigo
 *    enquanto revalida em fundo — errado para um CMS: quem carrega em publicar vai
 *    ver a página velha à primeira. `{ expire: 0 }` expira já, e o próximo pedido
 *    lê da base de dados.
 *
 * 2. **Os hooks também correm fora do Next.** Um script de seed, uma migração ou o
 *    CLI do Payload chamam o mesmo `afterChange`, e aí o `revalidateTag` atira por
 *    não encontrar o contexto do pedido. Nesse caso não há cache para invalidar,
 *    portanto engolir é a resposta certa — mas só desse erro.
 */
export function revalidatePayloadTag(tag: string): void {
  try {
    revalidateTag(tag, { expire: 0 });
  } catch (error) {
    if (isOutsideRequest(error)) {
      return;
    }

    throw error;
  }
}
