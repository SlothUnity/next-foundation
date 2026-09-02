import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import { format, getFileInfo, resolveConfig } from 'prettier';

import { applyPlan } from './applyPlan';
import { planRemoval } from './planRemoval';
import { isSetupProvider, setupProviders } from './Setup.types';
import type { SetupPlan, SetupProvider } from './Setup.types';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const descriptions: Record<SetupProvider, string> = {
  payload: 'Payload CMS in this app, on Postgres, with drafts and Live Preview.',
  api: 'An external CMS over HTTP. You write mapApiPage and createPageRequest.',
  mock: 'Hand-written pages, no database. For prototyping, not production.',
};

interface Flags {
  provider: SetupProvider | undefined;
  yes: boolean;
  dryRun: boolean;
  keep: boolean;
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { provider: undefined, yes: false, dryRun: false, keep: false };

  for (const argument of argv) {
    if (argument === '--yes' || argument === '-y') {
      flags.yes = true;
      continue;
    }

    if (argument === '--dry-run') {
      flags.dryRun = true;
      continue;
    }

    if (argument === '--keep') {
      flags.keep = true;
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

    throw new Error(`Unknown argument "${argument}".`);
  }

  return flags;
}

function assertCleanTree(): void {
  const status = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });

  if (status.trim() !== '') {
    throw new Error(
      'The working tree has uncommitted changes. Commit or stash them first, so everything this command does shows up as one readable git diff.',
    );
  }
}

async function askProvider(): Promise<SetupProvider> {
  const readline = createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log('Which kind of project is this?\n');

    for (const provider of setupProviders) {
      console.log(`  ${provider.padEnd(8)} ${descriptions[provider]}`);
    }

    console.log('');

    const answer = (await readline.question(`Provider [${setupProviders.join('/')}]: `)).trim();

    if (!isSetupProvider(answer)) {
      throw new Error(
        `Unknown provider "${answer}". Expected one of ${setupProviders.join(', ')}.`,
      );
    }

    return answer;
  } finally {
    readline.close();
  }
}

async function confirm(question: string): Promise<boolean> {
  const readline = createInterface({ input: process.stdin, output: process.stdout });

  try {
    const answer = (await readline.question(`${question} [y/N]: `)).trim().toLowerCase();

    return answer === 'y' || answer === 'yes';
  } finally {
    readline.close();
  }
}

function printPlan(plan: SetupPlan): void {
  console.log(`\nKeeping the ${plan.provider} provider. This is what changes:\n`);

  for (const operation of plan.operations) {
    console.log(`  ${operation.kind.padEnd(15)} ${operation.path}`);
    console.log(`  ${' '.repeat(15)} ${operation.why}`);
  }
}

async function formatTouchedFiles(plan: SetupPlan): Promise<void> {
  const touched = [
    ...new Set(
      plan.operations
        .filter((operation) => operation.kind !== 'delete')
        .map((operation) => operation.path),
    ),
  ];

  const ignorePath = path.join(root, '.prettierignore');

  for (const relative of touched) {
    const file = path.join(root, relative);

    const { ignored, inferredParser } = await getFileInfo(file, { ignorePath });

    if (ignored || !inferredParser) {
      continue;
    }

    const config = await resolveConfig(file);

    const source = readFileSync(file, 'utf8');

    writeFileSync(file, await format(source, { ...config, filepath: file }));
  }
}

function markdownFiles(): string[] {
  const docs = readdirSync(path.join(root, 'docs'))
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => `docs/${entry}`);

  return ['README.md', ...docs];
}

function reportDanglingReferences(names: string[]): void {
  if (names.length === 0) {
    return;
  }

  const hits: string[] = [];

  for (const file of markdownFiles()) {
    const lines = readFileSync(path.join(root, file), 'utf8').split('\n');

    lines.forEach((line, index) => {
      if (names.some((name) => line.includes(name))) {
        hits.push(`${file}:${index + 1}`);
      }
    });
  }

  if (hits.length === 0) {
    return;
  }

  console.log(
    `\nThese ${hits.length} lines still reference ${names.join(' or ')}, which is gone. They are prose, so read them rather than letting a script rewrite them:\n`,
  );

  for (const hit of hits) {
    console.log(`  ${hit}`);
  }
}

function printNotes(notes: string[]): void {
  if (notes.length === 0) {
    return;
  }

  console.log('\nWorth knowing:\n');

  for (const note of notes) {
    console.log(`  - ${note}`);
  }
}

function selfDestruct(): void {
  const manifest = path.join(root, 'package.json');

  const parsed = JSON.parse(readFileSync(manifest, 'utf8')) as {
    scripts?: Record<string, string>;
  };

  if (parsed.scripts) {
    delete parsed.scripts['setup:provider'];
  }

  writeFileSync(manifest, `${JSON.stringify(parsed, null, 2)}\n`);

  rmSync(path.join(root, 'scripts'), { recursive: true, force: true });
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));

  if (!flags.dryRun) {
    assertCleanTree();
  }

  const provider = flags.provider ?? (await askProvider());

  const plan = planRemoval(provider);

  printPlan(plan);

  if (flags.dryRun) {
    console.log('\nDry run: nothing was changed.');
    return;
  }

  if (!flags.yes && !(await confirm('\nApply this?'))) {
    console.log('Nothing was changed.');
    return;
  }

  applyPlan(plan, { root });

  await formatTouchedFiles(plan);

  reportDanglingReferences(plan.danglingReferencesTo);
  printNotes(plan.notes);

  if (!flags.keep) {
    selfDestruct();
  }

  console.log('\nDone. Now run:\n');
  console.log('  pnpm install');
  console.log('  pnpm lint && pnpm typecheck && pnpm test --run');
  console.log('\nThen read the git diff before committing.');
}

await main();
