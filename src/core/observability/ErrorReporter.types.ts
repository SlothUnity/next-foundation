export type ModuleFailure = 'not-registered' | 'invalid-data';

export interface ModuleErrorReport {
  alias: string;
  failure: ModuleFailure;
  cause?: unknown;
}

export type ErrorReporter = (report: ModuleErrorReport) => void;
