# Documentação

Não há comentários no código deste projecto: o raciocínio vive todo aqui. É por isso que esta pasta é grande — ver [conventions.md § Comentários](reference/conventions.md#comentários).

Está organizada em **duas vertentes**, e a diferença entre elas não é o assunto, é a pergunta que respondem.

## `start/` — para começar

Leitura seguida, do princípio ao fim, sem voltar atrás. São duas horas e sais com o site a correr e com o percurso de um pedido na cabeça.

| Documento                        | Responde a                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| [overview.md](start/overview.md) | o que é isto, que peças tem, e o que te vai surpreender — dez minutos               |
| [flows.md](start/flows.md)       | por onde passa um pedido, um 404, um redirect e uma publicação, ficheiro a ficheiro |

Antes dos dois, o [README](../README.md) da raiz: escolher o tipo de projecto e pôr o site de pé.

## `reference/` — para consultar

Não se lê de seguida. Cada documento cobre um assunto por inteiro e é onde voltas quando vais mexer nele.

| Documento                                    | Assunto                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| [architecture.md](reference/architecture.md) | as camadas e a regra que as governa — imposta pelo lint, não por revisão          |
| [core.md](reference/core.md)                 | os contratos: `PageSource`, `SiteSource`, `PageDefinition`, `Module`              |
| [modules.md](reference/modules.md)           | um bloco do CMS a virar componente React, e o gerador                             |
| [renderer.md](reference/renderer.md)         | as três regiões, a degradação de um módulo e o sinal que ela emite                |
| [routing.md](reference/routing.md)           | URLs, locales, metadata, cabeçalhos, sitemap e robots                             |
| [providers.md](reference/providers.md)       | como se troca a origem de conteúdo                                                |
| [payload.md](reference/payload.md)           | o CMS: collections, acesso, cache, pré-visualização                               |
| [api.md](reference/api.md)                   | o provider de API externa e o que fica por escrever                               |
| [conventions.md](reference/conventions.md)   | onde pôr um ficheiro novo e como o nomear                                         |
| [upgrading.md](reference/upgrading.md)       | como um projecto traz para si o que a base mudou depois de ele nascer             |
| [guide.md](reference/guide.md)               | o projecto inteiro, ficheiro a ficheiro, com o porquê de cada linha — 3500 linhas |

O [guide.md](reference/guide.md) é a versão completa de tudo o que está acima. Lê-se com o editor aberto ao lado, e não numa tarde.

## A regra que mantém isto honesto

Cada ligação e cada âncora desta pasta é verificada pelo `pnpm check:links`, que corre no hook de pre-commit. Uma referência que apodreça chumba o commit — foi assim que estas duas vertentes puderam nascer de 270 ligações reescritas sem nenhuma ficar partida.
