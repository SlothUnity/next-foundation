const FOUNDATION_SCRIPTS = ['setup:provider', 'create:foundation'];

export interface ManifestInput {
  manifest: Record<string, unknown>;
  name: string;
}

export function isValidProjectName(name: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-._]*[a-z0-9])?$/.test(name) && name.length <= 214;
}

export function projectManifest({ manifest, name }: ManifestInput): Record<string, unknown> {
  const scripts = { ...((manifest.scripts as Record<string, string> | undefined) ?? {}) };

  for (const script of FOUNDATION_SCRIPTS) {
    delete scripts[script];
  }

  return {
    ...manifest,
    name,
    version: '0.1.0',
    scripts,
  };
}
