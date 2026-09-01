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
- `resolveRoute`, `createPagePath`, `getLocaleSegment`, `isSafeRedirectPath`
- tipos colocados junto dos donos, com sufixo `.types.ts`

### Módulos

- `defineModule`, `createModuleComponent`
- registo automático a partir de `src/modules/index.ts`
- **gerador de módulos** (`pnpm generate`, Plop) — escreve os sete ficheiros do módulo, o bloco do Payload, e regista os dois; o `alias` e o `slug` saem do mesmo nome, logo coincidem por construção
- o bloco do Payload só é escrito se esse provider existir no projecto: sem ele, gera-se o módulo e mais nada
- o código gerado passa `typecheck`, `lint` e o teste que ele próprio escreve, sem se tocar em nada
- templates fora do alcance do Prettier, que os reescrevia como markup e destruía a indentação do código gerado
- módulo `Hero` como referência, com `Hero.style.scss`
- `sass` declarado como devDependency em vez de vir por arrasto do `@payloadcms/ui`; o `.style.scss` evita a ambiguidade com o `.module.ts`, e não há sistema de tema porque isso é decisão de projecto

### Providers

- contrato `Provider` com `preview` opcional
- **o provider responde o status, não só o conteúdo** — `PageResponse` com `ok`, `notFound` e `redirect` em vez de `PageDefinition | undefined`, que dizia três coisas ao mesmo tempo; a página de erro é conteúdo da origem e renderiza pela árvore normal, e os redirects passam a caber no contrato
- **a chave da cache nomeia o formato do valor** — mudar a forma do que se guarda sem mudar a chave servia entradas velhas com a forma errada, e sem `revalidate` não se corrigia sozinho
- `createProvider` por variável `PROVIDER`, singleton em `provider.ts`
- **o locale por omissão é uma resposta do provider** — `SiteDefinition.defaultLocale` declarado em vez de inferido de `locales[0]`, e omitir o `locale` no `getPage` significa «usa o teu default» em vez de «desiste»
- provider `mocks` — site completo sem base de dados, e sem sequer avaliar o `payload.config.ts` (import dinâmico no `getPayloadClient`)
- **camada de autoria dos mocks** — `definePage` com as traduções por chave de locale, `block()` a verificar o `data` contra o tipo do módulo, ids derivados do alias e da posição; estrutura em `pages/` e `sources/`
- provider `payload`
- provider `api` — pedido a cru (`API_URL` + caminho) e transporte pronto (cliente, cache, erros, testes), com duas costuras editáveis: `createPageRequest` e `mapApiPage`
- **o `mapApiPage` fica por escrever de propósito** — o formato é de quem desenhou a API, e um mapper genérico seria um palpite que parece funcionar; a foundation entrega o ponto de partida e os limites conhecidos do transporte estão em [api.md](api.md#o-que-o-transporte-ainda-não-faz)
- `requireEnv` partilhado: configuração obrigatória em falta derruba o arranque em vez de degradar em silêncio

### Payload

- collections `Pages`, `Media`, `Users`; global `Site`
- localização com `filterAvailableLocales` a partir do global `Site`
- `payloadDefaultLocale` como constante única, partilhada pelo `payload.config.ts` e pelo `mapPayloadSite`
- hierarquia e breadcrumbs (`nestedDocs`), slugs por `createSlug`
- SEO com `ogTitle`, `ogDescription`, `noIndex`, `noFollow`
- validação de homepage única (`isHome`)
- **campo de admin `pageUrl` só de servidor** — os breadcrumbs vêm do `data`, o idioma do `req.locale`, a origem do `req.origin` e o global da Local API, portanto não faz pedido nenhum nem envia JavaScript ao browser; desapareceram com os dois `fetch` os `return` mudos, o `AbortController` em falta, a promise descartada e a terceira cópia do `enabledLocales[0]`
- CMS fechado atrás de login, com leitura de `Media` aberta; o frontend lê pela Local API e a query filtra por `_status`
- rascunhos com autosave a 375ms
- **falhas silenciosas fechadas** — o locale por omissão do Live Preview passou a sair do `mapPayloadSite` em vez de uma cópia da regra sem rede; `PREVIEW_SECRET` em falta desliga o preview com uma linha no log em vez de gerar um link que responde 403; um locale que o CMS tem e o `locales.ts` já não avisa em vez de dar 404 mudo; o global `Site` por preencher avisa ao cair no `payloadDefaultLocale`
- **cache entre pedidos** — `unstable_cache` sobre o resultado do mapeamento, com tags grosseiras e hooks `afterChange`/`afterDelete` a invalidar; o rascunho nunca entra, o 404 entra; 133 ms a frio, ~20 ms a quente, medido em produção contra a base de dados
- a guarda do autosave: um rascunho de uma página nunca publicada não invalida nada, senão a cache do site caía a cada 375ms enquanto um editor escrevia
- Live Preview server-side: `RefreshRouteOnSave`, `next/preview`, `next/exit-preview`
- **o `PREVIEW_SECRET` assina, não viaja** — o URL leva um token HMAC preso ao caminho e com uma hora de validade, e o segredo nunca sai do servidor; a verificação distingue expirado de forjado, para um link velho pedir um refresh em vez de parecer um ataque
- o `PayloadLivePreview` **atira** quando falta o `NEXT_PUBLIC_SERVER_URL`, em vez de passar `''` ao `RefreshRouteOnSave` e falhar a validação de origem em silêncio

### App

- **layout de raiz no topo do route group** (`app/(frontend)/layout.tsx`)
- **`global-error.tsx`** para os erros do próprio layout de raiz
- **`src/proxy.ts`** (a convenção `middleware` está depreciada em Next 16) a expor o pathname no header `x-pathname`, sem reescrever nem redireccionar
- `<html lang>` por página, vindo do locale da rota
- `resolvePage` e `resolveSite` partilhados por `generateMetadata` e página, com `cache` do React
- **`app/` só com ficheiros de rota** — o resto numa pasta com `_` (`_lib/` para funções, `_components/` para componentes), e o que é puro saiu de vez (`isSafeRedirectPath` → `core/routing`)
- `isSafeRedirectPath` a fechar o open redirect do preview; `exit-preview` só por `POST`

### Convenções

- regra escrita para **que tipos vão para um `.types.ts`**: os que atravessam camadas; os que só descrevem o input ou output de uma função ficam ao lado dela
- os dois sistemas de nome (`<Assunto>.<papel>.ts` vs `<NomeDoExport>.ts`) explicados em [conventions.md](conventions.md)
- regra escrita para o que vive dentro de `app/`
- `createModuleComponent.tsx` em camelCase, como a regra sempre pediu
- corrigidas duas divergências de caixa entre o disco e o índice do git (`foundation.ts`, `createModuleComponent.tsx`) — **quebravam o build em Linux**, ver aviso em [conventions.md](conventions.md)

### Qualidade

- `typecheck`, `lint` e 185 testes verdes (186 assim que existir um módulo gerado)
- testes sem carregar o `payload.config.ts`
- `pnpm build` corre `lint`, `typecheck` e testes antes do `next build` — sem CI, é este o portão antes de produção
- `.env.example` na raiz

## Próximos passos

### 1. O 404 responde 200 — decidido, e porquê

Não é uma pendência à espera de solução: é uma troca escolhida com medições. Está aqui
para não se voltar a investigar do zero.

O `notFound()` saiu. Um caminho que não existe é um `PageResponse` com
`status: 'notFound'`, e a página de erro — quando a origem tem uma — renderiza pela
árvore normal.

**A causa do shell vazio não era o streaming.** Isolada por eliminação, num build de
produção:

| o que se variou                                      | shell servido                 |
| ---------------------------------------------------- | ----------------------------- |
| `notFound()` com o layout normal (assíncrono)        | `__next_error__`, corpo vazio |
| o mesmo, com um layout **totalmente síncrono**       | `__next_error__`, corpo vazio |
| uma página **sem um único `await`**, só `notFound()` | `__next_error__`, corpo vazio |

São as **duas raízes de route group**: sem layout na camada de raiz não há de onde compor
o 404. E não pode haver — o `(payload)/layout.tsx` traz o `<html>` do Payload.

**A saída pelo proxy foi implementada e medida, e é por isso que não ficou.** Funciona —
dá 404 e HTML completo — mas o `unstable_cache` não corre no proxy (não há work store),
portanto cada pedido volta ao Postgres:

|                         | tempo de resposta, mesma página |
| ----------------------- | ------------------------------- |
| como está               | **14 ms**                       |
| com a consulta no proxy | **177 ms**                      |

12×, em **todos** os pedidos, para recuperar um código que só o analytics lê — quando o
`noindex` já resolve a indexação. Não compensa.

Fica uma via por explorar, e é estrutural: **tirar o admin do Payload deste `app/`**, para
o frontend passar a ser a camada de raiz. Resolve a causa em vez do sintoma, e é uma
mudança grande.

E fica registado o que se ganha se um dia o status for mesmo obrigatório sem essa
mudança: trocar o ramo `notFound` por um `notFound()` devolve o status 404 imediatamente,
ao preço do corpo servido. O conteúdo do provider pode ir para um `not-found.tsx` async,
que lê o locale do header `x-pathname` como o layout faz.

### 2. Migrar a cache para `use cache`

A cache do provider payload **está feita** — ver [payload.md](payload.md#cache). Fica a dívida da API escolhida.

O `unstable_cache` está declarado em Next 16 como substituído pela directiva `use cache`, que exige `cacheComponents: true`. Esse flag não é uma troca de API: liga o PPR por omissão, muda a navegação para `<Activity>`, e obriga todo o acesso a APIs de runtime a viver dentro de um `<Suspense>` — incluindo o `headers()` do layout de raiz, de onde sai o `<html lang>`, e incluindo o admin do Payload, que partilha o mesmo `app/`. É uma ronda própria, e vale a pena esperar que o Payload 3 declare suporte.

Falta ainda **verificar a invalidação contra o admin**: publicar uma página e confirmar que o público muda à primeira. Os hooks estão testados unitariamente e as entradas de cache foram inspeccionadas em produção contra a base de dados real, mas o ciclo completo exige uma escrita.

### 3. TypeScript

**`noUncheckedIndexedAccess`** não está ligado no `tsconfig.json`. Ligá-lo apanha a classe de bugs que este projeto mais tem — `locales[0]`, `docs[0]`, `split('-')[0]` compilam hoje sem guarda. É mecânico, e vale a pena fazê-lo **antes** das rondas grandes, senão escrevem-se as guardas duas vezes.

**`Meta.locale` obrigatório.** Hoje é opcional e nenhum consumidor depende dele — o `<html lang>` passou a sair do locale da rota — mas todos os mappers o preenchem. Torná-lo obrigatório fecha a divergência entre o que o tipo permite e o que a realidade faz.

### 4. Cobertura e E2E

Não há cobertura configurada nem framework de E2E — 185 testes, todos unitários. Os componentes de admin já têm testes (o `PageUrl` e o `livePreview.url` da collection), mas nunca foram abertos num browser autenticado: o que está verificado é a lógica, não o render dentro do admin.

O cenário que interessa é o editorial: publicado A, preview mostra B, público continua A, publicar, público passa a B. Vale a pena corrê-lo à mão assim que o Live Preview estiver verificado contra a base de dados, e automatizá-lo depois como ronda própria — instalar e configurar Playwright com uma base de dados com estado é trabalho a sério.

### 5. Tirar o admin do Payload da camada de raiz

A `src/app/(payload)/` é compilada sempre, seja qual for o `PROVIDER`, e traz consigo
duas consequências que já se pagam:

- **o build exige `PAYLOAD_SECRET` e `DATABASE_URL` mesmo com `PROVIDER=api`**, porque a
  rota `/api/[...slug]` importa o `payload.config.ts` estaticamente e ele valida o
  ambiente ao carregar;
- **o `notFound()` não tem shell**, porque duas raízes de route group não deixam existir
  um layout na camada de raiz — ver o ponto 1.

As duas têm a mesma causa. Resolver implica separar o admin: um `basePath` próprio, uma
segunda aplicação, ou outra estrutura de `app/`. É a mudança que fecharia o ponto 1 de
raiz, e é a maior deste documento.

### 6. Providers realmente permutáveis

Resolvido para as **sources**: o `payload.config.ts` já não é avaliado com `PROVIDER=mock`, porque o [getPayloadClient.ts](../src/providers/payload/getPayloadClient.ts) o importa dinamicamente. Há teste de regressão em `createProvider.test.ts`.

**Não é verdade para as rotas**, e convém não confundir as duas coisas: a `src/app/(payload)/` importa a config estaticamente e por isso um build falha sem `PAYLOAD_SECRET`, mesmo com `PROVIDER=api`. Isso é o ponto 5, não este.

O que resta é cosmético: o [createProvider.ts](../src/providers/createProvider.ts) continua a importar os três providers estaticamente. Os construtores não tocam em ambiente nem em IO, portanto hoje não custa nada além de um pouco de grafo de módulos. Um `await import()` dentro de cada `case` fechava a questão, mas obrigava o `createProvider` a ser assíncrono e isso propaga-se ao singleton `foundation` — não compensa sem outra razão.
