export interface DocLink {
  raw: string;
  target: string;
  anchor?: string;
}

const LINK = /\]\((?:<([^>]+)>|([^)\s]+))\)/g;

const HEADING = /^#{1,6}\s+(.+)$/gm;

const EXTERNAL = /^(?:https?:|mailto:|tel:|#!)/;

const FENCED = /^```[\s\S]*?^```/gm;

const INLINE_CODE = /`[^`\n]*`/g;

export function withoutCode(text: string): string {
  return text.replace(FENCED, '').replace(INLINE_CODE, '');
}

export function collectLinks(text: string): DocLink[] {
  const links: DocLink[] = [];

  for (const match of withoutCode(text).matchAll(LINK)) {
    const raw = match[1] ?? match[2];

    if (!raw || EXTERNAL.test(raw)) {
      continue;
    }

    const hash = raw.indexOf('#');

    if (hash === -1) {
      links.push({ raw, target: raw });
      continue;
    }

    links.push({
      raw,
      target: raw.slice(0, hash),
      anchor: raw.slice(hash + 1),
    });
  }

  return links;
}

export function slugify(heading: string): string {
  return heading
    .replace(/`|\*/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/ /g, '-');
}

export function headingSlugs(text: string): Set<string> {
  return new Set([...text.matchAll(HEADING)].map((match) => slugify(match[1] ?? '')));
}
