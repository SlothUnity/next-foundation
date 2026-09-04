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

### Alterado — **exige trabalho manual**

- **`PageDefinition.navigation` e `PageDefinition.footer` passaram de `ModuleInstance` a `ModuleInstance[]`.** Um provider próprio ou um `mapApiPage` escrito à mão deixam de compilar até devolverem listas. Foi por isto: com um módulo só, uma barra de anúncios acima do menu obrigava a inventar um módulo composto para agrupar dois.
- **Os `id` das instâncias que o `definePage` gera passaram a ter prefixo de região** — `main-hero-1` em vez de `hero-1`. Só afecta testes que fixem o valor.
- **O `Hero.module.scss` e o template do gerador passaram a usar os tokens** (`var(--space-2)`) em vez de valores fixos. Um módulo já escrito continua a funcionar; um novo nasce no vocabulário partilhado.

## 0.1.0

A base antes desta lista. Não havia CHANGELOG, portanto a história está no `git log` — `git log --oneline` até `f9ce7d3` cobre-a, incluindo o `pnpm setup:provider`, os schemas de ambiente, as regras de camadas impostas pelo lint, o verificador de ligações, os cabeçalhos de segurança, o `sitemap` e o `robots`, e a passagem dos estilos de módulo a CSS Modules.
