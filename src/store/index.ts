import { z } from "zod";
import { VectorSearchAlgorithm } from "../types";
import { CosineSimilaritySearch } from "../vector-search";

export class Store<T> {
    private dbPromise: Promise<IDBDatabase>;
    private storeName: string;
    private schema?: z.ZodType<T>;
    private vectorSearchAlgorithm: VectorSearchAlgorithm<T>;

    constructor(dbPromise: Promise<IDBDatabase>, storeName: string, schema?: z.ZodType<T>) {
        this.dbPromise = dbPromise;
        this.storeName = storeName;
        this.schema = schema;
        this.vectorSearchAlgorithm = new CosineSimilaritySearch<T>();
    }

    setVectorSearchAlgorithm(algorithm: VectorSearchAlgorithm<T>) {
        this.vectorSearchAlgorithm = algorithm;
    }

    async add(record: T, tx?: IDBTransaction): Promise<IDBValidKey> {
        if (this.schema) {
            const result = this.schema.safeParse(record);
            if (!result.success) {
                throw new Error("Validation failed: " + JSON.stringify(result.error.issues));
            }
        }
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = tx ?? db.transaction(this.storeName, "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.add(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private handleIDBRequest<T>(request: IDBRequest<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                const error = request.error || new Error("Unknown IndexedDB error");
                console.error(`IDB operation failed: ${error.message}`);
                reject(error);
            };
        });
    }

    async get(key: IDBValidKey): Promise<T | undefined> {
        const db = await this.dbPromise;
        const tx = db.transaction(this.storeName, "readonly");
        const store = tx.objectStore(this.storeName);
        return this.handleIDBRequest(store.get(key));
    }

    async getAll(): Promise<T[]> {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, "readonly");
            const store = tx.objectStore(this.storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result as T[]);
            request.onerror = () => reject(request.error);
        });
    }

    async update(record: T, tx?: IDBTransaction): Promise<void> {
        if (this.schema) {
            const result = this.schema.safeParse(record);
            if (!result.success) {
                throw new Error("Validation failed: " + JSON.stringify(result.error.issues));
            }
        }
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = tx ?? db.transaction(this.storeName, "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.put(record);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async delete(key: IDBValidKey, tx?: IDBTransaction): Promise<void> {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = tx ?? db.transaction(this.storeName, "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async findSimilar(queryVector: number[], limit: number = 5): Promise<Array<{ record: T; score: number }>> {
        const records = await this.getAll();
        return this.vectorSearchAlgorithm.search(queryVector, records).slice(0, limit);
    }

    async createIndex(indexName: string, keyPath: string | string[], options?: IDBIndexParameters) {
        const db = await this.dbPromise;
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(this.storeName, "versionchange");
            const store = tx.objectStore(this.storeName);
            store.createIndex(indexName, keyPath, options);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async deleteIndex(indexName: string) {
        const db = await this.dbPromise;
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(this.storeName, "versionchange");
            const store = tx.objectStore(this.storeName);
            store.deleteIndex(indexName);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async query(
        predicate?: (record: T) => boolean,
        options?: {
            indexName?: string;
            range?: IDBKeyRange;
            direction?: IDBCursorDirection;
            limit?: number;
        }
    ): Promise<T[]> {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, "readonly");
            const store = tx.objectStore(this.storeName);
            const target = options?.indexName ? store.index(options.indexName) : store;
            const request = target.openCursor(options?.range, options?.direction);

            const results: T[] = [];
            request.onsuccess = (e) => {
                const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    if (!predicate || predicate(cursor.value)) {
                        results.push(cursor.value);
                    }
                    if (options?.limit && results.length >= options.limit) {
                        return resolve(results);
                    }
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async transaction<T>(mode: IDBTransactionMode, operation: (tx: IDBTransaction) => Promise<T>): Promise<T> {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, mode);
            tx.onabort = tx.onerror = () => reject(tx.error);

            operation(tx).then(resolve).catch(reject);
        });
    }
}
