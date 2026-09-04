const EXCLUDED_PREFIXES = ['scripts/setup/', 'scripts/create/', 'scripts/links/checkLinks.test'];

const EXCLUDED_FILES = ['.env.local'];

export function isProjectFile(tracked: string): boolean {
  if (EXCLUDED_FILES.includes(tracked)) {
    return false;
  }

  return !EXCLUDED_PREFIXES.some((prefix) => tracked.startsWith(prefix));
}

export function projectFiles(tracked: string[]): string[] {
  return tracked.filter(isProjectFile);
}
