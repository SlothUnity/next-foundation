import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { setupProviders } from '../setup/Setup.types';
import type { SetupProvider } from '../setup/Setup.types';

const foundation = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// pnpm is a .cmd shim on Windows, and Node refuses to spawn one without a shell,
// so every call here goes through one. Paths are quoted for the same reason.
function pnpm(args: string[], cwd: string): void {
  execFileSync(`pnpm ${args.join(' ')}`, { cwd, stdio: 'pipe', shell: true });
}

function quote(value: string): string {
  return `"${value}"`;
}

const STEPS = ['lint', 'typecheck', 'check:links', 'check:quotes'] as const;

interface Result {
  provider: SetupProvider;
  failed: string[];
}

function passes(step: string, cwd: string): boolean {
  try {
    pnpm([step], cwd);

    return true;
  } catch {
    return false;
  }
}

function generate(provider: SetupProvider, into: string): string {
  const target = path.join(into, `shape-${provider}`);

  pnpm(
    [
      'exec',
      'tsx',
      'scripts/create/Create.cli.ts',
      quote(target),
      `--provider=${provider}`,
      '--yes',
    ],
    foundation,
  );

  return target;
}

function verify(provider: SetupProvider, into: string): Result {
  const target = generate(provider, into);

  pnpm(['install', '--no-frozen-lockfile', '--silent'], target);

  const failed = STEPS.filter((step) => !passes(step, target));

  return { provider, failed: [...failed] };
}

const workspace = mkdtempSync(path.join(tmpdir(), 'shapes-'));

const results: Result[] = [];

try {
  for (const provider of setupProviders) {
    process.stdout.write(`  ${provider.padEnd(8)} `);

    const result = verify(provider, workspace);

    results.push(result);

    console.log(result.failed.length === 0 ? 'verde' : `FALHA: ${result.failed.join(', ')}`);
  }
} finally {
  rmSync(workspace, { recursive: true, force: true });
}

const broken = results.filter((result) => result.failed.length > 0);

if (broken.length > 0) {
  console.error(`\n${broken.length} das ${results.length} formas não passam o portão.\n`);

  process.exit(1);
}

console.log(`\nAs ${results.length} formas passam ${STEPS.join(', ')}.`);
