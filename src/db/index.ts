import { Store } from "../store";
import { DBConfig } from "../types";

export class KPathDB {
    private dbPromise: Promise<IDBDatabase>;
    private config: DBConfig;

    constructor(config: DBConfig) {
        this.config = config;
        this.dbPromise = this.openDB();
    }

    private openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.name, this.config.version);

            request.onupgradeneeded = () => {
                const db = request.result;
                Object.entries(this.config.stores).forEach(([storeName, storeConfig]) => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, {
                            keyPath: storeConfig.keyPath,
                            autoIncrement: storeConfig.autoIncrement,
                        });
                        if (storeConfig.indexes) {
                            storeConfig.indexes.forEach((index) => {
                                store.createIndex(index, index, { unique: false });
                            });
                        }
                    }
                });
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getStore<T>(storeName: string): Store<T> {
        const schema = this.config.stores[storeName]?.zodSchema;
        return new Store<T>(this.dbPromise, storeName, schema);
    }
}

export async function initializeDB(config: DBConfig): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(config.name, config.version);

        request.onupgradeneeded = () => {
            const db = request.result;
            Object.entries(config.stores).forEach(([name, storeConfig]) => {
                if (!db.objectStoreNames.contains(name)) {
                    const store = db.createObjectStore(name, {
                        keyPath: storeConfig.keyPath,
                        autoIncrement: storeConfig.autoIncrement,
                    });
                    storeConfig.indexes?.forEach((index) => store.createIndex(index, index));
                }
            });
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
