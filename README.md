# Next Foundation

Framework de frontend modular em Next.js. Uma página é descrita por dados, não por código: o conteúdo chega de um CMS, é traduzido para um contrato interno fixo, e renderizado por módulos registados dinamicamente.

A consequência prática: **trocar de CMS não obriga a tocar no frontend**, e adicionar um módulo de conteúdo novo não obriga a tocar no renderer.

## Arrancar

```bash
pnpm install
pnpm dev:payload     # primeira vez, ou depois de mexer na config do Payload
pnpm dev             # nas restantes
```

Há dois pontos de entrada, e a diferença importa:

- **`pnpm dev`** corre `lint` e `typecheck` antes do `next dev`. Falha cedo se o código estiver quebrado, mas **não** regenera os artefactos do Payload.
- **`pnpm dev:payload`** corre o `generate:payload` primeiro e só depois entra no `dev`. É o que precisas quando a config do Payload mudou.

Se alterares uma collection e arrancares com `pnpm dev`, os tipos gerados ficam desactualizados e o `typecheck` pode passar sobre um `payload-types.ts` antigo.

### Variáveis de ambiente

`.env.local`:

```
PROVIDER=payload                            # payload | mock
DATABASE_URL=postgres://…
PAYLOAD_SECRET=…
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
PREVIEW_SECRET=…
```

O `NEXT_PUBLIC_SERVER_URL` **não pode ter barra final** — é usado como `targetOrigin` de `postMessage` no Live Preview, e a comparação é de string exacta.

Com `PROVIDER=mock` o site arranca sem base de dados, servido por fixtures em [src/providers/mocks/](src/providers/mocks/).

### Scripts

| Script                      | O que faz                                          |
| --------------------------- | -------------------------------------------------- |
| `pnpm dev`                  | `lint` + `typecheck` e arranca o Next              |
| `pnpm dev:payload`          | `generate:payload` e depois o `dev`                |
| `pnpm build` / `pnpm start` | build e servidor de produção                       |
| `pnpm typecheck`            | `tsc --noEmit`                                     |
| `pnpm lint`                 | eslint                                             |
| `pnpm test`                 | vitest (em watch; `pnpm test --run` corre uma vez) |
| `pnpm format`               | prettier em toda a árvore                          |
| `pnpm format:check`         | verifica sem escrever                              |
| `pnpm generate:payload`     | `generate:types` + `generate:importMap`            |

Corre `pnpm generate:payload` (ou arranca com `pnpm dev:payload`) sempre que mudares collections, globals, campos ou o caminho de um componente de admin.

### Verificações automáticas

| Momento                                             | O que corre                                                 |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                                          | `lint`, `typecheck`                                         |
| pre-commit ([.husky/pre-commit](.husky/pre-commit)) | `lint-staged` (prettier), `lint`, `typecheck`, `test --run` |
| `pnpm build`                                        | nada                                                        |

O commit é a barreira completa: nada entra no histórico sem passar eslint, TypeScript e a suite de testes. O `pnpm dev` fica com a versão rápida — lint e typecheck, sem testes — para não atrasar o arranque do servidor.

A ordem no hook é do mais barato para o mais caro, para falhar cedo:

```sh
pnpm lint-staged
pnpm lint
pnpm typecheck
pnpm test --run
```

O `pnpm build` não corre verificações. Num CI, invoca `lint`, `typecheck` e `test --run` explicitamente — um hook local não protege quem faz push com `--no-verify`.

## Documentação

| Documento                               | Responde a                                  |
| --------------------------------------- | ------------------------------------------- |
| [architecture.md](docs/architecture.md) | Como está organizado e porquê               |
| [conventions.md](docs/conventions.md)   | Onde ponho um ficheiro novo e como o nomeio |
| [core.md](docs/core.md)                 | Quais são os contratos internos             |
| [modules.md](docs/modules.md)           | Como crio um módulo de conteúdo             |
| [renderer.md](docs/renderer.md)         | Como funciona a renderização e os erros     |
| [providers.md](docs/providers.md)       | Como ligo outro CMS                         |
| [payload.md](docs/payload.md)           | Como está configurado o Payload             |
| [routing.md](docs/routing.md)           | Como funcionam URLs, locales e metadata     |
| [TODO.md](docs/TODO.md)                 | Estado e próximos passos                    |

## Stack

Next.js 16 (App Router, React 19, React Compiler) · Payload CMS 3 · PostgreSQL · TypeScript strict · Zod · Vitest
