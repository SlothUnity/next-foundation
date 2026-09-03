import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import type { ActionType, NodePlopAPI } from 'plop';

import generator from './plopfile';

const generatorDir = path.dirname(fileURLToPath(import.meta.url));

const templatesDir = path.join(generatorDir, 'templates/module');

const require = createRequire(import.meta.url);

const handlebars = createRequire(require.resolve('plop'))(
  'handlebars',
) as typeof import('handlebars');

const words = (value: string): string[] =>
  value
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean);

const pascalCase = (value: string): string =>
  words(value)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

const camelCase = (value: string): string => {
  const pascal = pascalCase(value);

  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

handlebars.registerHelper('pascalCase', pascalCase);
handlebars.registerHelper('camelCase', camelCase);

const NAME = 'Verifica Estilo';

interface AddAction {
  type: 'add';
  path: string;
  templateFile: string;
}

function isAddAction(action: ActionType): action is AddAction {
  return typeof action === 'object' && 'type' in action && action.type === 'add';
}

function addActions(): AddAction[] {
  let captured: ActionType[] = [];

  const plop = {
    getPlopfilePath: () => generatorDir,
    setGenerator: (_name: string, config: { actions: ActionType[] }) => {
      captured = config.actions;
    },
  } as unknown as NodePlopAPI;

  generator(plop);

  return captured.filter(isAddAction);
}

function render(templateFile: string): string {
  const source = readFileSync(path.join(templatesDir, path.basename(templateFile)), 'utf8');

  return handlebars.compile(source)({ name: NAME });
}

describe('the module generator', () => {
  it('declares every template on disk, and every template it declares exists', () => {
    const declared = addActions().map((action) => path.basename(action.templateFile));

    expect([...declared].sort()).toEqual([...readdirSync(templatesDir)].sort());
  });

  it.each(readdirSync(templatesDir))('compiles %s and leaves no placeholder behind', (template) => {
    const output = render(template);

    expect(output).not.toContain('{{');
    expect(output.toLowerCase()).toContain(camelCase(NAME).toLowerCase());
  });

  it('writes the stylesheet where Next scopes it', () => {
    const styles = addActions().find((action) => action.templateFile.includes('styles'));

    expect(styles?.path).toMatch(/\.module\.scss$/);
  });

  it('wires the component to its own stylesheet, so a generated module is scoped by construction', () => {
    const component = render('module.hbs');

    const stylesheet = render('module.styles.hbs');

    expect(component).toContain(`import styles from './${pascalCase(NAME)}.module.scss';`);

    const used = /className=\{styles\.([A-Za-z0-9_]+)\}>/.exec(component);

    const declared = /^\.([A-Za-z0-9_]+) \{/m.exec(stylesheet);

    expect(used?.[1]).toBe(camelCase(NAME));

    expect(declared?.[1]).toBe(used?.[1]);
  });
});
