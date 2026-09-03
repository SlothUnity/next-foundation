# Next Foundation

Framework de frontend modular em Next.js. Uma página é descrita por dados, não por código: o conteúdo chega de um CMS, é traduzido para um contrato interno fixo, e renderizado por módulos registados dinamicamente.

A consequência prática: **trocar de CMS não obriga a tocar no frontend**, e adicionar um módulo de conteúdo novo não obriga a tocar no renderer.

## Ordem para ler

**Não há comentários no código deste projecto.** O raciocínio vive todo em [docs/](docs/README.md), e é por isso que a documentação é grande — ver [conventions.md § Comentários](docs/reference/conventions.md#comentários).

Está em duas vertentes, e a diferença não é o assunto: é a pergunta que respondem.

### Vertente 1 — para começar

Três peças, por esta ordem, de seguida. **Duas horas**, e sais com o site a correr e com o percurso de um pedido na cabeça.

| #   | Lê                                    | Sais com                                                         |
| --- | ------------------------------------- | ---------------------------------------------------------------- |
| 1   | [overview.md](docs/start/overview.md) | o que é isto, as peças, e o que te vai surpreender — dez minutos |
| 2   | **este README**, até ao fim           | o tipo de projecto escolhido, o site de pé, e o mapa do `src/`   |
| 3   | [flows.md](docs/start/flows.md)       | por onde passa um pedido, um 404, um redirect e uma publicação   |

Se só tiveres dez minutos, faz o 1. Se tiveres uma tarde, faz os três.

### Vertente 2 — para consultar

Não se lê de seguida. Cada documento cobre um assunto por inteiro, e é onde voltas quando vais mexer nele — o índice está em [docs/README.md](docs/README.md).

| Vais mexer em                      | Vai a                                             |
| ---------------------------------- | ------------------------------------------------- |
| camadas e dependências             | [architecture.md](docs/reference/architecture.md) |
| contratos entre camadas            | [core.md](docs/reference/core.md)                 |
| módulos de conteúdo                | [modules.md](docs/reference/modules.md)           |
| o que o renderer garante           | [renderer.md](docs/reference/renderer.md)         |
| URLs, locales, metadata, SEO       | [routing.md](docs/reference/routing.md)           |
| a origem do conteúdo               | [providers.md](docs/reference/providers.md)       |
| o CMS                              | [payload.md](docs/reference/payload.md)           |
| uma API externa                    | [api.md](docs/reference/api.md)                   |
| onde pôr e como nomear um ficheiro | [conventions.md](docs/reference/conventions.md)   |

E o [guide.md](docs/reference/guide.md): 3500 linhas, o projecto inteiro ficheiro a ficheiro, com o porquê de cada linha. É a versão completa de tudo o que está na tabela acima, e lê-se com o editor aberto ao lado.

### Atalhos, se já conheces o projeto

| Vais fazer                     | Vai a                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| perceber onde algo corre       | [flows.md](docs/start/flows.md)                                                       |
| um módulo de conteúdo novo     | `pnpm generate` — e [modules.md](docs/reference/modules.md) para perceber o que gerou |
| ligar outro CMS                | [providers.md](docs/reference/providers.md)                                           |
| ligar uma API externa          | [api.md](docs/reference/api.md)                                                       |
| mexer em collections ou campos | [payload.md](docs/reference/payload.md)                                               |
| mexer em URLs ou idiomas       | [routing.md](docs/reference/routing.md)                                               |
| páginas de teste sem CMS       | [providers.md § Escrever uma página](docs/reference/providers.md#escrever-uma-página) |

## Arrancar

### Experimentar, antes de escolher

A forma mais rápida de ver o site a funcionar **não precisa de base de dados nenhuma**:

```bash
pnpm install
PROVIDER=mock pnpm dev
```

O provider `mocks` serve páginas escritas à mão em [src/providers/mocks/pages/](src/providers/mocks/pages), em português e inglês. Abre `/` e `/en`.

### Escolher o tipo de projecto

Esta foundation traz **três** providers montados, e um projecto real usa um. O primeiro passo num projecto novo é dizer qual:

```bash
pnpm setup:provider
```

Pergunta qual dos três é (`payload`, `api` ou `mock`) e **apaga o que não é preciso**: os outros dois providers, e — se o Payload sair — o `payload.config.ts`, o `src/app/(payload)/`, as rotas de preview, as sete dependências, os scripts `payload:*`, o `withPayload`, os caminhos `@payload-*` e o documento do provider removido. Com um provider só, a variável `PROVIDER` e o `createProvider` deixam de fazer sentido e saem também.

Chama-se `setup:provider` e não `setup` porque **`pnpm setup` é um comando do próprio pnpm** — um script com esse nome ficaria à sombra dele.

Três coisas que vale saber antes de correr:

- **recusa arrancar com alterações não commitadas**, para tudo o que ele faz caber num só `git diff` legível. `pnpm setup:provider --dry-run` imprime o plano sem tocar em nada;
- **para quando não reconhece um ficheiro.** Cada operação falha em voz alta se a âncora que espera não estiver lá, em vez de editar à sorte. Se personalizaste algum destes ficheiros, o comando pára e diz qual;
- **apaga-se a si mesmo no fim.** Um comando destes esquecido dentro de um projecto de cliente é uma armadilha. `--keep` para o manter.

No fim lista as referências em prosa que ficaram a apontar para o documento apagado. São frases, não linhas de tabela, portanto quem as lê é uma pessoa e não um script.

Com o Payload e o Postgres:

```bash
pnpm dev:payload     # primeira vez, ou depois de mexer na config do Payload
pnpm dev             # nas restantes
```

Há dois pontos de entrada, e a diferença importa:

- **`pnpm dev`** corre `lint` e `typecheck` antes do `next dev`. Falha cedo se o código estiver quebrado, mas **não** regenera os artefactos do Payload.
- **`pnpm dev:payload`** corre o `generate:payload` primeiro e só depois entra no `dev`. É o que precisas quando a config do Payload mudou.

Se alterares uma collection e arrancares com `pnpm dev`, os tipos gerados ficam desactualizados e o `typecheck` pode passar sobre um `payload-types.ts` antigo.

### Variáveis de ambiente

Copia o [.env.example](.env.example) para `.env.local` e preenche. O `DATABASE_URL` e o `PAYLOAD_SECRET` são obrigatórios: em falta, a aplicação **não arranca** — configuração em falta deve falhar, não degradar em silêncio.

`.env.local`:

```
PROVIDER=payload                            # payload | api | mock
DATABASE_URL=postgres://…
PAYLOAD_SECRET=…
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
PREVIEW_SECRET=…

API_URL=https://cms.exemplo.pt/api          # só com PROVIDER=api
API_TOKEN=…                                 # opcional
API_REVALIDATE=60                           # opcional, segundos, 60 por omissão
```

### Quem fornece a base de dados

**A foundation não traz `Dockerfile` nem `docker-compose.yml`, e é decisão e não esquecimento.**

Num projecto `payload`, o Postgres é do **Supabase** e quem monta o projecto configura-o junto com o Payload — é a equipa interna, e a montagem faz parte do que ela já sabe fazer. Um `docker-compose` local seria um segundo caminho a manter, com um Postgres de versão diferente da que serve o site, e a divergir do primeiro em silêncio.

Num projecto `api`, não há base de dados nenhuma deste lado: o conteúdo vem de uma API que **outra equipa entrega**. O que este repositório precisa de saber está no `API_URL`, e o que precisa de traduzir está no [mapApiPage](docs/reference/api.md).

Num projecto `mock` não há nada a configurar: as páginas estão no repositório.

Portanto os pré-requisitos por escolha são estes, e só estes:

| Provider  | Precisa de                                  |
| --------- | ------------------------------------------- |
| `payload` | um Postgres (Supabase) e as variáveis acima |
| `api`     | um `API_URL` que responda                   |
| `mock`    | nada                                        |

O `NEXT_PUBLIC_SERVER_URL` **não pode ter barra final** — é usado como `targetOrigin` de `postMessage` no Live Preview, e a comparação é de string exacta. Com `PROVIDER=payload` é **obrigatório**: o Payload valida com ele a origem dos pedidos ao admin, e o default anterior (`http://localhost:3000`) fazia um deploy sem a variável rejeitar o host verdadeiro em vez de o aceitar.

## O mapa do `src/`

```
src/
├── proxy.ts          expõe o pathname num header, e mais nada
├── app/              Next: rotas, metadata, boundaries
├── core/             o domínio. Não conhece Next, nem CMS, nem módulos concretos
├── modules/          os componentes de conteúdo
└── providers/        os adaptadores de CMS

generator/            templates do `pnpm generate` (Plop)
docs/                 a documentação
```

A direcção das dependências é a regra mais importante do projeto:

| Camada       | Conhece                      | Não pode conhecer                   |
| ------------ | ---------------------------- | ----------------------------------- |
| `core/`      | nada além de React           | Next.js, Payload, módulos concretos |
| `providers/` | `core` + o SDK do CMS        | `app`                               |
| `modules/`   | `core`                       | providers, CMS                      |
| `app/`       | `core`, `providers`, Next.js | estrutura interna do CMS            |

Duas regras de pastas que evitam a maior parte das dúvidas:

- **Dentro de `app/` só ficheiros de rota.** O resto vai para `_lib/`, que o prefixo `_` tira do router. O que é puro e não depende do Next sai de `app/` de vez.
- **Um módulo é uma pasta em `modules/`** com o componente, o schema, os tipos, os estilos, o teste e o registo. Acrescentar um não obriga a tocar no renderer — e o `pnpm generate` escreve-o todo, incluindo o bloco correspondente no Payload.

## Scripts

| Script                      | O que faz                                                    |
| --------------------------- | ------------------------------------------------------------ |
| `pnpm dev`                  | `lint` + `typecheck` e arranca o Next                        |
| `pnpm dev:payload`          | `generate:payload` e depois o `dev`                          |
| `pnpm build` / `pnpm start` | `lint` + `typecheck` + testes + build / servidor de produção |
| `pnpm typecheck`            | `tsc --noEmit`                                               |
| `pnpm lint`                 | eslint                                                       |
| `pnpm test`                 | vitest (em watch; `pnpm test --run` corre uma vez)           |
| `pnpm format`               | prettier em toda a árvore                                    |
| `pnpm format:check`         | verifica sem escrever                                        |
| `pnpm generate`             | gera um módulo novo, com bloco do Payload incluído (Plop)    |
| `pnpm setup:provider`       | escolhe o provider do projecto e apaga os outros dois        |
| `pnpm generate:payload`     | `generate:types` + `generate:importMap`                      |

Corre `pnpm generate:payload` (ou arranca com `pnpm dev:payload`) sempre que mudares collections, globals, campos ou o caminho de um componente de admin.

## Verificações automáticas

| Momento                                             | O que corre                                                 |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                                          | `lint`, `typecheck`                                         |
| pre-commit ([.husky/pre-commit](.husky/pre-commit)) | `lint-staged` (prettier), `lint`, `typecheck`, `test --run` |
| `pnpm build`                                        | `lint`, `typecheck`, `test --run`, e depois `next build`    |

O commit é a barreira completa: nada entra no histórico sem passar eslint, TypeScript e a suite de testes. O `pnpm dev` fica com a versão rápida — lint e typecheck, sem testes — para não atrasar o arranque do servidor.

A ordem no hook é do mais barato para o mais caro, para falhar cedo:

```sh
pnpm lint-staged
pnpm lint
pnpm typecheck
pnpm test --run
```

**O `build` é o portão real.** Não há CI neste repositório e o deploy vai para o Vercel; como um `git commit --no-verify` contorna o hook por inteiro, o `pnpm build` corre as verificações explicitamente antes do `next build`. Nada chega a produção sem as passar. O preço são alguns segundos por deploy.

## Todos os documentos

| Documento                                         | Responde a                                                 |
| ------------------------------------------------- | ---------------------------------------------------------- |
| [overview.md](docs/start/overview.md)             | O projecto inteiro em dez minutos                          |
| [flows.md](docs/start/flows.md)                   | Por onde passa cada pedido, ficheiro a ficheiro            |
| [guide.md](docs/reference/guide.md)               | Porque é que cada peça está como está, ficheiro a ficheiro |
| [architecture.md](docs/reference/architecture.md) | Como está organizado e porquê                              |
| [conventions.md](docs/reference/conventions.md)   | Onde ponho um ficheiro novo e como o nomeio                |
| [core.md](docs/reference/core.md)                 | Quais são os contratos internos                            |
| [modules.md](docs/reference/modules.md)           | Como crio um módulo de conteúdo                            |
| [renderer.md](docs/reference/renderer.md)         | Como funciona a renderização e os erros                    |
| [providers.md](docs/reference/providers.md)       | Como ligo outro CMS                                        |
| [payload.md](docs/reference/payload.md)           | Como está configurado o Payload                            |
| [api.md](docs/reference/api.md)                   | Como ligo uma API externa                                  |
| [routing.md](docs/reference/routing.md)           | Como funcionam URLs, locales e metadata                    |

## Stack

Next.js 16 (App Router, React 19, React Compiler) · Payload CMS 3 · PostgreSQL · TypeScript strict · Zod · Vitest
