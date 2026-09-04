import { isFoundationOnly, NEVER_COPIED } from '../foundationTooling';

const EXCLUDED_FILES = [...NEVER_COPIED, 'scripts/links/checkLinks.test.ts'];

export function isProjectFile(tracked: string): boolean {
  if (EXCLUDED_FILES.includes(tracked)) {
    return false;
  }

  return !isFoundationOnly(tracked);
}

export function projectFiles(tracked: string[]): string[] {
  return tracked.filter(isProjectFile);
}
