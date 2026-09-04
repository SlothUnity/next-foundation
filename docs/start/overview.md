# Resumo

O projecto inteiro em dez minutos. Cada secção liga ao documento que a aprofunda.

Se preferes o passeio completo e comentado, salta já para o [guide.md](../reference/guide.md) — são 3500 linhas e explicam tudo por ordem. Este documento é a versão que se lê antes de uma reunião.

---

## A ideia, em cinco linhas

Uma página não é código — é **dados**. O CMS produz um documento, um adaptador traduz esse documento para um contrato interno fixo (`PageDefinition`), e o renderer resolve cada bloco desses dados para um componente React através de um registry.

Nada no caminho de renderização sabe que CMS está por baixo. Trocar o Payload por uma API REST é escrever um adaptador, não reescrever o site.

→ [architecture.md](../reference/architecture.md)

## O mapa

```
app/ + proxy     Next.js: rotas, metadata, rascunho
     │
core/            o domínio: contratos, registry, renderer, routing
     ▲
     ├── providers/   adaptadores de CMS: payload, api, mocks
     └── modules/     componentes de conteúdo
```

**Tudo aponta para o `core`, e o `core` não aponta para ninguém.** Se um dia o `core` precisar de importar de `providers/`, é sinal de que um conceito está na camada errada.

| Camada       | Conhece                      | Não pode conhecer                   |
| ------------ | ---------------------------- | ----------------------------------- |
| `core/`      | nada além de React           | Next.js, Payload, módulos concretos |
| `providers/` | `core` + o SDK do CMS        | `app`                               |
| `modules/`   | `core`                       | providers, CMS                      |
| `app/`       | `core`, `providers`, Next.js | estrutura interna do CMS            |

→ [architecture.md](../reference/architecture.md#camadas)

## Os seis conceitos

**`PageDefinition`** — o contrato de uma página: `meta`, uma navegação opcional, uma lista de módulos, um footer opcional. É o que o renderer consome, e o único formato que o `core` conhece. → [core.md](../reference/core.md)

**`PageResponse`** — o que uma origem **responde** sobre um caminho: `ok`, `notFound` ou `redirect`. É um envelope à volta do `PageDefinition`, não um campo dentro dele — um redirect não tem página nenhuma. Substituiu um `PageDefinition | undefined` que dizia três coisas ao mesmo tempo. → [providers.md](../reference/providers.md#o-provider-diz-o-status-não-só-o-conteúdo)

**`PageSource` / `SiteSource`** — as duas classes abstractas que um provider implementa. Recebem `path` e `locale`; não conhecem Next.js. → [core.md](../reference/core.md)

**`Provider`** — o bundle de um CMS: `page`, `site`, e um `preview` opcional. Escolhido pela variável `PROVIDER`. → [providers.md](../reference/providers.md)

**`ModuleRegistry`** — o alias de um bloco resolve para um componente. Não existe lista de módulos no renderer. → [renderer.md](../reference/renderer.md)

**`Foundation`** — o que a aplicação precisa para renderizar: `modules`, `page`, `site`. Nada de CMS, nada de Next.js. → [architecture.md](../reference/architecture.md#foundation)

## Os três fluxos que interessam

**Um pedido.** `proxy` escreve o pathname num header → o layout resolve o locale e escreve o `<html lang>` → a página pergunta à origem → o renderer desdobra os módulos.

**Um 404.** Não há `notFound()`. A origem responde `notFound` com a página de erro dela, e essa página renderiza pela árvore normal. O preço é o status ser 200; em troca vem HTML servido dentro do nosso layout.

**Publicar.** Um hook `afterChange` do Payload invalida as tags de cache, e o pedido seguinte volta à base de dados. Há uma guarda para o autosave não invalidar tudo a cada tecla.

→ **[flows.md](flows.md)** — os dez fluxos, ficheiro a ficheiro

## O que surpreende

Cinco decisões que parecem erros até se ler o porquê.

**Um 404 responde 200.** Com duas raízes de route group, o `notFound()` do Next serve um shell vazio — medido. Renderizar o 404 como página normal serve HTML completo. A troca está justificada e medida em [routing.md](../reference/routing.md#o-404-é-conteúdo).

**Não há comentários no código.** O raciocínio vive aqui, nestes documentos, e não espalhado por docblocks que ninguém actualiza. As duas excepções são as âncoras `// plop:` — [conventions.md](../reference/conventions.md#comentários).

**Os redirects dão 307 e 308, não 301 e 302.** Esses exigiriam produzir a resposta no proxy, e isso custa 12× em todos os pedidos — medido.

**As tags de cache são grosseiras.** Uma tag para todas as páginas. Uma tag por página é mais eficiente e menos de confiança, porque o `nestedDocs` reescreve breadcrumbs de filhos sem garantir que os hooks deles disparem.

**O `mapApiPage` está por escrever.** De propósito: o formato é de quem desenhou a API, e um mapper genérico seria um palpite que parece funcionar — [api.md](../reference/api.md).

## Como fazer as coisas mais comuns

| Quero…                          | Faço                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| um módulo novo                  | `pnpm generate` — escreve os sete ficheiros e regista-o. → [modules.md](../reference/modules.md) |
| correr sem base de dados        | `PROVIDER=mock pnpm dev` → [providers.md](../reference/providers.md#o-provider-mock)             |
| mudar a página de 404           | marca uma página com `is404` no admin → [payload.md](../reference/payload.md#ishome-e-is404)     |
| um redirect                     | uma linha na collection `Redirects` → [payload.md](../reference/payload.md#redirects)            |
| ligar uma API em vez do Payload | escreve o `mapApiPage` → [api.md](../reference/api.md)                                           |
| tirar o Payload do projecto     | a receita está em [providers.md](../reference/providers.md#remover-o-payload)                    |

## Arrancar

```sh
pnpm install
cp .env.example .env.local     # PAYLOAD_SECRET, DATABASE_URL, PREVIEW_SECRET
pnpm dev
```

Sem base de dados: `PROVIDER=mock pnpm dev`.

O `pnpm build` corre `lint`, `typecheck` e os testes antes do `next build`, e é o último de três portões: o hook de pre-commit, o CI em `.github/workflows/gate.yml`, e este, que é o que o deploy corre.

→ [README.md](../../README.md)

## Onde ir a seguir

| Documento                                       | Para quê                                        |
| ----------------------------------------------- | ----------------------------------------------- |
| [flows.md](flows.md)                            | por onde passa cada pedido, ficheiro a ficheiro |
| [guide.md](../reference/guide.md)               | o passeio completo, peça a peça                 |
| [architecture.md](../reference/architecture.md) | camadas, dependências e princípios              |
| [core.md](../reference/core.md)                 | os contratos                                    |
| [providers.md](../reference/providers.md)       | como se liga uma origem de conteúdo             |
| [payload.md](../reference/payload.md)           | o CMS: collections, cache, preview              |
| [api.md](../reference/api.md)                   | o provider de API externa                       |
| [modules.md](../reference/modules.md)           | escrever e gerar módulos                        |
| [renderer.md](../reference/renderer.md)         | como um alias vira HTML                         |
| [routing.md](../reference/routing.md)           | URLs, locales, metadata, 404 e redirects        |
| [conventions.md](../reference/conventions.md)   | nomes, pastas, imports, comentários             |
