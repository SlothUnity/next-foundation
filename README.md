# Next Foundation

Framework de frontend modular em Next.js. Uma página é descrita por dados, não por código: o conteúdo chega de um CMS, é traduzido para um contrato interno fixo, e renderizado por módulos registados dinamicamente.

A consequência prática: **trocar de CMS não obriga a tocar no frontend**, e adicionar um módulo de conteúdo novo não obriga a tocar no renderer.

Este README é o caminho para pôr o projecto de pé, pela ordem em que se faz. Se preferires perceber antes de correr, o [overview.md](docs/start/overview.md) são dez minutos e responde ao «o que é isto».

## Arrancar, por passos

Oito passos. Os três primeiros são iguais para todos; **do quarto em diante o caminho separa-se pelo provider que escolheres**, e cada passo diz o que devias ver e o que aparece quando falta algo.

| #   | Passo                                    | Comando                         |
| --- | ---------------------------------------- | ------------------------------- |
| 1   | pré-requisitos                           | —                               |
| 2   | instalar                                 | `pnpm install`                  |
| 3   | ver o site a correr, sem configurar nada | `pnpm dev:mock`                 |
| 4   | escolher o tipo de projecto              | `pnpm setup:provider`           |
| 5   | preencher as variáveis de ambiente       | `.env.example` → `.env.local`   |
| 6   | arrancar com o provider escolhido        | `pnpm dev` / `pnpm dev:payload` |
| 7   | dar conteúdo ao site                     | no admin, ou no mapper          |
| 8   | fechar o portão                          | `pnpm build`                    |

### 1. Pré-requisitos

| O quê        | Versão                   | Porquê                                                                                           |
| ------------ | ------------------------ | ------------------------------------------------------------------------------------------------ |
| **Node**     | `22.23.2`                | a versão exacta está no [.nvmrc](.nvmrc), o piso no `engines`. Não é o Next que manda: é o jsdom |
| **pnpm**     | `10.7.1`                 | está fixado no `packageManager`; `corepack enable` põe o Node a usar essa versão sozinho         |
| **git**      | qualquer                 | o passo 4 recusa arrancar com alterações não commitadas, portanto precisa de repositório         |
| **Postgres** | só no provider `payload` | e quem o fornece está em [Quem fornece a base de dados](#quem-fornece-a-base-de-dados)           |

**A versão de Node não é negociável, e o número não vem do Next.** O Next 16 aceita `>=20.9`, mas o `jsdom` — o ambiente onde os testes correm — declara `^22.22.2 || ^24.15.0 || >=26.0.0`, e usa o `undici` 8, que chama uma API de `node:worker_threads` que só existe a partir do Node 22.10. Num Node 20 **nenhum ficheiro de teste chega a arrancar**: o worker do vitest morre a carregar o jsdom. O `engines` do `package.json` avisa-te, e o CI lê a versão do `.nvmrc` para não haver dois números a divergir.

**Não precisas de Docker**, e não é esquecimento — a razão está na mesma secção.

### 2. `pnpm install`

```bash
pnpm install
```

Instala e, no `prepare`, arma o hook de pre-commit. É o único passo que corre uma vez e não se repete.

### 3. Ver o site a correr, sem configurar nada

A forma mais rápida de ver o site a funcionar **não precisa de base de dados nem de `.env.local`**:

```bash
pnpm dev:mock
```

**O que devias ver:** o site em `/` e em `/en`, servido por páginas escritas à mão em [src/providers/mocks/pages/](src/providers/mocks/pages) — o provider `mocks` não tem configuração nenhuma para preencher.

Faz este passo antes de escolher: é o que te mostra o que o renderer faz, sem nada por montar. O `dev:mock` existe porque `PROVIDER=mock pnpm dev` **não corre no PowerShell** — prefixar variáveis é sintaxe de shell POSIX. O script usa o `cross-env` que já estava aqui, e o passo 4 remove-o depois: experimentar antes de escolher deixa de fazer sentido quando já se escolheu.

### 4. Escolher o tipo de projecto

Esta foundation traz **três** providers montados, e um projecto real usa um. O primeiro passo num projecto novo é dizer qual:

```bash
pnpm setup:provider --dry-run   # imprime o plano, não toca em nada
pnpm setup:provider             # pergunta, e aplica
```

Pergunta qual dos três é (`payload`, `api` ou `mock`) e **apaga o que não é preciso**: os outros dois providers, e — se o Payload sair — o `payload.config.ts`, o `src/app/(payload)/`, as rotas de preview, as oito dependências, os scripts `payload:*`, o `withPayload`, os caminhos `@payload-*` e o documento do provider removido. Com um provider só, a variável `PROVIDER` e o `createProvider` deixam de fazer sentido e saem também.

Chama-se `setup:provider` e não `setup` porque **`pnpm setup` é um comando do próprio pnpm** — um script com esse nome ficaria à sombra dele.

Três coisas que vale saber antes de correr:

- **recusa arrancar com alterações não commitadas**, para tudo o que ele faz caber num só `git diff` legível;
- **para quando não reconhece um ficheiro.** Cada operação falha em voz alta se a âncora que espera não estiver lá, em vez de editar à sorte. Se personalizaste algum destes ficheiros, o comando pára e diz qual;
- **apaga-se a si mesmo no fim.** Um comando destes esquecido dentro de um projecto de cliente é uma armadilha. `--keep` para o manter.

No fim lista as referências em prosa que ficaram a apontar para o documento apagado. São frases, não linhas de tabela, portanto quem as lê é uma pessoa e não um script.

**Se ele recusar por árvore suja e não tiveres mexido em nada:** o `next dev` do passo 3 escreveu um `AGENTS.md` e um `CLAUDE.md` na raiz, com um aviso para agentes de IA sobre as suas próprias mudanças. Estão commitados de propósito — é o que a nota dentro do ficheiro recomenda, porque o `next dev` reescreve-os sempre. Commita-os, ou dispensa-os com `agentRules: false` no `next.config.ts`.

### 5. Preencher as variáveis de ambiente

```bash
cp .env.example .env.local
```

O [.env.example](.env.example) que copias já é o do provider escolhido — o passo 4 reescreveu-o. **O ficheiro só divide por provider e por obrigatoriedade**: o que cada variável faz está aqui, e não em comentários que envelhecem ao lado do valor.

Configuração em falta ou mal formada **derruba o arranque**, com o nome de cada variável e quem precisa dela. Não degrada em silêncio, e valida formato e não só presença — o schema está no [apiEnv](src/providers/api/apiEnv.ts) e no [payloadEnv](src/providers/payload/payloadEnv.ts).

#### Com o provider `payload`

| Variável                 |             | O que é, e o que acontece sem ela                                                                                                                                                                                                                        |
| ------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | obrigatória | a ligação ao Postgres. Tem de começar por `postgres://` ou `postgresql://` — o Supabase entrega ambos                                                                                                                                                    |
| `PAYLOAD_SECRET`         | obrigatória | assina os tokens de sessão do admin. Gera um valor longo e aleatório, **distinto por ambiente**                                                                                                                                                          |
| `NEXT_PUBLIC_SERVER_URL` | obrigatória | o URL público, **sem barra final**. Ver a nota abaixo: é a que se paga mais caro                                                                                                                                                                         |
| `BLOB_READ_WRITE_TOKEN`  | no Vercel   | onde vivem os ficheiros carregados. O Vercel injecta-a sozinho; em desenvolvimento podes deixá-la vazia e os ficheiros ficam em `./media`, com aviso no log. Em produção a sua falta derruba o arranque, porque o disco não sobrevive ao deploy seguinte |
| `PREVIEW_SECRET`         | opcional    | assina os links de pré-visualização. **Não viaja no URL**: o que viaja é um token de uma hora preso ao caminho da página. Sem ela o Live Preview fica desligado, com erro no log                                                                         |

#### Com o provider `api`

| Variável         |             | O que é, e o que acontece sem ela                                                                                |
| ---------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `API_URL`        | obrigatória | a base da API externa, absoluta e **sem barra final** — o endpoint é acrescentado a ela                          |
| `API_TOKEN`      | opcional    | enviado como `Authorization: Bearer …`. Um valor em branco conta como ausente, para não enviar um `Bearer` vazio |
| `API_REVALIDATE` | opcional    | segundos de revalidação do cache, **60** por omissão. Inteiro não negativo, ou o arranque falha                  |

#### Com o provider `mock`

Nenhuma — não há passo 5. As páginas estão em [src/providers/mocks/pages/](src/providers/mocks/pages/), e o `.env.example` que o passo 4 escreve para este provider diz exactamente isso.

#### A barra final que não se vê

O `NEXT_PUBLIC_SERVER_URL` **não pode terminar em `/`**. O Live Preview compara-o com a origem do browser por **igualdade de string**, portanto uma barra a mais quebra-o sem erro nenhum: o iframe abre, o conteúdo nunca actualiza, e não há nada no log. O schema recusa-a no arranque, o que transforma uma tarde de procura numa mensagem.

O prefixo `NEXT_PUBLIC_` põe o valor no browser — **nunca lá ponhas segredos.** E não há default: o anterior era `http://localhost:3000`, e como o Payload usa este valor na allowlist de CSRF, um deploy sem a variável passava a rejeitar o host verdadeiro em vez de o aceitar.

#### Quem fornece a base de dados

**A foundation não traz `Dockerfile` nem `docker-compose.yml`, e é decisão e não esquecimento.**

Num projecto `payload`, o Postgres é do **Supabase** e quem monta o projecto configura-o junto com o Payload — é a equipa interna, e a montagem faz parte do que ela já sabe fazer. Um `docker-compose` local seria um segundo caminho a manter, com um Postgres de versão diferente da que serve o site, e a divergir do primeiro em silêncio.

Num projecto `api`, não há base de dados nenhuma deste lado: o conteúdo vem de uma API que **outra equipa entrega**. O que este repositório precisa de saber está no `API_URL`, e o que precisa de traduzir está no [mapApiPage](docs/reference/api.md#o-que-entra-mapapipage).

Num projecto `mock` não há nada a configurar: as páginas estão no repositório.

Portanto os pré-requisitos por escolha são estes, e só estes:

| Provider  | Precisa de                                  |
| --------- | ------------------------------------------- |
| `payload` | um Postgres (Supabase) e as variáveis acima |
| `api`     | um `API_URL` que responda                   |
| `mock`    | nada                                        |

### 6. Arrancar com o provider escolhido

#### `payload`

```bash
pnpm dev:payload     # primeira vez, ou depois de mexer na config do Payload
pnpm dev             # nas restantes
```

Há dois pontos de entrada, e a diferença importa:

- **`pnpm dev`** corre `lint` e `typecheck` antes do `next dev`. Falha cedo se o código estiver quebrado, mas **não** regenera os artefactos do Payload;
- **`pnpm dev:payload`** corre o `payload:generate` primeiro e só depois entra no `dev`. É o que precisas quando a config do Payload mudou.

Se alterares uma collection e arrancares com `pnpm dev`, os tipos gerados ficam desactualizados e o `typecheck` pode passar sobre um `payload-types.ts` antigo.

**A base de dados monta-se sozinha, e às vezes pergunta.** Fora de produção, o adaptador de Postgres empurra o schema da config para a base de dados no arranque — a primeira corrida cria as tabelas todas. Quando uma alteração não se aplica sem uma decisão (uma coluna nova obrigatória numa tabela que já tem linhas, por exemplo), **o Payload pergunta no terminal e espera**. Corre-o num terminal onde possas responder, e não num processo em segundo plano.

#### `api`

```bash
pnpm dev
```

**O que devias ver da primeira vez:** um erro, e é de propósito. O [mapApiPage](src/providers/api/mappers/mapApiPage.ts) vem por escrever e atira uma `ApiContractError` que diz o que a API respondeu e onde se escreve a tradução. A forma dos dados é de cada API, portanto é a única peça que a foundation não pode adivinhar — os passos estão em [api.md § Ligar uma API nova](docs/reference/api.md#ligar-uma-api-nova-por-passos).

#### `mock`

```bash
pnpm dev
```

O `dev:mock` e a variável `PROVIDER` já não existem: o passo 4 apagou-os, e o provider é o único que sobrou.

### 7. Dar conteúdo ao site

#### `payload` — cinco coisas no admin, por esta ordem

Com o servidor a correr, abre `/admin`:

| #   | No admin                                                                                    | Sem isto                                                                         |
| --- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | **cria o primeiro utilizador** — o ecrã aparece sozinho enquanto não houver nenhum          | não entras. É a única criação de conta que dispensa autorização, e dá-te `admin` |
| 2   | **Website → Site Settings**: nome e idiomas (o primeiro é o default)                        | o site responde, mas com dois avisos no log e sem template de título             |
| 3   | **Pages**: cria a página de raiz e marca-a como **Root Page**                               | `/` responde «404 — Page not found»                                              |
| 4   | **Pages**: cria a página de erro e marca-a como **Not Found Page**                          | um caminho inexistente cai no 404 genérico, sem conteúdo teu                     |
| 5   | **Website → Navigation** e **Website → Footer**: põe lá os módulos do cabeçalho e do rodapé | o site sai só com `<main>`: sem menu e sem rodapé, em todas as páginas           |

Publica as duas — um rascunho não é conteúdo público.

**O que devias ver antes disto, e não é uma avaria:** `/` responde com um «404 — Page not found» mínimo e o log diz `The content source answered "notFound" without a page.` Significa que a base de dados está de pé e vazia — é o passo 3 desta tabela que falta, não a ligação. As duas flags estão explicadas em [payload.md § isHome e is404](docs/reference/payload.md#ishome-e-is404), os papéis em [payload.md § Access control](docs/reference/payload.md#access-control).

#### `api`

Nada aqui: o conteúdo é de quem serve a API. O teu passo 7 foi escrever o mapper no passo 6.

#### `mock`

As páginas são ficheiros do repositório — [providers.md § Escrever uma página](docs/reference/providers.md#escrever-uma-página).

### 8. Fechar o portão

```bash
pnpm build
```

Corre `lint`, `typecheck`, os testes e só depois o `next build`. **É o portão real** — não há CI neste repositório, e um `git commit --no-verify` contorna o hook por inteiro. Se isto passa, o projecto está de pé.

Num projecto `api` ou `mock`, passa **sem base de dados nenhuma**: o passo 4 levou consigo as rotas que exigiam a config do Payload.

## Ordem para ler

**Não há comentários no código deste projecto.** O raciocínio vive todo em [docs/](docs/README.md), e é por isso que a documentação é grande — ver [conventions.md § Comentários](docs/reference/conventions.md#comentários).

Está em duas vertentes, e a diferença não é o assunto: é a pergunta que respondem.

### Vertente 1 — para começar

Três peças, por esta ordem, de seguida. **Duas horas**, e sais com o site a correr e com o percurso de um pedido na cabeça.

| #   | Lê                                    | Sais com                                                         |
| --- | ------------------------------------- | ---------------------------------------------------------------- |
| 1   | [overview.md](docs/start/overview.md) | o que é isto, as peças, e o que te vai surpreender — dez minutos |
| 2   | **este README**, os oito passos       | o tipo de projecto escolhido, o site de pé, e o mapa do `src/`   |
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
| trazer o que a base mudou          | [upgrading.md](docs/reference/upgrading.md)       |

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

## O mapa do `src/`

```
src/
├── proxy.ts          expõe o pathname num header, e mais nada
├── instrumentation.ts  onRequestError: o sítio onde a telemetria entra
├── app/              Next: rotas, metadata, boundaries
├── core/             o domínio. Não conhece Next, nem CMS, nem módulos concretos
├── modules/          os componentes de conteúdo
├── providers/        os adaptadores de CMS
└── testing/          o que os testes de camadas diferentes partilham

generator/            templates do `pnpm generate` (Plop)
scripts/setup/        o `pnpm setup:provider`, que se apaga a si mesmo
scripts/links/        o `pnpm check:links`
docs/                 a documentação, em duas vertentes
```

O `proxy.ts` e o `instrumentation.ts` estão na raiz do `src/` porque o Next os encontra **por caminho exacto** — não é escolha de organização.

A direcção das dependências é a regra mais importante do projeto, e desde
[7843e58](docs/reference/architecture.md#a-regra-é-imposta-não-revista) **é o lint que a impõe** — cada linha desta tabela é um bloco de `no-restricted-imports`:

| Camada       | Conhece                      | Não pode conhecer                   |
| ------------ | ---------------------------- | ----------------------------------- |
| `core/`      | nada além de React           | Next.js, Payload, módulos concretos |
| `providers/` | `core` + o SDK do CMS        | `app`                               |
| `modules/`   | `core`                       | providers, CMS                      |
| `app/`       | `core`, `providers`, Next.js | estrutura interna do CMS            |

Duas regras de pastas que evitam a maior parte das dúvidas:

- **Dentro de `app/` só ficheiros de rota.** O resto vai para `_lib/` (funções) ou `_components/` (componentes), que o prefixo `_` tira do router. São duas pastas e não uma porque guardam coisas diferentes — com uma só, o segundo componente transforma-a numa gaveta. O que é puro e não depende do Next sai de `app/` de vez.
- **Um módulo é uma pasta em `modules/`** com o componente, o schema, os tipos, os estilos, o teste e o registo. Acrescentar um não obriga a tocar no renderer — e o `pnpm generate` escreve-o todo, incluindo o bloco correspondente no Payload.

## Scripts

| Script                      | O que faz                                                    |
| --------------------------- | ------------------------------------------------------------ |
| `pnpm dev`                  | `lint` + `typecheck` e arranca o Next                        |
| `pnpm dev:payload`          | `payload:generate` e depois o `dev`                          |
| `pnpm build` / `pnpm start` | `lint` + `typecheck` + testes + build / servidor de produção |
| `pnpm typecheck`            | `tsc --noEmit`                                               |
| `pnpm lint`                 | eslint, com `--max-warnings=0`: um aviso chumba              |
| `pnpm test`                 | vitest (em watch; `pnpm test --run` corre uma vez)           |
| `pnpm format`               | prettier em toda a árvore                                    |
| `pnpm format:check`         | verifica sem escrever                                        |
| `pnpm generate`             | gera um módulo novo, com bloco do Payload incluído (Plop)    |
| `pnpm check:links`          | ligações e âncoras dos `.md`, e chumba se alguma apodreceu   |
| `pnpm dev:mock`             | o `dev` com o provider `mocks`, sem base de dados            |
| `pnpm setup:provider`       | escolhe o provider do projecto e apaga os outros dois        |
| `pnpm payload:generate`     | `payload:types` + `payload:importMap`                        |
| `pnpm payload:migrate*`     | `create`, `status` e a aplicação das migrações do Postgres   |

Corre `pnpm payload:generate` (ou arranca com `pnpm dev:payload`) sempre que mudares collections, globals, campos ou o caminho de um componente de admin.

## Verificações automáticas

| Momento                                                      | O que corre                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `pnpm dev`                                                   | `lint`, `typecheck`                                                        |
| pre-commit ([.husky/pre-commit](.husky/pre-commit))          | `lint-staged` (prettier), `lint`, `typecheck`, `check:links`, `test --run` |
| `pnpm build`                                                 | `lint`, `typecheck`, `test --run`, e depois `next build`                   |
| push e pull request ([gate.yml](.github/workflows/gate.yml)) | o portão todo, mais `format:check` e o `next build`                        |

O commit é a barreira completa: nada entra no histórico sem passar eslint, TypeScript, o verificador de ligações e a suite de testes. O `pnpm dev` fica com a versão rápida — lint e typecheck, sem testes — para não atrasar o arranque do servidor.

A ordem no hook é do mais barato para o mais caro, para falhar cedo:

```sh
pnpm lint-staged
pnpm lint
pnpm typecheck
pnpm check:links
pnpm test --run
```

**Há três portões, e nenhum é redundante.** O hook é o mais rápido e o mais fácil de contornar — um `git commit --no-verify` passa-lhe por cima. O **CI** corre o mesmo, mais o `format:check` e o `next build`, e não se contorna: é o que garante que o portão existe mesmo quando alguém tem pressa. E o `pnpm build` repete as verificações antes do `next build` porque o deploy corre esse comando — o [vercel.json](vercel.json) fixa-o — portanto nada chega a produção sem as passar.

O passo de build no CI corre com credenciais fictícias: o build precisa que a config do Payload **carregue**, não que a base de dados responda. Loga um `ECONNREFUSED` porque a página de not-found estática pergunta à origem de conteúdo, e termina a zero — esse log é o error reporter a fazer o trabalho dele, não um passo a falhar.

## Todos os documentos

| Documento                                         | Responde a                                                  |
| ------------------------------------------------- | ----------------------------------------------------------- |
| [docs/README.md](docs/README.md)                  | O índice: qual das duas vertentes responde à minha pergunta |
| [overview.md](docs/start/overview.md)             | O projecto inteiro em dez minutos                           |
| [flows.md](docs/start/flows.md)                   | Por onde passa cada pedido, ficheiro a ficheiro             |
| [guide.md](docs/reference/guide.md)               | Porque é que cada peça está como está, ficheiro a ficheiro  |
| [architecture.md](docs/reference/architecture.md) | Como está organizado e porquê                               |
| [conventions.md](docs/reference/conventions.md)   | Onde ponho um ficheiro novo e como o nomeio                 |
| [core.md](docs/reference/core.md)                 | Quais são os contratos internos                             |
| [modules.md](docs/reference/modules.md)           | Como crio um módulo de conteúdo                             |
| [renderer.md](docs/reference/renderer.md)         | Como funciona a renderização e os erros                     |
| [providers.md](docs/reference/providers.md)       | Como ligo outro CMS                                         |
| [payload.md](docs/reference/payload.md)           | Como está configurado o Payload                             |
| [api.md](docs/reference/api.md)                   | Como ligo uma API externa                                   |
| [routing.md](docs/reference/routing.md)           | Como funcionam URLs, locales e metadata                     |
| [upgrading.md](docs/reference/upgrading.md)       | Como traço para o meu projecto o que a base mudou           |
| [CHANGELOG.md](CHANGELOG.md)                      | O que mudou na base, e o que exige trabalho manual          |

## Stack

Next.js 16 (App Router, React 19, React Compiler) · Payload CMS 3 · PostgreSQL · TypeScript strict · Zod · Vitest
