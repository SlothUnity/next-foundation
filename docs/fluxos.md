# Fluxos

Por onde passa cada pedido, ficheiro a ficheiro.

A [architecture.md](architecture.md) diz **como as camadas se relacionam**. Este documento diz **o que acontece**, na ordem em que acontece, com o ficheiro de cada passo. É o mapa que se abre quando algo falha e não se sabe onde pôr o `console.log`.

Para o porquê de cada decisão, cada passo liga ao documento que a explica. Para o passeio completo e comentado, [guia.md](guia.md).

## Índice

| Fluxo                                                          | Quando corre                        |
| -------------------------------------------------------------- | ----------------------------------- |
| [1. Um pedido público](#1-um-pedido-público)                   | qualquer URL do site                |
| [2. O 404](#2-o-404)                                           | nenhum caminho encaixa              |
| [3. Um redirect](#3-um-redirect)                               | o caminho mudou de sítio            |
| [4. Entrar em pré-visualização](#4-entrar-em-pré-visualização) | o editor abre o preview no admin    |
| [5. Renderizar um rascunho](#5-renderizar-um-rascunho)         | qualquer pedido com o modo rascunho |
| [6. Sair da pré-visualização](#6-sair-da-pré-visualização)     | o editor fecha o preview            |
| [7. Publicar](#7-publicar)                                     | o editor grava no admin             |
| [8. Arranque](#8-arranque)                                     | o primeiro import do processo       |
| [9. Do alias ao HTML](#9-do-alias-ao-html)                     | por cada bloco de cada página       |
| [10. Criar um módulo](#10-criar-um-módulo)                     | `pnpm generate`                     |

Notação: `→` é uma chamada, `⇢` é uma leitura de cache, `✗` é uma saída.

---

## 1. Um pedido público

O caminho feliz. Um visitante pede `/en/servicos/consultoria`.

```
GET /en/servicos/consultoria
  │
  ├─ 1  proxy.ts
  │       escreve o pathname no header x-pathname
  │
  ├─ 2  app/(frontend)/layout.tsx
  │       draftMode()               → false
  │       resolveSite()             → SiteDefinition
  │       headers()                 → x-pathname
  │       resolveRoute(...)         → locale
  │       <html lang="en-GB">
  │
  ├─ 3  app/(frontend)/[[...segments]]/generateMetadata
  │       resolvePage(segments) ─┐
  │                              │ uma execução partilhada,
  ├─ 4  .../page.tsx  Page       │ pelo cache() do React
  │       resolvePage(segments) ─┘
  │
  ├─ 5  _lib/resolvePage.ts
  │       resolveSite()            ⇢ já quente: o layout pediu-o
  │       resolveRoute(...)         → { locale: 'en-GB', path: 'servicos/consultoria' }
  │       foundation.page.getPage(path, locale, { draft: false })
  │
  ├─ 6  PayloadPageSource.getPage
  │       isSupportedLocale('en-GB')          ✓
  │       resolveRedirect(path, locale)       → nenhum
  │       getCachedPage(path, locale)        ⇢
  │
  ├─ 7  loadPayloadPage  (só em falha de cache)
  │       resolvePayloadPage(...)   → documento do Payload
  │       mapPayloadPage(...)       → PageDefinition
  │       → { status: 'ok', page }
  │
  ├─ 8  PageRenderer
  │       <nav> <main> <footer>
  │
  └─ 9  ModuleRenderer, por instância
          registry.getByAlias(alias)
          schema.parse(data)
          <Componente />                      → HTML
```

### Passo a passo

| #   | Ficheiro                                                                      | O que faz                                                                  |
| --- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | [src/proxy.ts](../src/proxy.ts)                                               | expõe o pathname num header. Não reescreve nem redirecciona                |
| 2   | [layout.tsx](<../src/app/(frontend)/layout.tsx>)                              | o `<html lang>` e o `<body>`; monta o preview se o rascunho estiver ligado |
| 3   | [page.tsx](<../src/app/(frontend)/[[...segments]]/page.tsx>)                  | `generateMetadata`                                                         |
| 4   | o mesmo ficheiro                                                              | o componente de página                                                     |
| 5   | [\_lib/resolvePage.ts](<../src/app/(frontend)/_lib/resolvePage.ts>)           | traduz segmentos em `{ locale, path }` e pergunta à origem                 |
| 6   | [PayloadPageSource.ts](../src/providers/payload/sources/PayloadPageSource.ts) | decide entre redirect, cache e rascunho                                    |
| 7   | [loadPayloadPage.ts](../src/providers/payload/sources/loadPayloadPage.ts)     | consulta e mapeia                                                          |
| 8   | [PageRenderer](../src/core/renderer/)                                         | as três regiões                                                            |
| 9   | [ModuleRenderer](../src/core/renderer/ModuleRenderer.tsx)                     | alias → componente, com validação                                          |

### O que decide o quê

- **O `x-pathname` existe porque o layout não recebe `params`.** É a única forma de o layout saber em que URL está sem o duplicar na rota — [routing.md](routing.md#o-proxy).
- **O `resolvePage` é chamado duas vezes e corre uma.** O `cache()` do React deduplica dentro do pedido, e a chave é normalizada com `join('/')` porque o React compara argumentos por identidade — [guia.md](guia.md#22-o-que-o-cache-garante--e-o-que-não-garante).
- **O redirect é consultado antes da página.** Custa uma leitura de cache, não uma consulta — [payload.md](payload.md#redirects).
- **Não há uma única página estática.** O layout chama `draftMode()` e `headers()`, e qualquer um retira a rota da geração estática — [routing.md](routing.md#o-frontend-é-ssr).

### Onde costuma falhar

| Sintoma                           | Suspeito                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| o site inteiro dá 404             | `enabledLocales` vazio no global `Site`                                               |
| uma página que existe dá 404      | `breadcrumbs.url` diferente do esperado, ou `_status` ainda em rascunho               |
| o módulo não aparece              | o `alias` não bate com o `slug` do bloco, ou falta o export em `src/modules/index.ts` |
| conteúdo velho depois de publicar | a cache não foi invalidada — ver o [fluxo 7](#7-publicar)                             |

---

## 2. O 404

**Não há `notFound()` neste projecto.** O 404 é conteúdo que a origem devolve, e renderiza pela árvore normal.

```
GET /caminho-que-nao-existe
  │
  ├─ 1..6  igual ao fluxo 1, até ao getPage
  │
  ├─ 7  loadPayloadPage
  │       resolvePayloadPage(...)            → undefined
  │       resolvePayloadNotFoundPage(...)     ← a segunda consulta, só aqui
  │         where: { is404: true, _status: 'published' }
  │
  │       ├─ encontrou  → { status: 'notFound', page }
  │       └─ não        → { status: 'notFound' }        sem page
  │
  ├─ 8  generateMetadata
  │       noIndex = true                      forçado, não deixado ao editor
  │       locale  = o da rota                 não há meta de onde o tirar
  │
  └─ 9  page.tsx
          com page  → <PageRenderer>          o mesmo caminho do fluxo 1
          sem page  → <MissingNotFoundPage>   ✗ aviso no log
```

### O que decide o quê

- **A segunda consulta só corre no caminho de falha.** Uma página que existe continua a custar uma — [payload.md](payload.md#sources).
- **O `_status: 'published'` vale para a página de erro como para as outras.** Um 404 por publicar aparecia a toda a gente sem ninguém o ter publicado.
- **O status HTTP é 200, e é uma troca deliberada.** Em troca vem HTML servido dentro do nosso layout, em vez do shell vazio que o `notFound()` produz neste projecto. A medição está em [routing.md](routing.md#o-404-é-conteúdo).
- **O `MissingNotFoundPage` não é a página de erro do site** — é o aviso de que ela não existe. Vive em [\_components/](<../src/app/(frontend)/_components/MissingNotFoundPage.tsx>).

### Por provider

| Provider  | De onde vem a página de erro                                              |
| --------- | ------------------------------------------------------------------------- |
| `payload` | a página marcada com `is404` na collection `Pages`                        |
| `mocks`   | [pages/notFound.ts](../src/providers/mocks/pages/notFound.ts), por idioma |
| `api`     | nenhuma — costura por ligar, ver [api.md](api.md)                         |

---

## 3. Um redirect

```
GET /pagina-antiga
  │
  ├─ 1..5  igual ao fluxo 1
  │
  ├─ 6  PayloadPageSource.getPage
  │       options.draft?  não  →  segue
  │       resolveRedirect(path, locale)
  │         getCachedSite()                  ⇢ para o defaultLocale
  │         getCachedRedirects(locale, defaultLocale)  ⇢ o mapa inteiro
  │         mapa['pagina-antiga']            → { to, permanent }
  │       → { status: 'redirect', to, permanent }
  │
  └─ 7  page.tsx
          permanent  → permanentRedirect(to)   ✗ 308
          senão      → redirect(to)            ✗ 307
```

### Como o mapa se constrói

Corre uma vez por idioma, em falha de cache. **Duas consultas para o site inteiro:**

```
loadPayloadRedirects(locale, defaultLocale)
  │
  ├─ find('redirects', { depth: 0 })              ids, não documentos
  │
  ├─ resolveTargets(ids)                          só se houver referências
  │    find('pages', {
  │      where: { id: { in: [...] }, _status: 'published' },
  │      depth: 0,
  │      select: { breadcrumbs: true },
  │    })
  │    último breadcrumb → createPagePath()       → /en/about-us
  │
  └─ { 'pagina-antiga': { to: '/en/about-us', permanent: true } }
```

### O que decide o quê

- **O redirect ganha à página.** É o que permite substituir um URL sem apagar o conteúdo que estava nele.
- **A tabela vem inteira, como mapa, numa entrada de cache por idioma.** Por caminho, seria uma entrada por URL do site e uma consulta a frio em cada um.
- **O destino é uma referência a documento, não um caminho escrito.** Um caminho à mão apodrece quando o `nestedDocs` reescreve o slug — [payload.md](payload.md#o-destino-é-uma-referência-não-um-caminho).
- **São 307 e 308, não 301 e 302.** Esses exigiriam produzir a resposta no proxy — [routing.md](routing.md#redirects).
- **Em modo rascunho não se olha para os redirects** — ver o [fluxo 5](#5-renderizar-um-rascunho).

---

## 4. Entrar em pré-visualização

O editor carrega no botão de preview dentro do admin.

```
o admin monta o URL
  │
  ├─ 1  Pages.admin.livePreview.url
  │       PREVIEW_SECRET em falta?  → undefined  ✗ o separador não aparece,
  │                                               com um erro no log
  │       findGlobal('site')  → mapPayloadSite  → defaultLocale
  │       getLivePreviewUrl({ breadcrumbs, locale, defaultLocale, previewSecret })
  │         createPagePath(...)        → /en/about-us
  │         createPreviewToken(path)   → HMAC-SHA256, uma hora
  │       → /next/preview?path=/en/about-us&token=…
  │
  ├─ 2  o iframe pede esse URL
  │
  └─ 3  app/(frontend)/next/preview/route.ts   GET
          PREVIEW_SECRET em falta?     ✗ 503
          isSafeRedirectPath(path)?    ✗ 400
          verifyPreviewToken(...)
            'expired'                  ✗ 403  «recarrega o admin»
            'invalid'                  ✗ 403
          payload.auth(headers)
            sem user                   ✗ 401
          draftMode().enable()
          redirect(path)               → o fluxo 5
```

### O que decide o quê

- **O segredo assina, não viaja.** O URL leva um token HMAC preso ao caminho e com uma hora de validade — [payload.md](payload.md#o-segredo-não-viaja).
- **Expirado e forjado são respostas diferentes.** Um link velho é uma vista de edição aberta há muito tempo, não um ataque; dizê-lo poupa uma investigação.
- **O `isSafeRedirectPath` fecha o open redirect.** Sem ele, `?path=https://sitemau.com` transformava esta rota numa máquina de phishing — [routing.md](routing.md#issaferedirectpath).
- **A autenticação vem depois do token, e as duas são precisas.** O token prova que o link foi gerado pelo servidor; o `payload.auth` prova que quem o abre é um editor.

---

## 5. Renderizar um rascunho

Igual ao fluxo 1, com três desvios.

```
GET /en/about-us   (com o cookie de rascunho)
  │
  ├─ 2  layout.tsx
  │       draftMode()  → true
  │       monta <PayloadLivePreview />        no fim do <body>
  │
  ├─ 5  resolvePage
  │       getPage(path, locale, { draft: true })
  │
  ├─ 6  PayloadPageSource.getPage
  │       options.draft  → loadPayloadPage(path, locale, true)   ✗ sai já
  │         ↑ nem cache, nem redirects
  │
  └─ 7  loadPayloadPage(draft: true)
          where sem _status  → o rascunho do editor
```

### O que decide o quê

- **O rascunho nunca entra na cache.** O `getCachedPage` tem o `draft` fixo em `false`, portanto não há forma de lá chegar por engano — o argumento não existe na assinatura.
- **O rascunho também não olha para os redirects.** O editor pediu **aquele** documento; um redirect a apanhar o caminho dele partia a pré-visualização da página que ele está a escrever.
- **O `PayloadLivePreview` atira se faltar o `NEXT_PUBLIC_SERVER_URL`**, em vez de passar `''` e falhar a validação de origem em silêncio.
- **O refresh é da rota inteira**, não um patch de campos: com autosave a 375ms é praticamente indistinguível, e mantém a renderização no servidor.

---

## 6. Sair da pré-visualização

```
POST /next/exit-preview
  │
  └─ draftMode().disable()   → 200

GET  /next/exit-preview      ✗ 405, com Allow: POST
```

**Só por `POST`, e é uma decisão de segurança.** Desligar o modo rascunho muda estado, e um `GET` anónimo era accionável por qualquer `<img src>` de terceiros — CSRF.

---

## 7. Publicar

O único caminho em que o CMS fala com a cache do Next.

```
o editor carrega em Publish
  │
  ├─ Pages.hooks.afterChange   →  revalidatePagesOnChange
  │     touchesPublished(doc, previousDoc)?
  │       não  ✗ nada acontece          ← a guarda do autosave
  │       sim  → revalidatePages()
  │                revalidatePayloadTag(PAGES_TAG)
  │                revalidatePayloadTag(REDIRECTS_TAG)   ← e esta não é excesso de zelo
  │
  ├─ revalidatePayloadTag(tag)
  │     revalidateTag(tag, { expire: 0 })
  │     erro E263?  → engolido       ← o hook correu fora do Next
  │
  └─ o pedido seguinte volta ao Postgres
```

### As três tags

| Tag                 | Cobre               | Invalidada por                                  |
| ------------------- | ------------------- | ----------------------------------------------- |
| `payload:pages`     | todas as páginas    | gravar ou apagar uma página **publicada**       |
| `payload:redirects` | o mapa de redirects | gravar ou apagar um redirect — **e** uma página |
| `payload:site`      | o global `Site`     | gravar o global                                 |

### O que decide o quê

- **A guarda do autosave.** Sem ela, o autosave a 375ms invalidava a cache do site a cada tecla que um editor escrevesse. O `previousDoc` conta tanto como o `doc`, por causa do despublicar.
- **Uma página invalida as duas tags.** O destino de um redirect por referência é o URL de uma página; mudar o slug dessa página deixava o mapa a apontar para um URL que já não existe. O contrário não é verdade.
- **`{ expire: 0 }` e não `'max'`.** O `'max'` serve o conteúdo antigo enquanto revalida em fundo — errado para um CMS: quem carrega em publicar veria a página velha à primeira.
- **O `E263` é engolido, e só ele.** Um script de seed ou o CLI do Payload chamam o mesmo `afterChange` fora do Next, onde não há cache para invalidar.
- **As tags são grosseiras de propósito.** Uma tag por página não é de confiança: o `nestedDocs` reescreve breadcrumbs de filhos sem garantia de que o `afterChange` de cada um dispare — [payload.md](payload.md#invalidação).

---

## 8. Arranque

O que acontece no primeiro import, antes de qualquer pedido.

```
import { foundation } from '@/core/foundation/foundation'
  │
  ├─ core/foundation/foundation.ts
  │     import { provider } from '@/providers/provider'
  │       │
  │       └─ providers/provider.ts
  │            createProvider()
  │              PROVIDER = 'payload' | 'api' | 'mock'
  │              desconhecido  ✗ atira, em vez de cair no default
  │
  ├─ createFoundation({ page, site })
  │     new ModuleRegistry()
  │     registerModules(registry)
  │       varre o que src/modules/index.ts exporta
  │
  └─ foundation  { modules, page, site }
```

### O que decide o quê

- **O singleton está fora do barrel.** Importar `foundation.ts` põe a aplicação de pé — incluindo o Payload. Enquanto estava no barrel, os testes do renderer carregavam o `payload.config.ts` só por importarem `createFoundation` — [architecture.md](architecture.md#6-os-barrels-não-podem-ter-efeitos-secundários).
- **O `payload.config.ts` é importado dinamicamente** pelo [getPayloadClient](../src/providers/payload/getPayloadClient.ts), para não ser avaliado com `PROVIDER=mock`. É o que permite correr o site sem base de dados.
- **Um `PROVIDER` desconhecido derruba o arranque.** Cair no default deixava alguém a perguntar-se porque é que o site mostra dados de teste.
- **O `requireEnv` derruba o arranque quando falta configuração obrigatória.** Um `|| ''` num segredo de assinatura produz tokens forjáveis sem um único aviso.

---

## 9. Do alias ao HTML

Corre uma vez por bloco, por página.

```
ModuleInstance  { id, name, alias, data }
  │
  ├─ registry.getByAlias(alias)
  │     não registado  ✗ ModuleErrorFallback
  │
  ├─ module.schema
  │     ausente?  → aviso em desenvolvimento, e o data passa por validar
  │
  ├─ schema.parse(data)
  │     falha  → dev:  atira, para se ver
  │              prod: ModuleErrorFallback, para não derrubar a página
  │
  └─ <Componente {...props} key={id} />
```

### O que decide o quê

- **O `alias` é a única ligação entre o CMS e o frontend.** É o `blockType` do Payload de um lado e o `alias` do módulo do outro; o gerador escreve os dois a partir do mesmo nome, para coincidirem por construção.
- **A validação é uma fronteira de runtime.** O TypeScript garante tipos em desenvolvimento; o schema valida os dados reais que vêm do CMS. São problemas diferentes.
- **Sem schema não há validação nenhuma**, e o cast do `createModuleComponent` passa a ser uma afirmação sem nada por trás. Daí o aviso em desenvolvimento.
- **O `id` tem de ser único dentro da página.** Nos mocks é derivado do alias e da posição, porque dois `hero-1` colados por copy-paste davam uma key repetida em React, que falha em silêncio.

Detalhe completo em [renderer.md](renderer.md).

---

## 10. Criar um módulo

```
pnpm generate
  │
  ├─ nome do módulo: "Cta"
  │
  ├─ sete ficheiros em src/modules/Cta/
  │     Cta.tsx  .schema.ts  .types.ts  .module.ts  .style.scss  .test.tsx  index.ts
  │
  ├─ append em src/modules/index.ts
  │     export { ctaModule } from './Cta';
  │
  └─ existe src/providers/payload/blocks/index.ts ?
        não  ✗ só o módulo, com uma nota a dizê-lo
        sim  → CtaBlock.ts
               append na âncora // plop: import
               append na âncora // plop: block
               nota: falta correr pnpm payload:generate
```

### O que decide o quê

- **O bloco só é escrito se o provider payload existir.** Uma foundation servida por `api` ou `mocks` pode ter apagado `src/providers/payload/` inteiro, e aí um bloco não teria onde viver. O gerador testa o `index.ts` e não só a pasta, porque é nele que as âncoras vivem.
- **As âncoras `// plop:` são os dois únicos comentários funcionais do projecto.** Existem porque aqui são precisas duas inserções no mesmo ficheiro — o import e a entrada no array — e um append cego só sabe escrever no fim. **Não as apagues.**
- **O append em `src/modules/index.ts` leva `separator: ''` e uma quebra de linha no fim.** O append por omissão deixava o ficheiro sem newline final, e o `format:check` reprova-o.
- **Os templates estão no `.prettierignore`.** O parser de handlebars do Prettier reescreve os `.hbs` e destrói a indentação do código que eles geram.
- **O código gerado passa `typecheck`, `lint` e o teste que ele próprio escreve**, sem se tocar em nada.

Receita completa em [modules.md](modules.md).

---

## Onde cada provider entra

Todos os fluxos acima passam pelo mesmo ponto — `foundation.page.getPage(path, locale, options)` — e é aí que o provider decide.

| Passo               | `payload`                                | `api`                           | `mocks`                         |
| ------------------- | ---------------------------------------- | ------------------------------- | ------------------------------- |
| resolver o locale   | `locales.ts` + global `Site`             | configuração                    | `mockSite`                      |
| redirect            | collection `Redirects`, em mapa guardado | não implementado                | lista à mão                     |
| página              | Local API, `_status: 'published'`        | `fetch` ao `API_URL`            | procura na lista                |
| 404                 | página com `is404`                       | não implementado                | `notFound.ts` por idioma        |
| mapeamento          | `mapPayloadPage`                         | `mapApiPage` — **por escrever** | nenhum: já são `PageDefinition` |
| cache entre pedidos | `unstable_cache` + tags                  | `next.revalidate` + tags        | nenhuma                         |

O `mapApiPage` fica por escrever de propósito: o formato é de quem desenhou a API, e um mapper genérico seria um palpite que parece funcionar — [api.md](api.md).
