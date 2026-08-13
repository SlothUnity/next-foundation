/**
 * Lê uma variável de ambiente obrigatória.
 *
 * Configuração em falta deve derrubar o arranque, não degradar em silêncio:
 * um `|| ''` num segredo de assinatura produz tokens forjáveis sem um único aviso.
 */
export function requireEnv(name: string, usedBy?: string): string {
  const value = process.env[name];

  if (!value) {
    const context = usedBy ? ` It is required by ${usedBy}.` : '';

    throw new Error(`Missing ${name}.${context}`);
  }

  return value;
}
