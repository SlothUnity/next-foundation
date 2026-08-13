import { getPayload, type Payload } from 'payload';

/**
 * O `payload.config.ts` é importado **dinamicamente**, e isso é o ponto todo deste
 * ficheiro.
 *
 * O `createProvider` importa os três providers estaticamente, portanto qualquer
 * `import config from '@payload-config'` no topo de um módulo faz o Payload ser
 * avaliado mesmo com `PROVIDER=mock`. Enquanto a config caía para `secret: ''` isso
 * passava despercebido; desde que exige `PAYLOAD_SECRET`, passou a impedir o site de
 * arrancar sem base de dados — que é justamente o que o provider `mocks` promete.
 *
 * Com o import aqui dentro, a config só é avaliada quando alguém pede mesmo dados ao
 * Payload. O `getPayload` guarda a instância em cache, por isso chamar isto em vários
 * sítios não abre várias ligações.
 */
export async function getPayloadClient(): Promise<Payload> {
  const { default: config } = await import('@payload-config');

  return getPayload({ config });
}
