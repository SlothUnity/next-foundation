# Changelog

O que mudou na base, para um projecto que partiu dela poder decidir o que traz. Como se traz está em [docs/reference/upgrading.md](docs/reference/upgrading.md).

Cada entrada diz se **exige trabalho manual** no projecto. As que não dizem nada resolvem-se num merge.

## 0.2.0

### Adicionado

- **Navigation e Footer têm dono no CMS.** No Payload são dois globals que oferecem os mesmos blocos que uma página; no provider `mocks` são dois campos do `definePage`. Antes o renderer desenhava três regiões e nenhum provider enchia duas, portanto um site nascia só com `<main>`.
- **Camada de estilo partilhada** — `src/app/(frontend)/globals.scss` com os tokens em custom properties e o reset, e `src/styles/_media.scss` com os breakpoints como mixin. O `sassOptions.loadPaths` permite `@use 'media'` de qualquer módulo.
- **CI** em `.github/workflows/gate.yml`: o portão do hook, mais `format:check` e `next build`.
- **`vercel.json`** a fixar `pnpm build` como comando de deploy.
- **Migrações do Postgres ligadas** — `payload:migrate`, `payload:migrate:create` e `payload:migrate:status`. A primeira migração tem de ser criada no projecto, contra a sua base de dados.
- **`docs/reference/upgrading.md`** e este ficheiro.
- **`docs/reference/deploy.md`** — o portão, o workflow do CI decisão por decisão, o comando de deploy, e a lista honesta do que falta a um site em produção (email, telemetria, backups, purga de cache, tecto de tempo, o limite real de upload).

### Corrigido — segurança

- **Um caminho do visitante escapava à base da API e levava o `API_TOKEN` com ele.** O `createUrl`
  concatenava base e caminho e passava o resultado ao `new URL`, que resolve `..`: um pedido a
  `../../admin` saía de `https://cms/api/v1/` para `https://cms/admin`, com o cabeçalho
  `Authorization` colado. Resolve agora **contra** a base e confirma que o resultado ainda começa por
  ela.
- **Redirect aberto na fronteira da aplicação.** O `page.tsx` passava o `response.to` do provider
  directamente ao `redirect()`. O guarda `isSafeRedirectPath` já existia e estava aplicado em três
  sítios — todos dentro do provider payload, o único que não pode produzir um redirect externo.
- **Os dois segredos que assinam coisas eram os dois não validados.** O `PAYLOAD_SECRET` era `min(1)`
  e o `PREVIEW_SECRET` não passava por schema nenhum. Ambos têm agora um mínimo de **32 caracteres**;
  o `PREVIEW_SECRET` é opcional, mas presente e fraco derruba o arranque.

### Corrigido — comportamento

- **Um bloco sem `id` deixa de matar a página inteira.** O mapper atirava e o throw escapava ao
  `getPage`, o que dava 500 — o oposto da regra escrita do renderer. Agora avisa nomeando o
  `blockType` e descarta só esse bloco.
- **O `onRequestError` imprime a causa.** Era o único caminho global de erro e imprimia só a mensagem
  e o `digest`, portanto nomeava sempre o sintoma («Request to … failed.») e nunca a causa (o
  `ECONNREFUSED`, o erro do Zod). Percorre agora a cadeia de `cause` e imprime o `stack`.
- **O relatório de referências penduradas do `setup:provider` via 2 de 19 documentos.** O varrimento
  não era recursivo e os documentos vivem em `start/` e `reference/` desde a reorganização. Há agora
  um varredor só, testado, partilhado com o `check:links`.
- **O estado `{ kind: 'source' }` do sitemap estava entregue morto** — lê um campo que nenhum provider
  escreve, portanto dava um `robots.txt` sem linha `Sitemap:` em silêncio. Avisa e nomeia o ficheiro.

### Corrigido — testes e o plano de remoção

- **O `sharp` sobrevivia ao `setup:provider` sem quem o importe.** O seu único importador é o
  `payload.config.ts`, que o comando apaga — mas o `sharp` não estava na lista de dependências a
  remover, e no mesmo passo perdia a aprovação de build no `pnpm-workspace.yaml`. Ficava instalado,
  sem uso e sem poder compilar.
- **O teste dos blocos não afirmava o que o nome prometia.** Chamava-se «gives every block a
  localized, required title field» e só fazia `toBeDefined()`: qualquer bloco passava com
  `required: false` e `localized: false`. São agora três testes, um por afirmação — verificado a
  chumbar com os valores errados.

### Corrigido — documentação

- **O `guide.md` descrevia um código materialmente diferente.** Uma auditoria encontrou 82 derivas
  entre prosa e código, dois terços neste documento. As quatro que faziam alguém agir errado estão
  corrigidas: dizia que **não havia controlo de acesso** (há dois papéis e regras por collection), que
  **não havia sistema de tema** (há tokens e reset), que **não havia CI** (há), e trazia um aviso
  marcado como «problema vivo» sobre um defeito já corrigido. O documento passou a dizer no topo que,
  onde discordar de um de `reference/`, é o outro que está certo.
- A mesma afirmação sobre o CI estava no `README.md` (que se contradizia 117 linhas depois) e no
  `overview.md`.

### Corrigido

- **A versão de Node passou a ser declarada, e a que estava no CI estava errada.** O workflow fixava Node 20, copiado do `engines` do Next (`>=20.9`); o `jsdom@30` exige `^22.22.2` e usa o `undici` 8, que chama uma API de `node:worker_threads` só existente desde o Node 22.10. Em Node 20 os 66 ficheiros de teste falhavam **antes de correr um único teste**, com um `TypeError` que nomeia o `undici` e não o Node. Agora o [.nvmrc](.nvmrc) fixa a versão exacta (`22.23.2`) e o CI lê-a por `node-version-file`, para o CI e quem desenvolve correrem o mesmo runtime; o `engines` fica com o piso (`>=22.22.2`), que é o que o jsdom declara, e avisa quem estiver abaixo. O `nvm-windows` não lê o `.nvmrc`, portanto lá instala-se pelo nome.
- O `createProvider.test.ts` passou de `timeout: 20_000` a `60_000`. Os dois testes mais lentos do repositório levam 8,0 s e 7,5 s dentro da suite (1,9 s e 2,4 s isolados) porque importar o `createProvider` arrasta o grafo inteiro do Payload. É margem, não a correcção do incidente acima.

### Limpeza

- O `pnpm setup:provider` passou a apagar duas coisas que sobreviviam sem dono: a excepção do eslint para `src/app/(payload)/**` e `src/app/(frontend)/next/**`, duas pastas que o próprio comando apaga, e o `src/providers/env.ts` num projecto `mock`, onde o `readEnv` deixa de ter um único chamador.
- A nota final do `pnpm generate` já não nomeia o provider `payload` a quem nunca o teve.
- A documentação passou a dizer **o que é conteúdo de demonstração** — o módulo `Hero`, as fixtures do provider `mocks` — e os três sítios onde se apaga.

### Alterado — **exige trabalho manual**

- **`PageDefinition.navigation` e `PageDefinition.footer` passaram de `ModuleInstance` a `ModuleInstance[]`.** Um provider próprio ou um `mapApiPage` escrito à mão deixam de compilar até devolverem listas. Foi por isto: com um módulo só, uma barra de anúncios acima do menu obrigava a inventar um módulo composto para agrupar dois.
- **Os `id` das instâncias que o `definePage` gera passaram a ter prefixo de região** — `main-hero-1` em vez de `hero-1`. Só afecta testes que fixem o valor.
- **O `Hero.module.scss` e o template do gerador passaram a usar os tokens** (`var(--space-2)`) em vez de valores fixos. Um módulo já escrito continua a funcionar; um novo nasce no vocabulário partilhado.

## 0.1.0

A base antes desta lista. Não havia CHANGELOG, portanto a história está no `git log` — `git log --oneline` até `f9ce7d3` cobre-a, incluindo o `pnpm setup:provider`, os schemas de ambiente, as regras de camadas impostas pelo lint, o verificador de ligações, os cabeçalhos de segurança, o `sitemap` e o `robots`, e a passagem dos estilos de módulo a CSS Modules.
