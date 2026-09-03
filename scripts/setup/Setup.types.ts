export const setupProviders = ['payload', 'api', 'mock'] as const;

export type SetupProvider = (typeof setupProviders)[number];

export function isSetupProvider(value: string): value is SetupProvider {
  return setupProviders.some((provider) => provider === value);
}

export interface DeleteOperation {
  kind: 'delete';
  path: string;
  why: string;
}

export interface RemoveJsonKeysOperation {
  kind: 'removeJsonKeys';
  path: string;
  at: string[];
  keys: string[];
  why: string;
}

export interface RemoveLinesOperation {
  kind: 'removeLines';
  path: string;
  containing: string[];
  why: string;
}

export interface RemoveBlockOperation {
  kind: 'removeBlock';
  path: string;
  from: string;
  to: string;
  why: string;
}

export interface ReplaceOperation {
  kind: 'replace';
  path: string;
  find: string;
  replace: string;
  why: string;
}

export interface WriteOperation {
  kind: 'write';
  path: string;
  contents: string;
  why: string;
}

export type SetupOperation =
  | DeleteOperation
  | RemoveJsonKeysOperation
  | RemoveLinesOperation
  | RemoveBlockOperation
  | ReplaceOperation
  | WriteOperation;

export interface SetupPlan {
  provider: SetupProvider;
  operations: SetupOperation[];
  danglingReferencesTo: string[];
  notes: string[];
}
