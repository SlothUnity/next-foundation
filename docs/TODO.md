# Estado e próximos passos

## Feito

### Core

- `Foundation`, `createFoundation`, singleton fora do barrel
- `PageSource` com `GetPageOptions.draft`, `SiteSource`
- `PageDefinition`, `Meta`, `SiteDefinition`, `ModuleInstance`
- `Registry` genérico + `ModuleRegistry`
- `PageRenderer`, `ModuleRenderer`, `ModuleErrorFallback`
- validação de runtime por schema, com comportamento distinto dev/prod
- `resolveRoute`, `createPagePath`, `getLocaleSegment`
- tipos colocados junto dos donos, com sufixo `.types.ts`

### Módulos

- `defineModule`, `createModuleComponent`
- registo automático a partir de `src/modules/index.ts`
- módulo `hero` como referência

### Providers

- contrato `Provider` com `preview` opcional
- `createProvider` por variável `PROVIDER`, singleton em `provider.ts`
- provider `mocks` — site completo sem base de dados
- provider `payload`

### Payload

- collections `Pages`, `Media`, `Users`; global `Site`
- localização com `filterAvailableLocales` a partir do global `Site`
- hierarquia e breadcrumbs (`nestedDocs`), slugs por `createSlug`
- SEO com `ogTitle`, `ogDescription`, `noIndex`, `noFollow`
- validação de homepage única (`isHome`)
- campo de admin `PageUrl`
- rascunhos com autosave a 375ms
- Live Preview server-side: `RefreshRouteOnSave`, `next/preview`, `next/exit-preview`

### Qualidade

- `typecheck`, `lint` e 31 testes verdes
- testes sem carregar o `payload.config.ts`

## Próximos passos

### 1. Falhas silenciosas

Três sítios tratam a ausência de `site.enabledLocales` como "nada a mostrar", sem log: o `url` do Live Preview, o campo `PageUrl` e o `resolveRoute`. Um `logger.warn` no primeiro e uma mensagem explícita no segundo tornariam o problema diagnosticável em vez de invisível.

### 2. Limpeza pendente

- [ModuleErrorFallback.tsx](../src/core/renderer/ModuleErrorFallback.tsx) tem um `console.error(process.env.NODE_ENV === 'development')` que é debug esquecido.
- O [PageUrl.tsx](../src/providers/payload/components/PageUrl.tsx) ignora o `isHome`, logo mostra `/slug-da-home` onde o Live Preview abre `/`. A regra de derivação de path devia ser partilhada com o `getLivePreviewUrl`.
- O `vitest.config.ts` usa `__dirname`, que o Vite já sinaliza como não suportado no futuro `configLoader: 'native'`.

### 3. Módulos

Só existe o `hero`. Os próximos exercitam partes do contrato que ainda não foram usadas: um com relações (para validar o `depth: 2`), um com media (para validar uploads), e um com uma lista de itens (para validar arrays no schema).

### 4. Navigation e footer

O `PageDefinition` já os prevê, mas nenhum provider os preenche. Falta decidir onde vivem no CMS — provavelmente globals — e mapeá-los.

### 5. Tema

Ainda não existe sistema de tema nem estilos. A decisão está aberta.

### 6. Cobertura

O `core` está testado. Não há testes para os mappers do Payload nem para o `resolvePayloadPage`, que são a fronteira onde os dados mudam de forma — é o sítio mais provável para um bug silencioso.
