// src/services/storageAdapter.ts
export class LocalVaultStorage {
  private dbName = 'ZeroLabz_QuantumEdge_DB';
  private storeName = 'crdt_vault';
  private db: IDBDatabase | null = null;

  public async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async putRecord(record: any): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getAllRecords(): Promise<any[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}