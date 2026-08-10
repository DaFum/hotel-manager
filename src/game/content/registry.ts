import type { ContentRecordBase } from "../../content-schema/common";
import type { ContentEntry } from "../../content-schema/contentPack";

function compareIds(a: ContentRecordBase, b: ContentRecordBase): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export class ContentRegistry {
  private readonly records = new Map<string, ContentRecordBase>();

  add<T extends ContentRecordBase>(record: T): void {
    if (this.records.has(record.id))
      throw new Error(`duplicate content id: ${record.id}`);
    this.records.set(record.id, deepFreeze(structuredClone(record)));
  }

  get<T extends ContentRecordBase>(id: string): T {
    const value = this.records.get(id);
    if (!value) throw new Error(`unknown content id: ${id}`);
    return value as T;
  }

  has(id: string): boolean {
    return this.records.has(id);
  }

  getByKind<K extends ContentEntry["kind"]>(
    id: string,
    kind: K,
  ): Extract<ContentEntry, { kind: K }> {
    const value = this.get<ContentEntry>(id);
    if (value.kind !== kind)
      throw new Error(`content id ${id} is ${value.kind}, not ${kind}`);
    return value as Extract<ContentEntry, { kind: K }>;
  }

  allByKind<K extends ContentEntry["kind"]>(
    kind: K,
  ): readonly Extract<ContentEntry, { kind: K }>[] {
    return this.all<ContentEntry>().filter(
      (entry): entry is Extract<ContentEntry, { kind: K }> =>
        entry.kind === kind,
    );
  }

  all<T extends ContentRecordBase = ContentRecordBase>(): readonly T[] {
    return [...this.records.values()].sort(compareIds) as T[];
  }
}
