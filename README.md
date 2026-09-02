# Next Foundation

Framework de frontend modular em Next.js. Uma página é descrita por dados, não por código: o conteúdo chega de um CMS, é traduzido para um contrato interno fixo, e renderizado por módulos registados dinamicamente.

A consequência prática: **trocar de CMS não obriga a tocar no frontend**, e adicionar um módulo de conteúdo novo não obriga a tocar no renderer.

## Ordem para ler

**Não há comentários no código deste projecto.** O raciocínio vive todo em `docs/`, e é por isso que a documentação é grande — ver [conventions.md § Comentários](docs/conventions.md#comentários).

Há três portas de entrada, conforme o tempo que tens:

| Tens…      | Lê                                        | Sais com                                              |
| ---------- | ----------------------------------------- | ----------------------------------------------------- |
| 10 minutos | [resumo.md](docs/resumo.md)               | a ideia, o mapa, e o que surpreende                   |
| uma hora   | este README + [fluxos.md](docs/fluxos.md) | o site a correr, e por onde passa cada pedido         |
| uma semana | [guia.md](docs/guia.md)                   | tudo, ficheiro a ficheiro, com o porquê de cada linha |

Se é a primeira vez e queres o percurso completo, esta é a ordem. Cada passo assume o anterior.

| #   | Lê                                                              | Para saíres com                                                                                                         |
| --- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | [resumo.md](docs/resumo.md)                                     | a ideia inteira em dez minutos, e os nomes das peças                                                                    |
| 2   | **este README**, até ao fim                                     | o site a correr com `PROVIDER=mock`, e o mapa do `src/` na cabeça                                                       |
| 3   | [fluxos.md](docs/fluxos.md)                                     | por onde passa um pedido, um 404, um redirect e uma publicação — ficheiro a ficheiro                                    |
| 4   | [guia.md](docs/guia.md), **Cap. 0 a 3**                         | o vocabulário (classes abstratas, generics, singletons, RSC) e o percurso de um pedido do URL até ao `{ locale, path }` |
| 5   | [architecture.md](docs/architecture.md)                         | as camadas e a regra que as governa: tudo aponta para o `core`, e o `core` não aponta para ninguém                      |
| 6   | [core.md](docs/core.md)                                         | os contratos — `PageSource`, `SiteSource`, `PageDefinition`, `Module`. É o vocabulário que o resto do projeto fala      |
| 7   | [modules.md](docs/modules.md) + [renderer.md](docs/renderer.md) | como um bloco do CMS vira um componente React, e o que acontece quando corre mal                                        |
| 8   | [providers.md](docs/providers.md)                               | como a fonte de conteúdo se troca, e porque é que o locale por omissão é uma resposta do provider                       |
| 9   | [routing.md](docs/routing.md)                                   | URLs, locales, metadata, o `proxy`, e porque é que o frontend é SSR                                                     |
| 10  | [conventions.md](docs/conventions.md)                           | onde pôr um ficheiro novo e como o nomear. **Lê antes de escreveres o primeiro**                                        |
| 11  | [TODO.md](docs/TODO.md)                                         | o que está feito, o que falta, e o que está decidido mas por correr                                                     |

O [guia.md](docs/guia.md) tem 3500 linhas e percorre o projeto ficheiro a ficheiro, com o editor aberto ao lado. Os passos 5 a 10 são documentação de referência — cobrem o mesmo terreno em resumo, e são onde voltas depois. Se só tiveres uma tarde, faz 1, 2 e 3.

### Atalhos, se já conheces o projeto

| Vais fazer                     | Vai a                                                                       |
| ------------------------------ | --------------------------------------------------------------------------- |
| perceber onde algo corre       | [fluxos.md](docs/fluxos.md)                                                 |
| um módulo de conteúdo novo     | `pnpm generate` — e [modules.md](docs/modules.md) para perceber o que gerou |
| ligar outro CMS                | [providers.md](docs/providers.md)                                           |
| ligar uma API externa          | [api.md](docs/api.md)                                                       |
| mexer em collections ou campos | [payload.md](docs/payload.md)                                               |
| mexer em URLs ou idiomas       | [routing.md](docs/routing.md)                                               |
| páginas de teste sem CMS       | [providers.md § Escrever uma página](docs/providers.md#escrever-uma-página) |

## Arrancar

A forma mais rápida de ver o site a funcionar **não precisa de base de dados nenhuma**:

```bash
pnpm install
PROVIDER=mock pnpm dev
```

O provider `mocks` serve páginas escritas à mão em [src/providers/mocks/pages/](src/providers/mocks/pages/), em português e inglês. Abre `/` e `/en`.

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

O `NEXT_PUBLIC_SERVER_URL` **não pode ter barra final** — é usado como `targetOrigin` de `postMessage` no Live Preview, e a comparação é de string exacta. É opcional no arranque, mas o componente de Live Preview atira se ele faltar: quem usa o preview tem de o definir.

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

| Documento                               | Responde a                                                 |
| --------------------------------------- | ---------------------------------------------------------- |
| [resumo.md](docs/resumo.md)             | O projecto inteiro em dez minutos                          |
| [fluxos.md](docs/fluxos.md)             | Por onde passa cada pedido, ficheiro a ficheiro            |
| [guia.md](docs/guia.md)                 | Porque é que cada peça está como está, ficheiro a ficheiro |
| [architecture.md](docs/architecture.md) | Como está organizado e porquê                              |
| [conventions.md](docs/conventions.md)   | Onde ponho um ficheiro novo e como o nomeio                |
| [core.md](docs/core.md)                 | Quais são os contratos internos                            |
| [modules.md](docs/modules.md)           | Como crio um módulo de conteúdo                            |
| [renderer.md](docs/renderer.md)         | Como funciona a renderização e os erros                    |
| [providers.md](docs/providers.md)       | Como ligo outro CMS                                        |
| [payload.md](docs/payload.md)           | Como está configurado o Payload                            |
| [api.md](docs/api.md)                   | Como ligo uma API externa                                  |
| [routing.md](docs/routing.md)           | Como funcionam URLs, locales e metadata                    |
| [TODO.md](docs/TODO.md)                 | Estado e próximos passos                                   |

## Stack

Next.js 16 (App Router, React 19, React Compiler) · Payload CMS 3 · PostgreSQL · TypeScript strict · Zod · Vitest
