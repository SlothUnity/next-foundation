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

### Corrigido

- **A versão de Node passou a ser declarada, e a que estava no CI estava errada.** O workflow fixava Node 20, copiado do `engines` do Next (`>=20.9`); o `jsdom@30` exige `^22.22.2` e usa o `undici` 8, que chama uma API de `node:worker_threads` só existente desde o Node 22.10. Em Node 20 os 66 ficheiros de teste falhavam **antes de correr um único teste**, com um `TypeError` que nomeia o `undici` e não o Node. Agora o número vive no [.nvmrc](.nvmrc) e no `engines`, e o CI lê o ficheiro em vez de repetir o valor.
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
