# O portão, o CI e o deploy

O [README](../../README.md#verificações-automáticas) diz **quando** cada verificação corre. Este documento diz **porque** cada linha do workflow está como está, e o que falta a um site que vá a produção a sério.

## Três portões, e nenhum é redundante

| Portão                                                    | Corre                                                           | Contorna-se                       |
| --------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------- |
| pre-commit ([.husky/pre-commit](../../.husky/pre-commit)) | `lint-staged`, `lint`, `typecheck`, `check:links`, `test --run` | sim, com `git commit --no-verify` |
| CI ([gate.yml](../../.github/workflows/gate.yml))         | o mesmo, mais `format:check` e `next build`                     | **não**                           |
| `pnpm build`                                              | `lint`, `typecheck`, `test --run`, e depois `next build`        | é o comando que o deploy corre    |

O hook é rápido e voluntário; o CI é o que garante que o portão existe **mesmo quando alguém tem pressa**; o `pnpm build` existe porque o deploy corre esse comando, e é a última barreira antes de produção.

Não é cinto e suspensórios: são três momentos com públicos diferentes — quem escreve, quem revê, e quem serve.

## O workflow, linha a linha

### `on: push` no master **e** `pull_request`

Duas razões distintas. No PR, o resultado é o que decide o merge. No `master`, o resultado fica no histórico — e é o que diz se o merge deixou a branch principal verde, que o PR sozinho não garante quando alguém faz merge de dois PRs seguidos.

### `concurrency` com `cancel-in-progress: true`

Agrupado por `github.ref`, portanto um segundo push à mesma branch **cancela a corrida anterior**. O resultado dessa corrida já era obsoleto: ninguém decide nada com o portão de um commit que já foi substituído.

Vale saber o efeito de lado: uma corrida cancelada aparece como **cancelled** e não como failure. Se vires um vermelho que não explica nada, confirma primeiro se não foi cancelada por um push teu.

### `pnpm/action-setup@v4` **sem** `version`

Sem esse campo a acção lê o `packageManager` do [package.json](../../package.json). É deliberado: com a versão declarada nos dois sítios, um dia divergiam, e o CI passava a instalar com um pnpm diferente do de quem desenvolve — que é a categoria de defeito que este repositório já pagou uma vez (ver [upgrading.md](upgrading.md#a-versão-de-node-é-um-requisito-da-árvore-e-não-do-next)).

### `actions/setup-node@v4` com `node-version-file: .nvmrc`

Pela mesma razão: **a versão de Node vive num ficheiro só**. O `.nvmrc` fixa-a à letra e o `engines` guarda o piso — a diferença entre os dois está no [upgrading.md](upgrading.md#a-versão-de-node-é-um-requisito-da-árvore-e-não-do-next).

**A ordem dos dois passos importa** e não é estética: o `cache: pnpm` precisa do pnpm no PATH para descobrir o caminho da store, portanto o `action-setup` tem de vir **antes** do `setup-node`. Trocados, o cache falha em silêncio e cada corrida reinstala tudo.

### `pnpm install --frozen-lockfile`

Chumba se o `pnpm-lock.yaml` não corresponder ao `package.json`, em vez de o actualizar sozinho. É o que faz um lockfile desalinhado ser **um passo vermelho com uma mensagem** e não uma diferença silenciosa entre o que o CI instalou e o que está commitado.

O mesmo comando está no [vercel.json](../../vercel.json), pela mesma razão.

### `lint`, `typecheck`, `format:check`, `check:links`, `test --run`

A ordem é a do hook — do mais barato para o mais caro, para falhar cedo.

O `format:check` está aqui e **não** no hook porque o `lint-staged` já formata o que está em staged: verificar o mesmo duas vezes no commit era trabalho a troco de nada, mas no CI é a única coisa que apanha um ficheiro formatado à mão ou por um editor com outra configuração.

O `test --run` corre com **`--reporter=verbose`**, e a razão é operacional: imprime a duração de cada teste, portanto um limite de tempo estourado **nomeia-se a si mesmo** no log que se vê na página do PR. O log cru do job exige um token — a API responde `403` sem ele.

### `next build`, em último e com credenciais fictícias

É o passo mais caro, por isso é o último. As credenciais são de mentira de propósito: **o build precisa que a config do Payload carregue, não que a base de dados responda.**

Loga um `ECONNREFUSED` e termina a zero. Não é um passo a falhar: a página de not-found é pré-renderizada, pergunta à origem de conteúdo, e o erro é apanhado e reportado — é o [error reporter](renderer.md) a fazer o trabalho dele. Se algum dia esse log desaparecer, é sinal de que a página deixou de ser estática, não de que ficou melhor.

## O deploy

O [vercel.json](../../vercel.json) fixa duas coisas, e nenhuma é o default:

```json
{ "buildCommand": "pnpm build", "installCommand": "pnpm install --frozen-lockfile" }
```

O `buildCommand` é `pnpm build` e não `next build` porque o `pnpm build` corre `lint`, `typecheck` e os testes antes de construir. É o que sustenta a frase do README: nada chega a produção sem passar o portão.

**As migrações não estão aqui**, e é decisão. Este ficheiro é partilhado pelos três providers, e num projecto `api` ou `mock` o comando `payload` não existe. Num projecto `payload`, o `buildCommand` a usar é `pnpm payload:migrate && pnpm build` — no `vercel.json` do projecto ou nas settings do host. O porquê e a armadilha da transição de push para migrações estão em [payload.md § O schema da base de dados](payload.md#o-schema-da-base-de-dados).

### Uma variável que se comporta pior do que parece

O `NEXT_PUBLIC_SERVER_URL` é **um** URL absoluto, e o Payload acrescenta-o à allowlist de CSRF. Consequência: num **deploy de preview** do Vercel, cujo domínio é gerado e diferente do valor da variável, o admin autentica-se contra uma origem que não está na allowlist e a sessão não se mantém. O site público funciona; o `/admin` não.

Não há solução de configuração aqui — há a escolha de apontar a variável ao domínio de cada ambiente, e de tratar os previews como não tendo admin. Está escrito porque se descobre da pior maneira: a olhar para um login que aceita a password e volta ao ecrã de login.

## O que falta a um site em produção

Honestamente enumerado, porque nenhuma destas coisas está montada e todas se notam no primeiro mês:

|                              |                                                                                                                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **adaptador de email**       | o Payload cai no adaptador de consola, portanto o «esqueci-me da password» **loga o link em vez de o enviar**. Avisa no arranque, e é um beco sem saída para quem não lê logs do servidor                                           |
| **telemetria**               | o [instrumentation.ts](../../src/instrumentation.ts) tem o `onRequestError` ligado e o renderer reporta módulos degradados, mas nada disso sai da máquina: não há destino, não há alertas                                           |
| **backups**                  | são do Supabase, e a política é de quem monta o projecto                                                                                                                                                                            |
| **rota de purga de cache**   | a invalidação depende de um hook do Payload a correr dentro de um pedido. Uma escrita fora do admin — um script, um `psql` — não invalida nada, e não há forma de forçar                                                            |
| **tecto de tempo na cache**  | as entradas vivem até uma tag ser invalidada. Se um hook falhar, o conteúdo fica velho **para sempre** — ver [payload.md § Cache](payload.md#cache)                                                                                 |
| **uploads acima de ~4,5 MB** | o `payload.config.ts` declara 8 MB, mas os ficheiros passam pela rota de API do Payload e o limite de corpo de uma função serverless é menor. O número declarado é alcançável num servidor próprio, não no host que o README assume |

Nada disto é esquecimento: é a lista do que um projecto real decide, e o sítio onde a decidir é o primeiro sprint e não o dia do lançamento.
