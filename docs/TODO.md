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
- gerador de esqueleto de módulo (`pnpm generate`, Plop) — a meio, ver ponto 7
- módulo `Hero` como referência, com `Hero.style.scss`

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
- campo de admin `PageUrl`
- CMS fechado atrás de login, com leitura de `Media` aberta; o frontend lê pela Local API e a query filtra por `_status`
- rascunhos com autosave a 375ms
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

- `typecheck`, `lint` e 126 testes verdes
- testes sem carregar o `payload.config.ts`
- `pnpm build` corre `lint`, `typecheck` e testes antes do `next build` — sem CI, é este o portão antes de produção
- `.env.example` na raiz

## Próximos passos

### 1. Fechar o ponto 2 no browser

O layout de raiz, o `proxy` e os boundaries estão escritos e verdes no `typecheck`, no `lint` e nos testes, mas **ainda não foram corridos contra um servidor**. Falta:

- `PROVIDER=mock pnpm dev` e confirmar no HTML de origem que um 404 sai dentro do nosso `<html>`, sem `id="__next_error__"`;
- confirmar que `/` serve `lang="pt-PT"` e `/en` serve `lang="en-GB"` — os mocks já servem os dois;
- abrir o Live Preview no admin e confirmar que o `matcher` do proxy não engoliu o `/next/preview`.

### 2. Cache no provider payload

É o item com mais impacto. Hoje **não há camada de cache nenhuma**: o `draftMode()` e o `headers()` no layout tornam todas as rotas dinâmicas, e cada visita a cada página faz duas consultas ao Postgres. O `cache()` do React só deduplica dentro de um pedido.

A forma correcta é `unstable_cache` (ou `'use cache'`) com tags por página, mais hooks `afterChange` no Payload a chamar `revalidateTag`. Merece uma ronda própria, com medição antes e depois.

Ficou decidido que o frontend é **SSR** e não geração estática — ver [routing.md](routing.md#o-frontend-é-ssr). O desempenho resolve-se aqui, ao nível dos dados.

### 3. Nível de título nos módulos

O [Hero.tsx](../src/modules/Hero/Hero.tsx) emite `<h1>` incondicionalmente: dois heros na mesma página dão dois `<h1>`. Corrigir a sério implica o módulo saber a sua posição na página, e isso **altera o contrato dos módulos**.

**Decidir isto antes do ponto 8.** Escrever três módulos novos com o contrato actual cimenta-o. As opções são passar o índice pelo `ModuleRenderer`, ou derivar o nível de um campo do CMS.

Do mesmo lote: um `<section>` sem nome acessível não conta como landmark, falta-lhe um `aria-labelledby` a apontar para o título.

### 4. Falhas silenciosas

O caso mais grave — o `resolveRoute` devolver `undefined` com a lista de locales vazia, fazendo o site inteiro responder 404 — **está resolvido**: a função resolve sempre, e o `mapPayloadSite` cai no `payloadDefaultLocale` quando o global está por preencher.

Fica um: o `url` do Live Preview em [Pages.ts](../src/providers/payload/collections/Pages.ts) devolve `undefined` quando o `enabledLocales` está vazio, o que desliga o preview sem dizer porquê.

### 5. O campo `PageUrl`

O [PageUrl.tsx](../src/providers/payload/components/PageUrl.tsx) tem três problemas no `useEffect`: os `if (!res.ok) return;` desistem sem mostrar nada ao editor nem registar o erro; não há `AbortController`, logo trocar de idioma a meio de um pedido pode escrever no estado a partir de uma resposta obsoleta; e o `void loadData()` descarta a promise, transformando uma falha de rede numa unhandled rejection. São ainda dois pedidos sequenciais em cada render.

### 6. `PREVIEW_SECRET` fora do URL

O segredo viaja na query string do iframe do Live Preview, logo fica no DOM do admin, no histórico do browser e em qualquer `Referer` que a página previsualizada envie. Um token curto e assinado resolvia. Não é urgente porque a rota valida também a sessão com `payload.auth()`.

### 7. O gerador de módulos

O [generator/plopfile.ts](../generator/plopfile.ts) e o script `pnpm generate` existem e funcionam, mas ficaram a meio e sem documentação — só entraram nos docs depois de alguém perguntar por eles. Três coisas por fazer:

- **Os templates `.hbs` são reescritos pelo `pnpm format`.** O `.prettierignore` não exclui a pasta `generator/`, e o parser de handlebars do Prettier destrói a formatação — o código gerado sai numa linha só. Acrescentar `generator/templates` ao `.prettierignore` e reformatar os templates à mão é o essencial.
- **O componente gerado ignora os props:** `export function Cta(module: CtaProps)`, com o parâmetro por destruturar e o `<section>` vazio, enquanto o schema pede um `title`. Devia sair já a desenhar o `title`, como o `Hero`.
- **Não gera o bloco do Payload.** Cobre os passos 1 e 2 de [modules.md](modules.md#criar-um-módulo-novo) e deixa de fora o 3 e o 4 — que são precisamente onde o `slug` tem de coincidir com o `alias`. Gerar também o `<Nome>Block.ts` e a entrada em `pageBlocks` fecharia o ciclo.

Falta ainda um template de teste, e o `className` que põe no `<section>` não corresponde a convenção nenhuma do projeto.

### 8. Módulos

Só existe o `Hero`. Os próximos exercitam partes do contrato ainda não usadas: um com relações (para validar o `depth: 2`), um com media (para validar uploads), e um com uma lista de itens. Ver o ponto 3 antes de começar.

### 9. Navigation e footer

O `PageDefinition` já os prevê e o `PageRenderer` já os envolve em `<nav>`/`<footer>`, mas nenhum provider os preenche.

**É uma decisão de projecto, não da foundation.** O que a foundation garante são os landmarks; onde o conteúdo deles vive no CMS — provavelmente globals — é de quem monta o site. Nota para quem os escrever: **o módulo não deve trazer o seu próprio `<nav>`**, o renderer já o põe.

### 10. Tema e estilos

Não existe sistema de tema. **Também é decisão de projecto.** A foundation não impõe nenhum, e a colisão de nomes que se temia está resolvida: o ficheiro de estilos de um módulo é `Hero.style.scss`, não `Hero.module.scss`, para não colidir com o `Hero.module.ts` que é a definição do módulo.

Nota de dependências: o `sass` **não está no `package.json`** — vem por arrasto do `@payloadcms/ui`. Compila hoje por acidente. Declará-lo como devDependency é uma linha.

### 11. Mapeamento do provider api

O transporte está feito e o `mapApiPage` está deliberadamente por escrever: arranca com `PROVIDER=api`, e o erro do primeiro pedido diz as chaves que a API devolveu. Ver [api.md](api.md).

Pendências conhecidas, todas por resolver antes de servir um site multilingue:

- as cache tags não incluem o locale, logo idiomas diferentes colidem na mesma entrada;
- nada chama `revalidateTag` em lado nenhum, portanto as tags são write-only;
- constrói-se um `ApiClient` novo em cada `getPage`, relendo o ambiente;
- não há `AbortSignal` nem timeout — um upstream pendurado pendura o render;
- o `createPageRequest` recebe o `locale` já resolvido mas ainda não o põe no pedido.

### 12. TypeScript

**`noUncheckedIndexedAccess`** não está ligado no `tsconfig.json`. Ligá-lo apanha a classe de bugs que este projeto mais tem — `locales[0]`, `docs[0]`, `split('-')[0]` compilam hoje sem guarda. É mecânico, e vale a pena fazê-lo **antes** das rondas grandes, senão escrevem-se as guardas duas vezes.

**`Meta.locale` obrigatório.** Hoje é opcional e nenhum consumidor depende dele — o `<html lang>` passou a sair do locale da rota — mas todos os mappers o preenchem. Torná-lo obrigatório fecha a divergência entre o que o tipo permite e o que a realidade faz.

### 13. Cobertura e E2E

Não há cobertura configurada nem framework de E2E — 126 testes, todos unitários. Os componentes de admin não têm testes.

O cenário que interessa é o editorial: publicado A, preview mostra B, público continua A, publicar, público passa a B. Vale a pena corrê-lo à mão ao fechar o ponto 2, e automatizá-lo depois como ronda própria — instalar e configurar Playwright com uma base de dados com estado é trabalho a sério.

### 14. Providers realmente permutáveis

Resolvido o essencial: o `payload.config.ts` já não é avaliado com `PROVIDER=mock`, porque o [getPayloadClient.ts](../src/providers/payload/getPayloadClient.ts) o importa dinamicamente. Há teste de regressão em `createProvider.test.ts`.

O que resta é cosmético: o [createProvider.ts](../src/providers/createProvider.ts) continua a importar os três providers estaticamente. Os construtores não tocam em ambiente nem em IO, portanto hoje não custa nada além de um pouco de grafo de módulos. Um `await import()` dentro de cada `case` fechava a questão, mas obrigava o `createProvider` a ser assíncrono e isso propaga-se ao singleton `foundation` — não compensa sem outra razão.
