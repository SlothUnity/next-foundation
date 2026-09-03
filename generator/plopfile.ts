import { existsSync } from 'node:fs';
import path from 'node:path';

import type { ActionType, NodePlopAPI } from 'plop';

export default function generator(plop: NodePlopAPI): void {
  const projectRoot = path.resolve(plop.getPlopfilePath(), '..');

  const blocksIndex = path.join(projectRoot, 'src/providers/payload/blocks/index.ts');

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
      path: '../src/modules/{{pascalCase name}}/{{pascalCase name}}.definition.ts',
      templateFile: './templates/module/module.definition.hbs',
    },
    {
      type: 'add',
      path: '../src/modules/{{pascalCase name}}/{{pascalCase name}}.module.scss',
      templateFile: './templates/module/module.styles.hbs',
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
