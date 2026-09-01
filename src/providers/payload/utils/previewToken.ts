import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Quanto tempo um link de pré-visualização vale.
 *
 * Uma hora, e não um minuto, por causa de como o Payload gera o link: o `url` da
 * collection corre uma vez, quando a vista de edição é renderizada, e o resultado
 * fica no `src` do iframe. Um editor que abra o documento e só carregue no botão
 * de preview vinte minutos depois usa o token gerado no início. Com um TTL curto,
 * veria um 403 sem ter feito nada de errado.
 */
const TTL_SECONDS = 60 * 60;

const SEPARATOR = '.';

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/**
 * Assina um caminho, com validade.
 *
 * O que viaja no URL passa a ser isto e não o `PREVIEW_SECRET`. A diferença é o
 * que vale a quem o apanhar — nos logs de acesso, no histórico do browser ou no
 * DOM do admin, que são os três sítios onde uma query string acaba:
 *
 * - **está preso a um caminho.** Um token que escape pré-visualiza aquela página
 *   e mais nenhuma;
 * - **expira.** Uma linha de log da semana passada não serve para nada;
 * - e o segredo em si **nunca sai do servidor**, portanto não há nada para rodar
 *   à mão quando um log for parar ao sítio errado.
 */
export function createPreviewToken(path: string, secret: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS;

  return `${expiresAt}${SEPARATOR}${sign(`${path}|${expiresAt}`, secret)}`;
}

export type PreviewTokenResult = 'valid' | 'expired' | 'invalid';

/**
 * Distingue expirado de inválido porque as duas coisas dizem-se de maneira
 * diferente a quem está do outro lado: um link velho pede um refresh ao admin,
 * um link forjado não pede nada.
 */
export function verifyPreviewToken(
  token: string | null,
  path: string,
  secret: string,
): PreviewTokenResult {
  const [rawExpiresAt, signature] = token?.split(SEPARATOR) ?? [];

  if (!rawExpiresAt || !signature) {
    return 'invalid';
  }

  const expected = Buffer.from(sign(`${path}|${rawExpiresAt}`, secret));
  const received = Buffer.from(signature);

  // O timingSafeEqual atira com tamanhos diferentes, e a comparação de tamanhos
  // não precisa de ser constante — o tamanho de um HMAC não é segredo.
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return 'invalid';
  }

  // A expiração só se lê depois da assinatura conferir: antes disso o número é
  // texto que veio do pedido e não quer dizer nada.
  return Number(rawExpiresAt) * 1000 > Date.now() ? 'valid' : 'expired';
}
