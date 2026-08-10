export interface ModuleSchema<TData = unknown> {
  parse(data: unknown): TData;
}
