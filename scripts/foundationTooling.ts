/**
 * What belongs to the foundation and must not travel into a project.
 *
 * This list lives in one place because it was in three, and each time one was
 * updated the others were not: scripts/create broke after the eject removed
 * scripts/setup, and then scripts/verify broke the same way in a generated
 * project. Both were invisible until the shape matrix ran.
 */
export const FOUNDATION_DIRECTORIES = ['scripts/setup', 'scripts/create', 'scripts/verify'];

export const FOUNDATION_SCRIPTS = ['setup:provider', 'create:foundation', 'verify:shapes'];

export const NEVER_COPIED = ['.env.local'];

export function isFoundationOnly(tracked: string): boolean {
  return FOUNDATION_DIRECTORIES.some((directory) => tracked.startsWith(`${directory}/`));
}
