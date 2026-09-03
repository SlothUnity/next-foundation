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
}
