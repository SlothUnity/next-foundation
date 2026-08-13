# Estado e próximos passos

Para perceber o projeto peça a peça, começa pelo [guia.md](guia.md). Este documento é só o que falta fazer.

## Feito

### Core

- `Foundation`, `createFoundation`, singleton fora do barrel
- `PageSource` com `GetPageOptions.draft`, `SiteSource`
- `PageDefinition`, `Meta`, `SiteDefinition`, `ModuleInstance`
- `Registry` genérico + `ModuleRegistry`
- `PageRenderer` (com `nav`/`main`/`footer` como landmarks garantidos), `ModuleRenderer`, `ModuleErrorFallback`
- validação de runtime por schema, com comportamento distinto dev/prod
- aviso em desenvolvimento quando um módulo corre sem schema
- `resolveRoute`, `createPagePath`, `getLocaleSegment`
- tipos colocados junto dos donos, com sufixo `.types.ts`

### Módulos

- `defineModule`, `createModuleComponent`
- registo automático a partir de `src/modules/index.ts`
- módulo `hero` como referência

### Providers

- contrato `Provider` com `preview` opcional
- `createProvider` por variável `PROVIDER`, singleton em `provider.ts`
- provider `mocks` — site completo sem base de dados, e sem sequer avaliar o `payload.config.ts` (import dinâmico no `getPayloadClient`)
- provider `payload`
- provider `api` — pedido a cru (`API_URL` + caminho) e transporte pronto (cliente, cache, erros, testes), com duas costuras editáveis: `createPageRequest` e `mapApiPage`
- `requireEnv` partilhado: configuração obrigatória em falta derruba o arranque em vez de degradar em silêncio

### Payload

- collections `Pages`, `Media`, `Users`; global `Site`
- localização com `filterAvailableLocales` a partir do global `Site`
- hierarquia e breadcrumbs (`nestedDocs`), slugs por `createSlug`
- SEO com `ogTitle`, `ogDescription`, `noIndex`, `noFollow`
- validação de homepage única (`isHome`)
- campo de admin `PageUrl`
- CMS fechado atrás de login, com leitura de `Media` aberta; o frontend lê pela Local API e a query filtra por `_status`
- rascunhos com autosave a 375ms
- Live Preview server-side: `RefreshRouteOnSave`, `next/preview`, `next/exit-preview`

### App

- root layout dentro do segmento dinâmico, com `lang` do `<html>` vindo da `meta.locale` da página e fallback para o locale por omissão do site
- `resolvePage` e `resolveSite` partilhados por layout, `generateMetadata` e página, com `cache` do React
- `not-found.tsx` e `error.tsx` escritos (mas ainda inertes — ver «Layout de raiz» nos próximos passos)
- `isSafeRedirectPath` a fechar o open redirect do preview; `exit-preview` só por `POST`

### Convenções

- regra escrita para **que tipos vão para um `.types.ts`**: os que atravessam camadas; os que só descrevem o input ou output de uma função ficam ao lado dela
- os dois sistemas de nome (`<Assunto>.<papel>.ts` vs `<NomeDoExport>.ts`) explicados em [conventions.md](conventions.md), com o caso de `SiteSource.ts` vs `Site.types.ts`
- `createModuleComponent.tsx` em camelCase, como a regra sempre pediu
- fixtures dos mocks simétricos com as classes irmãs: `mockHomePage.ts`, `mockSite.ts`, ambos com export nomeado
- corrigidas duas divergências de caixa entre o disco e o índice do git (`foundation.ts`, `createModuleComponent.tsx`) — **quebravam o build em Linux**, ver aviso em [conventions.md](conventions.md)

### Qualidade

- `typecheck`, `lint` e 117 testes verdes
- testes sem carregar o `payload.config.ts`
- `pnpm build` corre `lint`, `typecheck` e testes antes do `next build` — sem CI, é este o portão antes de produção
- `.env.example` na raiz

## Próximos passos

### 1. Cache no provider payload

É o item com mais impacto e o que ficou deliberadamente de fora. Hoje **não há camada de cache nenhuma**: o `draftMode()` no layout torna todas as rotas dinâmicas, não há `generateStaticParams` nem `revalidate` nem `unstable_cache`, e cada visita a cada página faz duas consultas ao Postgres. O `cache()` do React só deduplica dentro de um pedido.

A forma correcta é `unstable_cache` (ou `'use cache'`) com tags por página, mais hooks `afterChange` no Payload a chamar `revalidateTag`. Merece uma ronda própria, com medição antes e depois — é a mudança com mais risco de comportamento de todas as que faltam.

### 2. Layout de raiz — o `not-found` e o `error` não estão a funcionar

Os ficheiros existem em `app/(frontend)/[[...segments]]/`, mas um 404 responde com o invólucro interno do Next (`<html id="__next_error__">`) em vez do nosso.

Quando se usam route groups como raízes separadas, o Next exige o layout de raiz **no topo do grupo**. O `(payload)` tem `app/(payload)/layout.tsx`; o `(frontend)` não tem equivalente — o layout está dentro do segmento dinâmico, para o `lang` do `<html>` poder vir da página resolvida. Sem layout no topo do grupo, o boundary do not-found não tem onde renderizar.

Há duas saídas, e é preciso escolher:

- **Subir o `<html>` para `app/(frontend)/layout.tsx`.** Simples, e o 404/erro passam a funcionar. Perde-se o `lang` por página: fica o locale por omissão do site, porque a esse nível não há `segments`.
- **Passar o locale a segmento real de rota** (`app/(frontend)/[locale]/...`). É como a maioria dos projetos multilingues em Next resolve isto: o layout de raiz conhece o locale porque ele está no caminho. Mexe no `resolveRoute` e obriga a tratar o locale por omissão com um rewrite ou um segmento opcional.

### 3. Nível de título nos módulos

O [Hero.tsx](../src/modules/hero/Hero.tsx) emite `<h1>` incondicionalmente: dois heros na mesma página dão dois `<h1>`. Corrigir a sério implica o módulo saber a sua posição na página, e isso **altera o contrato dos módulos** — daí não ter entrado. As opções são passar o índice pelo `ModuleRenderer`, ou derivar o nível de um campo do CMS. Falta decidir qual.

Do mesmo lote: um `<section>` sem nome acessível não conta como landmark, falta-lhe um `aria-labelledby` a apontar para o título.

### 4. Falhas silenciosas

Dois sítios continuam a tratar a ausência de dados como «nada a mostrar», sem log:

- [resolveRoute.ts](../src/core/routing/resolveRoute.ts) devolve `undefined` com a lista de locales vazia, o que faz o **site inteiro** responder 404 de forma indistinguível de «esta página não existe»;
- o `url` do Live Preview em [Pages.ts](../src/providers/payload/collections/Pages.ts) devolve `undefined` quando o `enabledLocales` está vazio.

### 5. O campo `PageUrl`

O [PageUrl.tsx](../src/providers/payload/components/PageUrl.tsx) tem três problemas no `useEffect`: os `if (!res.ok) return;` desistem sem mostrar nada ao editor nem registar o erro; não há `AbortController`, logo trocar de idioma a meio de um pedido pode escrever no estado a partir de uma resposta obsoleta; e o `void loadData()` descarta a promise, transformando uma falha de rede numa unhandled rejection. São ainda dois pedidos sequenciais em cada render.

### 6. Providers realmente permutáveis

Resolvido o essencial: o `payload.config.ts` já não é avaliado com `PROVIDER=mock`, porque o [getPayloadClient.ts](../src/providers/payload/getPayloadClient.ts) o importa dinamicamente. Há teste de regressão em `createProvider.test.ts`.

O que resta é cosmético em comparação: o [createProvider.ts](../src/providers/createProvider.ts) continua a importar os três providers estaticamente, e cada `provider.ts` instancia as suas sources no import. Os construtores não tocam em ambiente nem em IO, portanto hoje não custa nada além de um pouco de grafo de módulos. Um `await import()` dentro de cada `case` fechava a questão, mas obrigava o `createProvider` a ser assíncrono e isso propaga-se ao singleton `foundation` — não compensa sem outra razão.

### 7. `PREVIEW_SECRET` fora do URL

O segredo viaja na query string do iframe do Live Preview, logo fica no DOM do admin, no histórico do browser e em qualquer `Referer` que a página previsualizada envie. Um token curto e assinado resolvia. Não é urgente porque a rota valida também a sessão com `payload.auth()`.

### 8. Módulos

Só existe o `hero`. Os próximos exercitam partes do contrato ainda não usadas: um com relações (para validar o `depth: 2`), um com media (para validar uploads), e um com uma lista de itens — este último passa agora pelo `removeNullValues` já corrigido para arrays, e há teste de regressão a cobri-lo.

### 9. Navigation e footer

O `PageDefinition` já os prevê e o `PageRenderer` já os envolve em `<nav>`/`<footer>`, mas nenhum provider os preenche. Falta decidir onde vivem no CMS — provavelmente globals — e mapeá-los. Nota para quem os escrever: **o módulo não deve trazer o seu próprio `<nav>`**, o renderer já o põe.

### 9.1 Mapeamento do provider api

O transporte está feito e o `mapApiPage` está deliberadamente por escrever: arranca com `PROVIDER=api`, e o erro do primeiro pedido diz as chaves que a API devolveu. Se ela precisar de contexto no pedido, isso vive no `createPageRequest`. Ver [api.md](api.md).

Pendências conhecidas do provider, todas por resolver antes de servir um site multilingue:

- as cache tags não incluem o locale, logo idiomas diferentes colidem na mesma entrada;
- nada chama `revalidateTag` em lado nenhum, portanto as tags são write-only;
- constrói-se um `ApiClient` novo em cada `getPage`, relendo o ambiente;
- não há `AbortSignal` nem timeout — um upstream pendurado pendura o render;
- o `createPageRequest` aceita `draft` e ignora-o; o `ApiPageSource` tem um `void locale`.

### 10. Tema

Ainda não existe sistema de tema nem estilos. A decisão está aberta. Atenção a uma colisão de nomes quando isso acontecer: o `Hero.module.ts` é uma definição de módulo, não um CSS Module, e um `Hero.module.css` ao lado torna a convenção ambígua.

### 11. `noUncheckedIndexedAccess`

Não está ligado no `tsconfig.json`. Ligá-lo apanha a classe de bugs que este projeto mais tem — `locales[0]`, `docs[0]`, `split('-')[0]` compilam hoje sem guarda — mas obriga a algumas correcções de uma vez.

### 12. Cobertura e E2E

Não há cobertura configurada nem framework de E2E. Os componentes de admin e os módulos também não têm testes.
