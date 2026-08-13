import type { NodePlopAPI } from 'plop';

export default function generator(plop: NodePlopAPI): void {
  plop.setGenerator('Module', {
    description: 'Generate a new module with schema, types, and component files',

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
      {
        type: 'add',
        path: '../src/modules/{{pascalCase name}}/{{pascalCase name}}.module.ts',
        templateFile: './templates/module/module.module.hbs',
      },
      {
        type: 'add',
        path: '../src/modules/{{pascalCase name}}/{{pascalCase name}}.schema.ts',
        templateFile: './templates/module/module.schema.hbs',
      },
      {
        type: 'add',
        path: '../src/modules/{{pascalCase name}}/{{pascalCase name}}.style.scss',
        templateFile: './templates/module/module.style.hbs',
      },
      {
        type: 'add',
        path: '../src/modules/{{pascalCase name}}/{{pascalCase name}}.tsx',
        templateFile: './templates/module/module.hbs',
      },
      {
        type: 'add',
        path: '../src/modules/{{pascalCase name}}/{{pascalCase name}}.types.ts',
        templateFile: './templates/module/module.types.hbs',
      },
      {
        type: 'add',
        path: '../src/modules/{{pascalCase name}}/index.ts',
        templateFile: './templates/module/module.index.hbs',
      },
      {
        type: 'append',
        path: '../src/modules/index.ts',
        template: 'export { {{camelCase name}}Module } from "./{{pascalCase name}}"',
        unique: true,
      },
    ],
  });
}
