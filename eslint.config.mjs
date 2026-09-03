import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// architecture.md: tudo aponta para o core, e o core não aponta para ninguém.
// Cada grupo aqui é uma linha da tabela desse documento, imposta em vez de revista.

const NEXT = ['next', 'next/*'];
const PAYLOAD = ['payload', '@payloadcms/*', '@payload-config', '@payload-types'];

const layer = (name) => [`@/${name}`, `@/${name}/*`];

// O alias é a única forma de atravessar camadas neste repositório, portanto um `../../`
// seria a porta de serviço que as regras acima não veem. Fecha-se aqui.
const ESCAPE_HATCH = {
  group: ['../../**'],
  message: 'Atravessa camadas com o alias @/, para a fronteira ficar visível às regras de camada.',
};

const restrict = (...groups) => [
  'error',
  {
    patterns: groups.map(({ group, message }) => ({ group, message })),
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Default ignores of eslint-config-next, repeated because overriding them drops them.
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),

  {
    // O core é a camada de baixo: não conhece o framework, o CMS, nem quem o consome.
    // Excepção nomeada: os dois ficheiros da raiz de composição — ver architecture.md.
    files: ['src/core/**/*.{ts,tsx}'],
    ignores: ['src/core/foundation/foundation.ts', 'src/core/setup/registerModules.ts'],
    rules: {
      'no-restricted-imports': restrict(
        { group: NEXT, message: 'O core não conhece o Next. Passa o valor por argumento.' },
        { group: PAYLOAD, message: 'O core não conhece o Payload. Isto pertence a providers/.' },
        {
          group: layer('providers'),
          message: 'O core não conhece providers. Inverte a dependência.',
        },
        {
          group: layer('modules'),
          message: 'O core não conhece módulos concretos, só ModuleInstance.',
        },
        { group: layer('app'), message: 'O core não conhece a camada app.' },
        ESCAPE_HATCH,
      ),
    },
  },

  {
    // Um provider serve o core; não sabe quem o está a servir.
    files: ['src/providers/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict(
        {
          group: layer('app'),
          message: 'Um provider não conhece a camada app. Devolve dados, não rotas.',
        },
        ESCAPE_HATCH,
      ),
    },
  },

  {
    // Um módulo recebe dados por props e não sabe de onde vieram.
    files: ['src/modules/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict(
        {
          group: layer('providers'),
          message: 'Um módulo não conhece providers. Recebe dados por props.',
        },
        {
          group: PAYLOAD,
          message: 'Um módulo não conhece o CMS. O mapper do provider é que traduz.',
        },
        { group: layer('app'), message: 'Um módulo não conhece a camada app.' },
        ESCAPE_HATCH,
      ),
    },
  },

  {
    // O app compõe, mas não alcança a estrutura interna do CMS.
    files: ['src/app/**/*.{ts,tsx}'],
    ignores: ['src/app/(payload)/**', 'src/app/(frontend)/next/**'],
    rules: {
      'no-restricted-imports': restrict({
        group: PAYLOAD,
        message: 'O frontend fala com o CMS através de providers/, nunca com o SDK dele.',
      }),
    },
  },
]);

export default eslintConfig;
