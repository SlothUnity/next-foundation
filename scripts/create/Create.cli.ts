import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import { format, getFileInfo, resolveConfig } from 'prettier';

import { flattenDeadLinks } from '../links/flattenDeadLinks';

import { applyPlan } from '../setup/applyPlan';
import { planRemoval } from '../setup/planRemoval';
import { isSetupProvider, setupProviders } from '../setup/Setup.types';
import type { SetupPlan, SetupProvider } from '../setup/Setup.types';

import { projectFiles } from './foundationFiles';
import { isValidProjectName, projectManifest } from './projectManifest';

const foundation = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const descriptions: Record<SetupProvider, string> = {
  payload: 'Payload CMS in this app, on Postgres, with drafts and Live Preview.',
  api: 'An external CMS over HTTP. You write mapApiPage and createPageRequest.',
  mock: 'Hand-written pages, no database. For prototyping, not production.',
};

interface Flags {
  target: string | undefined;
  provider: SetupProvider | undefined;
  yes: boolean;
  noGit: boolean;
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { target: undefined, provider: undefined, yes: false, noGit: false };

  for (const argument of argv) {
    if (argument === '--yes' || argument === '-y') {
      flags.yes = true;
      continue;
    }

    if (argument === '--no-git') {
      flags.noGit = true;
      continue;
    }

    if (argument.startsWith('--provider=')) {
      const value = argument.slice('--provider='.length);

      if (!isSetupProvider(value)) {
        throw new Error(
          `Unknown provider "${value}". Expected one of ${setupProviders.join(', ')}.`,
        );
      }

      flags.provider = value;
      continue;
    }

    if (argument.startsWith('--')) {
      throw new Error(`Unknown argument "${argument}".`);
    }

    if (flags.target) {
      throw new Error(`Two directories given: "${flags.target}" and "${argument}".`);
    }

    flags.target = argument;
  }

  return flags;
}

async function ask(question: string): Promise<string> {
  const readline = createInterface({ input: process.stdin, output: process.stdout });

  try {
    return (await readline.question(question)).trim();
  } finally {
    readline.close();
  }
}

async function askProvider(): Promise<SetupProvider> {
  console.log('Which kind of project is this?\n');

  for (const provider of setupProviders) {
    console.log(`  ${provider.padEnd(8)} ${descriptions[provider]}`);
  }

  console.log('');

  const answer = await ask(`Provider [${setupProviders.join('/')}]: `);

  if (!isSetupProvider(answer)) {
    throw new Error(`Unknown provider "${answer}". Expected one of ${setupProviders.join(', ')}.`);
  }

  return answer;
}

function assertUsableTarget(target: string): void {
  if (!existsSync(target)) {
    return;
  }

  if (readdirSync(target).length > 0) {
    throw new Error(`${target} already exists and is not empty. Pick a directory that does not.`);
  }
}

function trackedFiles(): string[] {
  const listed = execFileSync('git', ['ls-files'], { cwd: foundation, encoding: 'utf8' });

  return listed.split('\n').filter((line) => line !== '');
}

function copyInto(target: string, files: string[]): void {
  for (const file of files) {
    const destination = path.join(target, file);

    mkdirSync(path.dirname(destination), { recursive: true });
    copyFileSync(path.join(foundation, file), destination);
  }
}

function writeManifest(target: string, name: string): void {
  const file = path.join(target, 'package.json');

  const manifest = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;

  writeFileSync(file, `${JSON.stringify(projectManifest({ manifest, name }), null, 2)}\n`);
}

async function formatTouched(target: string, plan: SetupPlan): Promise<void> {
  const touched = [
    'package.json',
    ...new Set(
      plan.operations
        .filter((operation) => operation.kind !== 'delete')
        .map((operation) => operation.path),
    ),
  ];

  const ignorePath = path.join(target, '.prettierignore');

  for (const relative of touched) {
    const file = path.join(target, relative);

    if (!existsSync(file)) {
      continue;
    }

    const { ignored, inferredParser } = await getFileInfo(file, { ignorePath });

    if (ignored || !inferredParser) {
      continue;
    }

    const config = await resolveConfig(file);

    writeFileSync(file, await format(readFileSync(file, 'utf8'), { ...config, filepath: file }));
  }
}

function initGit(target: string, provider: SetupProvider): void {
  execFileSync('git', ['init', '--quiet'], { cwd: target });
  execFileSync('git', ['add', '-A'], { cwd: target });
  execFileSync(
    'git',
    ['commit', '--quiet', '--no-verify', '-m', `chore: next-foundation, ${provider} provider`],
    { cwd: target },
  );
}

function reportBrokenLinks(target: string): void {
  const { flattened, remaining } = flattenDeadLinks(target);

  if (flattened > 0) {
    console.log(
      `\nFlattened ${flattened} link(s) that named files this provider does not have. The sentences are intact — only the links are gone, because their targets are.`,
    );
  }

  if (remaining.length === 0) {
    console.log('Every link in the documentation resolves.');

    return;
  }

  console.log(
    `\n${remaining.length} link(s) still do not resolve, and a script should not guess:\n`,
  );

  for (const { file, raw, reason } of remaining) {
    console.log(`  ${file} -> ${raw}  (${reason})`);
  }

  console.log('\n  pnpm check:links shows this list again at any time.');
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));

  const target = path.resolve(flags.target ?? (await ask('Directory for the new project: ')));

  const name = path.basename(target);

  if (!isValidProjectName(name)) {
    throw new Error(`"${name}" is not a usable package name. Lowercase, no spaces.`);
  }

  assertUsableTarget(target);

  const provider = flags.provider ?? (await askProvider());

  const files = projectFiles(trackedFiles());

  console.log(`\nCreating ${name} in ${target}`);
  console.log(`  provider   ${provider}`);
  console.log(`  files      ${files.length} copied from the foundation`);

  if (!flags.yes) {
    const answer = (await ask('\nGo ahead? [y/N]: ')).toLowerCase();

    if (answer !== 'y' && answer !== 'yes') {
      console.log('Nothing was written.');

      return;
    }
  }

  mkdirSync(target, { recursive: true });
  copyInto(target, files);

  const plan = planRemoval(provider);

  applyPlan(plan, { root: target });
  writeManifest(target, name);

  await formatTouched(target, plan);

  reportBrokenLinks(target);

  if (!flags.noGit) {
    initGit(target, provider);
  }

  if (plan.notes.length) {
    console.log('\nWorth knowing:\n');

    for (const note of plan.notes) {
      console.log(`  - ${note}`);
    }
  }

  console.log('\nDone. Now run:\n');
  console.log(`  cd ${path.relative(process.cwd(), target) || '.'}`);
  console.log('  pnpm install');
  console.log('  pnpm lint && pnpm typecheck && pnpm test --run');
  console.log('\nThe foundation was not touched.');
}

await main();
