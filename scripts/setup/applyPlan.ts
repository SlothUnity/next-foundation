import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type {
  RemoveBlockOperation,
  RemoveJsonKeysOperation,
  RemoveLinesOperation,
  ReplaceOperation,
  SetupOperation,
  SetupPlan,
} from './Setup.types';

export interface ApplyContext {
  root: string;
}

function fail(operation: SetupOperation, detail: string): never {
  throw new Error(`${operation.kind} on ${operation.path} failed: ${detail}`);
}

function readText(file: string): string {
  return readFileSync(file, 'utf8');
}

function removeJsonKeys(file: string, operation: RemoveJsonKeysOperation): void {
  const document = JSON.parse(readText(file)) as Record<string, unknown>;

  let node = document;

  for (const segment of operation.at) {
    const next = node[segment];

    if (!next || typeof next !== 'object') {
      fail(operation, `there is no object at ${operation.at.join('.')}`);
    }

    node = next as Record<string, unknown>;
  }

  for (const key of operation.keys) {
    if (!(key in node)) {
      fail(operation, `${operation.at.join('.')} has no "${key}"`);
    }

    delete node[key];
  }

  writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
}

function removeLines(file: string, operation: RemoveLinesOperation): void {
  const kept: string[] = [];
  const matched = new Set<string>();

  for (const line of readText(file).split('\n')) {
    const needle = operation.containing.find((candidate) => line.includes(candidate));

    if (needle) {
      matched.add(needle);
      continue;
    }

    kept.push(line);
  }

  for (const needle of operation.containing) {
    if (!matched.has(needle)) {
      fail(operation, `no line contains "${needle}"`);
    }
  }

  writeFileSync(file, kept.join('\n'));
}

function removeBlock(file: string, operation: RemoveBlockOperation): void {
  const lines = readText(file).split('\n');

  const start = lines.findIndex((line) => line.includes(operation.from));

  if (start === -1) {
    fail(operation, `no line contains "${operation.from}"`);
  }

  const end = lines.findIndex((line, index) => index >= start && line.includes(operation.to));

  if (end === -1) {
    fail(operation, `no line after "${operation.from}" contains "${operation.to}"`);
  }

  const first = start > 0 && lines[start - 1] === '' ? start - 1 : start;

  lines.splice(first, end - first + 1);

  writeFileSync(file, lines.join('\n'));
}

function replace(file: string, operation: ReplaceOperation): void {
  const before = readText(file);

  if (!before.includes(operation.find)) {
    fail(operation, 'the text it replaces is not there');
  }

  writeFileSync(file, before.split(operation.find).join(operation.replace));
}

export function applyPlan(plan: SetupPlan, { root }: ApplyContext): void {
  for (const operation of plan.operations) {
    const target = path.join(root, operation.path);

    switch (operation.kind) {
      case 'delete':
        if (!existsSync(target)) {
          fail(operation, 'it is not there');
        }

        rmSync(target, { recursive: true, force: true });
        break;

      case 'removeJsonKeys':
        removeJsonKeys(target, operation);
        break;

      case 'removeLines':
        removeLines(target, operation);
        break;

      case 'removeBlock':
        removeBlock(target, operation);
        break;

      case 'replace':
        replace(target, operation);
        break;

      case 'write':
        writeFileSync(target, operation.contents);
        break;
    }
  }
}
