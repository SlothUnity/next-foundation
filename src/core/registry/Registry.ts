export class Registry<TKey, TValue> {
  protected readonly items = new Map<TKey, TValue>();

  protected add(key: TKey, value: TValue): void {
    if (this.items.has(key)) {
      throw new Error(`Registry already contains key "${String(key)}".`);
    }

    this.items.set(key, value);
  }

  get(key: TKey): TValue | undefined {
    return this.items.get(key);
  }

  has(key: TKey): boolean {
    return this.items.has(key);
  }

  remove(key: TKey): void {
    if (!this.items.has(key)) {
      throw new Error(`Key "${String(key)}" is not defined in the registry.`);
    }

    this.items.delete(key);
  }

  clear(): void {
    this.items.clear();
  }

  getAll(): TValue[] {
    return [...this.items.values()];
  }
}
