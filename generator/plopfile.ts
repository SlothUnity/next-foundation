import { existsSync } from 'node:fs';
import path from 'node:path';

import type { ActionType, NodePlopAPI } from 'plop';

/**
 * Gerador de módulos.
 *
 * Escreve sempre o módulo. O bloco do Payload **só** é escrito se o provider payload
 * existir neste projecto: uma foundation servida por `api` ou por `mocks` pode ter
 * apagado `src/providers/payload/` inteiro, e nesse caso um bloco não teria onde viver.
 *
 * Os templates vivem em `generator/templates/` e estão no `.prettierignore`: o parser
 * de handlebars do Prettier reescreve os `.hbs` e destrói a indentação do código que
 * eles geram.
 */
export default function generator(plop: NodePlopAPI): void {
  // `getPlopfilePath()` devolve a **pasta** do plopfile, não o ficheiro.
  const projectRoot = path.resolve(plop.getPlopfilePath(), '..');

  const blocksIndex = path.join(projectRoot, 'src/providers/payload/blocks/index.ts');

  // Testa o `index.ts` e não só a pasta: é nele que as duas âncoras `// plop:` vivem,
  // e sem elas não há onde registar o bloco.
  const hasPayloadBlocks = existsSync(blocksIndex);

  const moduleActions: ActionType[] = [
    {
      type: 'add',
      path: '../src/modules/{{pascalCase name}}/{{pascalCase name}}.tsx',
      templateFile: './templates/module/module.hbs',
    },
    {
      type: 'add',
      path: '../src/modules/{{pascalCase name}}/{{pascalCase name}}.schema.ts',
      templateFile: './templates/module/module.schema.hbs',
    },
    {
      type: 'add',
      path: '../src/modules/{{pascalCase name}}/{{pascalCase name}}.types.ts',
      templateFile: './templates/module/module.types.hbs',
    },
    {
      type: 'add',
      path: '../src/modules/{{pascalCase name}}/{{pascalCase name}}.module.ts',
      templateFile: './templates/module/module.module.hbs',
    },
    {
      type: 'add',
      path: '../src/modules/{{pascalCase name}}/{{pascalCase name}}.style.scss',
      templateFile: './templates/module/module.style.hbs',
    },
    {
      type: 'add',
      path: '../src/modules/{{pascalCase name}}/{{pascalCase name}}.test.tsx',
      templateFile: './templates/module/module.test.hbs',
    },
    {
      type: 'add',
      path: '../src/modules/{{pascalCase name}}/index.ts',
      templateFile: './templates/module/module.index.hbs',
    },
    {
      type: 'append',
      path: '../src/modules/index.ts',
      // Separador vazio e quebra de linha no fim: o append por omissão deixaria o
      // ficheiro sem newline final, e o `format:check` reprova-o.
      separator: '',
      template: "export { {{camelCase name}}Module } from './{{pascalCase name}}';\n",
      unique: true,
    },
  ];

  const payloadActions: ActionType[] = [
    {
      type: 'add',
      path: '../src/providers/payload/blocks/{{pascalCase name}}Block.ts',
      templateFile: './templates/module/block.hbs',
    },
    {
      // As âncoras `// plop: …` existem porque aqui são precisas duas inserções no
      // mesmo ficheiro — o import e a entrada no array — e um append cego só sabe
      // escrever no fim.
      type: 'append',
      path: '../src/providers/payload/blocks/index.ts',
      pattern: /\/\/ plop: import/,
      template: "import { {{pascalCase name}}Block } from './{{pascalCase name}}Block';",
      unique: true,
    },
    {
      type: 'append',
      path: '../src/providers/payload/blocks/index.ts',
      pattern: /\/\/ plop: block/,
      template: '  {{pascalCase name}}Block,',
      unique: true,
    },
  ];

  const closingNote: ActionType = hasPayloadBlocks
    ? () => 'Falta correr `pnpm payload:generate` para os tipos do Payload apanharem o bloco novo.'
    : () =>
        'Provider payload não encontrado — só o módulo foi criado. Liga-o à tua origem de conteúdo.';

  plop.setGenerator('Module', {
    description: 'Generate a new module: component, schema, types, styles, test and Payload block',

    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Module name: (e.g., Cta Block -> ctaBlock)',
        validate(value: string) {
          return value.trim().length > 0 || 'Please enter a valid module name.';
        },
      },
    ],

    actions: [...moduleActions, ...(hasPayloadBlocks ? payloadActions : []), closingNote],
  });
}
