import type { NodePlopAPI } from 'plop';

/**
 * Gerador de módulos.
 *
 * Cobre os quatro passos de `docs/modules.md`: os ficheiros do módulo, o registo no
 * barrel, o bloco do Payload e a entrada em `pageBlocks`. O passo que **não** cobre é
 * o `pnpm generate:payload`, que tem de correr a seguir para os tipos do Payload
 * apanharem o bloco novo.
 *
 * Os templates vivem em `generator/templates/` e estão no `.prettierignore`: o parser
 * de handlebars do Prettier reescreve os `.hbs` e destrói a indentação do código que
 * eles geram.
 */
export default function generator(plop: NodePlopAPI): void {
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

    actions: [
      // --- O módulo ---
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

      // --- O bloco do Payload ---
      {
        type: 'add',
        path: '../src/providers/payload/blocks/{{pascalCase name}}Block.ts',
        templateFile: './templates/module/block.hbs',
      },
      {
        // As âncoras `// plop: …` em blocks/index.ts existem porque aqui são precisas
        // duas inserções no mesmo ficheiro — o import e a entrada no array — e um
        // append cego só sabe escrever no fim.
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

      () => 'Falta correr `pnpm generate:payload` para os tipos do Payload apanharem o bloco novo.',
    ],
  });
}
