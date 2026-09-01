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
- `createProvider` por variável `PROVIDER`, singleton em `provider.ts`
- **o locale por omissão é uma resposta do provider** — `SiteDefinition.defaultLocale` declarado em vez de inferido de `locales[0]`, e omitir o `locale` no `getPage` significa «usa o teu default» em vez de «desiste»
- provider `mocks` — site completo sem base de dados, e sem sequer avaliar o `payload.config.ts` (import dinâmico no `getPayloadClient`)
- **camada de autoria dos mocks** — `definePage` com as traduções por chave de locale, `block()` a verificar o `data` contra o tipo do módulo, ids derivados do alias e da posição; estrutura em `pages/` e `sources/`
- provider `payload`
- provider `api` — pedido a cru (`API_URL` + caminho) e transporte pronto (cliente, cache, erros, testes), com duas costuras editáveis: `createPageRequest` e `mapApiPage`
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
- o `PayloadLivePreview` **atira** quando falta o `NEXT_PUBLIC_SERVER_URL`, em vez de passar `''` ao `RefreshRouteOnSave` e falhar a validação de origem em silêncio

### App

- **layout de raiz no topo do route group** (`app/(frontend)/layout.tsx`) — o `not-found` e o `error` passaram a renderizar dentro do nosso `<html>` em vez do invólucro interno do Next
- **`global-error.tsx`** para os erros do próprio layout de raiz
- **`src/proxy.ts`** (a convenção `middleware` está depreciada em Next 16) a expor o pathname no header `x-pathname`, sem reescrever nem redireccionar
- `<html lang>` por página, vindo do locale da rota
- `resolvePage` e `resolveSite` partilhados por `generateMetadata` e página, com `cache` do React
- **`app/` só com ficheiros de rota** — o resto em `_lib/`, e o que é puro saiu de vez (`isSafeRedirectPath` → `core/routing`)
- `isSafeRedirectPath` a fechar o open redirect do preview; `exit-preview` só por `POST`

### Convenções

- regra escrita para **que tipos vão para um `.types.ts`**: os que atravessam camadas; os que só descrevem o input ou output de uma função ficam ao lado dela
- os dois sistemas de nome (`<Assunto>.<papel>.ts` vs `<NomeDoExport>.ts`) explicados em [conventions.md](conventions.md)
- regra escrita para o que vive dentro de `app/`
- `createModuleComponent.tsx` em camelCase, como a regra sempre pediu
- corrigidas duas divergências de caixa entre o disco e o índice do git (`foundation.ts`, `createModuleComponent.tsx`) — **quebravam o build em Linux**, ver aviso em [conventions.md](conventions.md)

### Qualidade

- `typecheck`, `lint` e 164 testes verdes (165 assim que existir um módulo gerado)
- testes sem carregar o `payload.config.ts`
- `pnpm build` corre `lint`, `typecheck` e testes antes do `next build` — sem CI, é este o portão antes de produção
- `.env.example` na raiz

## Próximos passos

### 1. O 404 não funciona — e subir o layout não chegou

**Verificado contra o browser, em dev (Turbopack e webpack) e num build de produção.**

O que passa:

- `/` serve `<html lang="pt-PT">` e `/en` serve `<html lang="en-GB">`. O layout de raiz no topo do grupo, o `proxy` com o `x-pathname` e os mocks bilingues funcionam.
- O status HTTP de um 404 está correcto.

O que **não** passa: o corpo de um 404 vem **vazio**. Não é «o invólucro do Next em vez do nosso», como este documento dizia antes — é uma página em branco. O HTML servido é `<html id="__next_error__"><body><div hidden></div></body></html>`, e o conteúdo do `not-found.tsx` existe só no payload RSC, dentro de `<script>`. Para um crawler, ou sem JS, não há nada.

Causa: o `/_not-found` é uma rota da **camada de raiz** `app/`, e este projeto não tem `app/layout.tsx` — o `(frontend)` e o `(payload)` são duas raízes separadas, cada uma com o seu `<html>`, porque o admin do Payload traz o dele. Sem layout na camada de raiz, o Next usa o dele.

Quatro coisas testadas e descartadas:

| Tentativa                                                        | Resultado                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Subir o layout para `app/(frontend)/layout.tsx`                  | o layout **corre** no 404, mas o `<html>` é substituído                                    |
| `not-found.tsx` mais fundo, em `[[...segments]]/`                | igual                                                                                      |
| `experimental.globalNotFound` + `app/global-not-found.tsx`       | compila, mas nunca é usado: só serve a rota `/_not-found`, e o catch-all apanha tudo antes |
| `app/layout.tsx` pass-through + `app/not-found.tsx` com `<html>` | o conteúdo passa a existir no payload RSC, o HTML continua vazio                           |

Portanto a premissa de que **subir o layout resolvia os boundaries** estava errada, e a documentação foi corrigida em conformidade. O que falta é decidir entre:

- aceitar 404 sem HTML servido (mau para SEO e para quem não corre JS);
- desistir do `notFound()` no frontend e desenhar o 404 dentro da árvore normal, com o custo de o status passar a 200 — inaceitável sem outra forma de o corrigir;
- reestruturar para o frontend ser a camada de raiz, o que obriga a tirar o admin do Payload do mesmo `app/` — mudança grande;
- abrir issue no Next: com duas raízes de route group, o `notFound()` não tem shell.

Ainda por verificar, e independente disto: abrir o Live Preview no admin e confirmar que o `matcher` do proxy não engoliu o `/next/preview`. Precisa de base de dados.

### 2. Migrar a cache para `use cache`

A cache do provider payload **está feita** — ver [payload.md](payload.md#cache). Fica a dívida da API escolhida.

O `unstable_cache` está declarado em Next 16 como substituído pela directiva `use cache`, que exige `cacheComponents: true`. Esse flag não é uma troca de API: liga o PPR por omissão, muda a navegação para `<Activity>`, e obriga todo o acesso a APIs de runtime a viver dentro de um `<Suspense>` — incluindo o `headers()` do layout de raiz, de onde sai o `<html lang>`, e incluindo o admin do Payload, que partilha o mesmo `app/`. É uma ronda própria, e vale a pena esperar que o Payload 3 declare suporte.

Falta ainda **verificar a invalidação contra o admin**: publicar uma página e confirmar que o público muda à primeira. Os hooks estão testados unitariamente e as entradas de cache foram inspeccionadas em produção contra a base de dados real, mas o ciclo completo exige uma escrita.

### 3. `PREVIEW_SECRET` fora do URL

O segredo viaja na query string do iframe do Live Preview, logo fica no DOM do admin, no histórico do browser e em qualquer `Referer` que a página previsualizada envie. Um token curto e assinado resolvia. Não é urgente porque a rota valida também a sessão com `payload.auth()`.

### 4. Mapeamento do provider api

O transporte está feito e o `mapApiPage` está deliberadamente por escrever: arranca com `PROVIDER=api`, e o erro do primeiro pedido diz as chaves que a API devolveu. Ver [api.md](api.md).

Pendências conhecidas, todas por resolver antes de servir um site multilingue:

- as cache tags não incluem o locale, logo idiomas diferentes colidem na mesma entrada;
- nada chama `revalidateTag` em lado nenhum, portanto as tags são write-only;
- constrói-se um `ApiClient` novo em cada `getPage`, relendo o ambiente;
- não há `AbortSignal` nem timeout — um upstream pendurado pendura o render;
- o `createPageRequest` recebe o `locale` já resolvido mas ainda não o põe no pedido;
- um `API_URL` mal escrito produz 404 em tudo, e o site responde 404 em silêncio em vez de dizer que a configuração está errada — é a última falha silenciosa por fechar, e fecha-se ao escrever o `mapApiPage`.

### 5. TypeScript

**`noUncheckedIndexedAccess`** não está ligado no `tsconfig.json`. Ligá-lo apanha a classe de bugs que este projeto mais tem — `locales[0]`, `docs[0]`, `split('-')[0]` compilam hoje sem guarda. É mecânico, e vale a pena fazê-lo **antes** das rondas grandes, senão escrevem-se as guardas duas vezes.

**`Meta.locale` obrigatório.** Hoje é opcional e nenhum consumidor depende dele — o `<html lang>` passou a sair do locale da rota — mas todos os mappers o preenchem. Torná-lo obrigatório fecha a divergência entre o que o tipo permite e o que a realidade faz.

### 6. Cobertura e E2E

Não há cobertura configurada nem framework de E2E — 164 testes, todos unitários. Os componentes de admin já têm testes (o `PageUrl` e o `livePreview.url` da collection), mas nunca foram abertos num browser autenticado: o que está verificado é a lógica, não o render dentro do admin.

O cenário que interessa é o editorial: publicado A, preview mostra B, público continua A, publicar, público passa a B. Vale a pena corrê-lo à mão assim que o Live Preview estiver verificado contra a base de dados, e automatizá-lo depois como ronda própria — instalar e configurar Playwright com uma base de dados com estado é trabalho a sério.

### 7. Providers realmente permutáveis

Resolvido o essencial: o `payload.config.ts` já não é avaliado com `PROVIDER=mock`, porque o [getPayloadClient.ts](../src/providers/payload/getPayloadClient.ts) o importa dinamicamente. Há teste de regressão em `createProvider.test.ts`.

O que resta é cosmético: o [createProvider.ts](../src/providers/createProvider.ts) continua a importar os três providers estaticamente. Os construtores não tocam em ambiente nem em IO, portanto hoje não custa nada além de um pouco de grafo de módulos. Um `await import()` dentro de cada `case` fechava a questão, mas obrigava o `createProvider` a ser assíncrono e isso propaga-se ao singleton `foundation` — não compensa sem outra razão.
