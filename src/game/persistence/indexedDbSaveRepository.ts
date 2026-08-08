import { assertCompatible, type SaveEnvelope } from "./saveSchema";

const STORE = "saves";

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class IndexedDbSaveRepository {
  constructor(private databaseName: string) {}

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE))
          request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async withStore<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => Promise<T>,
  ): Promise<T> {
    const db = await this.open();
    try {
      return await run(db.transaction(STORE, mode).objectStore(STORE));
    } finally {
      db.close();
    }
  }

  async save(slot: string, envelope: SaveEnvelope): Promise<void> {
    assertCompatible(envelope);
    await this.withStore("readwrite", (store) =>
      promisify(store.put(structuredClone(envelope), slot)),
    );
  }

  async load(slot: string): Promise<SaveEnvelope | null> {
    const found = await this.withStore("readonly", (store) =>
      promisify<SaveEnvelope | undefined>(store.get(slot)),
    );
    if (!found) return null;
    assertCompatible(found);
    return found;
  }

  async listSlots(): Promise<string[]> {
    const keys = await this.withStore("readonly", (store) =>
      promisify(store.getAllKeys()),
    );
    return keys.map(String);
  }

  async deleteSlot(slot: string): Promise<void> {
    await this.withStore("readwrite", (store) => promisify(store.delete(slot)));
  }
}
