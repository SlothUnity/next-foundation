# Next Foundation

Framework de frontend modular em Next.js. Uma página é descrita por dados, não por código: o conteúdo chega de um CMS, é traduzido para um contrato interno fixo, e renderizado por módulos registados dinamicamente.

A consequência prática: **trocar de CMS não obriga a tocar no frontend**, e adicionar um módulo de conteúdo novo não obriga a tocar no renderer.

## Arrancar

```bash
pnpm install
pnpm dev
```

O `pnpm dev` corre `generate:payload` (tipos + import map) e `typecheck` antes do `next dev`, por isso falha cedo se a config do Payload e o código estiverem dessincronizados.

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

| Script                      | O que faz                                        |
| --------------------------- | ------------------------------------------------ |
| `pnpm dev`                  | gera tipos do Payload, typecheck, arranca o Next |
| `pnpm build` / `pnpm start` | build e servidor de produção                     |
| `pnpm typecheck`            | `tsc --noEmit`                                   |
| `pnpm lint`                 | eslint                                           |
| `pnpm test`                 | vitest                                           |
| `pnpm format`               | prettier                                         |
| `pnpm generate:payload`     | `generate:types` + `generate:importmap`          |

Corre `pnpm generate:payload` sempre que mudares collections, globals, campos ou o caminho de um componente de admin.

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
