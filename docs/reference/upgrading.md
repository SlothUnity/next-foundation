# Trazer a base para um projecto

Um projecto começa como uma cópia desta foundation e divergem os dois: o projecto acrescenta módulos e conteúdo, a base corrige defeitos e acrescenta capacidades. Sem procedimento nenhum, um projecto com seis meses **não tem como saber o que lhe falta** — e foi exactamente isso que aconteceu antes de este documento existir.

São três peças: saber de onde partiste, ver o que mudou, e trazer o que interessa.

## 1. Saber de onde partiste

O [CHANGELOG.md](../../CHANGELOG.md) da base e o campo `version` do `package.json` dizem o que a base era num momento. Um projecto novo deve registar esse número — no primeiro commit, ou no seu próprio README — porque é ele que transforma «não sei o que mudou» em «mudou isto».

Se o projecto não o registou, o `git log` responde: o commit mais antigo que ele partilha com a base é o ponto de partida.

## 2. Ver o que mudou

A base fica como um remote, e não se toca nele senão para ler:

```bash
git remote add foundation <url-da-foundation>
git fetch foundation
git log --oneline HEAD..foundation/master
```

Depois o `CHANGELOG.md` da base, que é a versão em prosa da mesma lista, e diz **o que exige trabalho manual** — uma mudança de contrato não se resolve com um merge.

## 3. Trazer o que interessa

O caminho depende de como o projecto nasceu.

**Se nasceu com `pnpm setup:provider`** — clone da base, com o provider escolhido no lugar — há história partilhada, e o merge funciona:

```bash
git merge foundation/master
```

Conta com um tipo de conflito, e conta com ele em cada merge: **modify/delete**. A base mexeu num ficheiro que o `setup:provider` apagou no projecto — o provider que não escolheste, o `payload.config.ts`, um documento. O git não sabe qual dos dois lados quer, e a resposta é quase sempre manter apagado:

```bash
git rm <ficheiro>
```

Se em vez disso aceitares a versão da base, trazes de volta um provider que o projecto já não usa — e o lint das camadas ou o `typecheck` vão-te dizer, o que é melhor do que não dizer nada.

**Se nasceu de um gerador que copia ficheiros** sem história comum, não há merge possível: o que se faz é ler a lista do passo 2 e aplicar o que interessa, ficheiro a ficheiro ou por `git cherry-pick` de um commit da base que se aplique sozinho.

## 4. Correr o portão

Depois de qualquer merge, o portão inteiro — e não só os testes:

```bash
pnpm lint && pnpm typecheck && pnpm format:check && pnpm check:links && pnpm test --run
```

O `check:links` é o que apanha a documentação que ficou a apontar para ficheiros que o projecto não tem, e é o passo que mais vezes chumba depois de trazer mudanças de uma base que documenta mais do que o projecto guarda.

## A versão de Node é um requisito da árvore, e não do Next

O `engines` do Next 16 diz `>=20.9`, e é o número que apetece copiar. **Está errado para este repositório**, e a primeira corrida do CI provou-o: com Node 20, os 66 ficheiros de teste falharam antes de correr um único teste.

A cadeia, verificada no `node_modules`:

|                |                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `jsdom@30.0.1` | `engines: { node: "^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0" }` — não suporta Node 20                          |
| e depende de   | `undici ^8.9.0`                                                                                            |
| que chama      | `webidl.util.markAsUncloneable`, sobre a API de `node:worker_threads` que só existe desde o Node **22.10** |

No Node 20 o `undici` atira `TypeError: webidl.util.markAsUncloneable is not a function` ao carregar, o jsdom não inicializa, e **o worker do vitest morre antes de haver testes**. O erro não nomeia o Node em sítio nenhum — nomeia o `undici`, o que faz perder tempo à procura no lado errado.

Por isso o número vive em **dois sítios com papéis diferentes**:

|                             |             |                                                                                                                                                                           |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [.nvmrc](../../.nvmrc)      | `22.23.2`   | a versão **exacta**, pela mesma razão que o `packageManager` fixa o pnpm: o CI lê-a por `node-version-file`, e quem desenvolve corre a mesma. Subir é um commit que se vê |
| `engines` do `package.json` | `>=22.22.2` | o **piso**, que é o que o jsdom declara. Faz o `pnpm install` avisar quem estiver abaixo, em vez de deixar o erro do `undici` aparecer três passos depois                 |

Um é paridade, o outro é aviso. Sem o primeiro, o CI corria o 22 mais recente e uma máquina de desenvolvimento corria outro — que é precisamente como esta classe de defeito se esconde.

**Atenção a quem desenvolve em Windows:** o `nvm-windows` **não lê o `.nvmrc`**, ao contrário do `nvm` de Linux e macOS. Lá a versão instala-se pelo nome: `nvm install 22.23.2 && nvm use 22.23.2`.

Quando um projecto subir uma dependência de teste, é aqui que se confirma o que ela exige — `node -e "console.log(require('jsdom/package.json').engines)"` responde em segundos.

## O que a base não promete

**Compatibilidade de contratos.** O `PageDefinition`, o `PageSource` e o `Module` mudam quando há razão para mudar, e o CHANGELOG diz quando. A mudança das regiões `navigation` e `footer` de um módulo para uma lista é o exemplo: um merge cego passa o `typecheck` a chumbar, o que é o comportamento certo.

**Nada é retirado sem aparecer no CHANGELOG.** É a única garantia que interessa a quem tem de decidir se traz uma mudança ou não.
