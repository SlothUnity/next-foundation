# Estado e próximos passos

Duas listas: o que a foundation já resolve, e o que falta. O **porquê** de cada decisão
vive nos documentos de referência — aqui ficam as linhas e as ligações.

Para perceber o projeto peça a peça, começa pelo [guia.md](guia.md).

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
- `createProvider` por variável `PROVIDER`, singleton em `provider.ts` — os três bundles são instanciados no import, e [providers.md](providers.md) explica porque é que isso hoje não custa nada
- **o locale por omissão é uma resposta do provider** — `SiteDefinition.defaultLocale` declarado em vez de inferido de `locales[0]`, e omitir o `locale` no `getPage` significa «usa o teu default» em vez de «desiste»
- provider `mocks` — site completo sem base de dados, e sem sequer avaliar o `payload.config.ts` (import dinâmico no `getPayloadClient`)
- **camada de autoria dos mocks** — `definePage` com as traduções por chave de locale, `block()` a verificar o `data` contra o tipo do módulo, ids derivados do alias e da posição; estrutura em `pages/` e `sources/`
- provider `payload`
- provider `api` — pedido a cru (`API_URL` + caminho) e transporte pronto (cliente, cache, erros, testes), com duas costuras editáveis: `createPageRequest` e `mapApiPage`
- **o `mapApiPage` fica por escrever de propósito** — o formato é de quem desenhou a API, e um mapper genérico seria um palpite que parece funcionar; a foundation entrega o ponto de partida e os limites conhecidos do transporte estão em [api.md](api.md#o-que-o-transporte-ainda-não-faz)
- `requireEnv` partilhado: configuração obrigatória em falta derruba o arranque em vez de degradar em silêncio

### Payload

- collections `Pages`, `Redirects`, `Media`, `Users`; global `Site`
- localização com `filterAvailableLocales` a partir do global `Site`
- `payloadDefaultLocale` como constante única, partilhada pelo `payload.config.ts` e pelo `mapPayloadSite`
- hierarquia e breadcrumbs (`nestedDocs`), slugs por `createSlug`
- SEO com `ogTitle`, `ogDescription`, `noIndex`, `noFollow`
- **`isHome` e `is404` pela mesma fábrica** (`uniqueFlagField`) — a regra «um só documento com esta marca» existia uma vez e ia passar a existir duas; a segunda cópia é como as divergências entram
- **a página de erro é conteúdo do CMS** — o `is404` marca-a, o `resolvePayloadNotFoundPage` procura-a só quando o caminho falha, e sem ela o site cai no fallback com aviso em vez de partir; um 404 por publicar não aparece, porque o filtro de `_status` vale para ela como para as outras
- **redirects numa collection própria, com o destino por referência** — o `from` é localizado (um slug traduz-se) e a página apontada não é, porque é o mesmo documento nos dois idiomas: o editor escolhe uma vez e o URL de cada idioma sai dos breadcrumbs. Um caminho escrito à mão apodrecia quando o `nestedDocs` reescrevesse o slug, e um 308 para um 404 fica em cache no browser
- **sem o `@payloadcms/plugin-redirects`** — ele não resolve nada em runtime («does not handle the redirect itself»), os `redirectTypes` dele são 301/302 e este projecto serve 307/308, e o `from` teria de ser localizado por `overrides`; a collection é um ficheiro dos seis que isto precisa
- **a tabela de redirects vem inteira, como mapa, numa entrada de cache por idioma** — é o que torna barato consultá-la antes de cada página; por caminho seria uma entrada por URL do site. Duas consultas a frio para o site todo: `depth: 0` na tabela, e um `find` com `id: { in: [...] }` e `select: { breadcrumbs: true }` para todas as páginas apontadas de uma vez
- **os redirects resolvem-se fora do `getCachedPage`, com tag própria** — lá dentro, a decisão ficava guardada com a tag das páginas e mudar um redirect não a invalidava. No sentido contrário a dependência existe e está ligada: gravar uma página invalida também a tag dos redirects, porque os destinos são URLs de páginas
- um redirect para uma página por publicar é ignorado com aviso, em vez de mandar o visitante a um 404 que o browser memoriza
- o rascunho não olha para os redirects: o editor pediu **aquele** documento, e um redirect a apanhar o caminho dele partia a pré-visualização da página que ele está a escrever
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
- **o 404 é conteúdo e renderiza pela árvore normal** — sem `notFound()`, portanto com HTML servido e `noindex` forçado; a troca (status 200) foi escolhida com medições, e a razão de não se recuperar o status está em [routing.md](routing.md#porque-é-que-não-se-recupera-o-status)
- **redirects com código real** — `307`/`308` nos headers, medidos
- **`app/` só com ficheiros de rota** — o resto numa pasta com `_` (`_lib/` para funções, `_components/` para componentes), e o que é puro saiu de vez (`isSafeRedirectPath` → `core/routing`)
- `isSafeRedirectPath` a fechar o open redirect do preview; `exit-preview` só por `POST`

### Convenções

- regra escrita para **que tipos vão para um `.types.ts`**: os que atravessam camadas; os que só descrevem o input ou output de uma função ficam ao lado dela
- os dois sistemas de nome (`<Assunto>.<papel>.ts` vs `<NomeDoExport>.ts`) explicados em [conventions.md](conventions.md)
- regra escrita para o que vive dentro de `app/`
- `createModuleComponent.tsx` em camelCase, como a regra sempre pediu
- corrigidas **três** divergências de caixa entre o disco e o índice do git — `foundation.ts`, `createModuleComponent.tsx`, e a pasta `src/modules/hero/` que o índice tinha em minúsculas com o disco em `Hero/`. **Quebravam o build em Linux**, e a terceira quebrava-o com o import do `.style.scss` a não resolver; ver a receita em [conventions.md](conventions.md#cuidado-com-a-caixa-dos-nomes-em-windows)
- **finais de linha decididos pelo repositório** — `.gitattributes` com `* text=auto eol=lf`: o repositório já guardava LF, mas o `core.autocrlf=true` do Git em Windows escrevia CRLF no checkout e reprovava seis ficheiros que ninguém tinha editado
- **os dois ficheiros gerados pelo Payload fora do alcance do Prettier** — o `next dev` com o `withPayload` reescreve-os a cada recompilação, portanto formatá-los era um ciclo contra o watcher; a alternativa (Prettier a seguir ao `payload:generate`) só cobria quem corre o script à mão
- regra escrita para os dois assuntos em [conventions.md](conventions.md#finais-de-linha)

### Qualidade

- `typecheck`, `lint`, `format:check` e 236 testes verdes (237 assim que existir um módulo gerado)
- **`noUncheckedIndexedAccess` ligado** — apanha a classe de bugs que este projecto mais teve (`locales[0]`, `docs[0]`, `split('-')[0]`). Ao ser ligado apanhou um erro em produção (`getLocaleSegment`) e vinte e seis em testes
- **os vinte e seis não se fecharam com `!`** — isso era a afirmação por verificar que a flag existe para apanhar. Onde a asserção era «foi chamado com isto», passaram a matchers do Vitest, que dão melhores mensagens; onde o teste precisava do valor, um [callArg](../src/testing/callArg.ts) partilhado que diz **qual** mock não foi chamado
- **`Meta.locale` obrigatório** — era opcional e todos os mappers o preenchiam, e um tipo que permite menos do que a realidade faz é uma divergência à espera de ser resolvida na direcção errada. O único sítio que não o tinha era o fallback de 404, e aí o locale da rota é a resposta certa
- `pnpm format:check` passa — era o comando que mentia
- testes sem carregar o `payload.config.ts`
- `pnpm build` corre `lint`, `typecheck` e testes antes do `next build` — sem CI, é este o portão antes de produção
- `.env.example` na raiz

## Próximos passos

Isto é um **ponto de partida**, não um produto: cobertura de testes, framework de E2E,
sistema de tema e a estrutura do `app/` são decisões de quem monta o site, e por isso não
estão aqui. O que está é o que a foundation ainda deve a si própria.

### 1. Verificar o ciclo editorial contra o admin

O que sobra da lista, e sobra porque **exige mãos**: uma sessão de editor no admin e
escritas na base de dados. Quatro coisas construídas e nunca vistas a funcionar ponta a
ponta:

- **a invalidação da cache** — publicar uma página e confirmar que o público muda à
  primeira. Os hooks estão testados unitariamente e as entradas de cache foram
  inspeccionadas em produção, mas o ciclo completo não;
- **o Live Preview** — abrir o preview no admin com o token assinado. A lógica do token
  está testada contra a rota real; o que falta é o iframe autenticado;
- **o `is404`** — marcar uma página, visitar um caminho que não existe, e ver essa página
  em vez do `MissingNotFoundPage`;
- **os redirects** — criar uma linha e confirmar o `308` nos headers, que apagá-la devolve
  o URL antigo ao 404 à primeira, e que **mudar o slug da página apontada** actualiza o
  destino sem tocar no redirect.

O cenário que interessa para os dois primeiros é: publicado A, preview mostra B, público
continua A, publicar, público passa a B.

**O esquema já está empurrado.** A tabela `redirects` e a coluna `is404` existem na base de
dados de desenvolvimento — confirmado por leitura, com o `pnpm dev` a tê-lo feito no
arranque. Em produção continua a ser preciso uma migração.
