export interface QuotedBlock {
  path: string;
  lines: string[];
  startLine: number;
}

export interface BlockCount {
  total: number;
  quoted: number;
}

const FENCE = /^ *(`{3,})([^\n]*)$/;

const ELISION = /^\s*(?:\/\/\s*)?(?:…|\.\.\.)\s*$/;

export function isElision(line: string): boolean {
  return ELISION.test(line);
}

const LOOKS_LIKE_PATH = /^[\w./()[\]-]+\/[\w./()[\]-]*\.\w+$/;

function pathFrom(info: string): string | undefined {
  return info
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .find((token) => LOOKS_LIKE_PATH.test(token));
}

export function readBlocks(text: string): { blocks: QuotedBlock[]; count: BlockCount } {
  const lines = text.split('\n');

  const blocks: QuotedBlock[] = [];

  let total = 0;
  let index = 0;

  while (index < lines.length) {
    const opening = FENCE.exec(lines[index] ?? '');

    if (!opening) {
      index += 1;
      continue;
    }

    const [, ticks = '', info = ''] = opening;

    const body: string[] = [];

    let cursor = index + 1;

    while (cursor < lines.length) {
      const line = lines[cursor] ?? '';

      if (line.trimStart().startsWith(ticks) && line.trim() === line.trim().replace(/[^`]/g, '')) {
        break;
      }

      body.push(line);
      cursor += 1;
    }

    total += 1;

    const path = pathFrom(info);

    if (path) {
      blocks.push({ path, lines: body, startLine: index + 1 });
    }

    index = cursor + 1;
  }

  return { blocks, count: { total, quoted: blocks.length } };
}

export function firstMismatch(block: string[], file: string[]): string | undefined {
  let cursor = 0;

  for (const raw of block) {
    if (raw.trim() === '' || isElision(raw)) {
      continue;
    }

    const wanted = raw.trim();

    const found = file.findIndex((line, at) => at >= cursor && line.trim() === wanted);

    if (found === -1) {
      return wanted;
    }

    cursor = found + 1;
  }

  return undefined;
}
