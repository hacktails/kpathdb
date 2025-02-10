import React from "react";
import { Store } from "../store";
import { DBConfig } from "../types";

// Type definitions
interface DBContextType {
    getStore: <T>(name: string) => Store<T>;
    isInitialized: boolean;
    error?: Error;
}

type DatabaseOperation = "add" | "update" | "delete";

// Context creation
const DBContext = React.createContext<DBContextType | undefined>(undefined);

/**
 * Database provider component that initializes and manages database connections
 */
export const DBProvider: React.FC<{ config: DBConfig; children: React.ReactNode }> = ({ config, children }) => {
    const [state, setState] = React.useState<{
        isInitialized: boolean;
        error?: Error;
    }>({ isInitialized: false });

    const storesRef = React.useRef<Map<string, Store<unknown>>>(new Map());

    // Database initialization effect
    React.useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
            try {
                const { initializeDB } = await import("../db");
                const db = initializeDB(config);

                // Initialize stores
                const stores = new Map<string, Store<unknown>>();
                for (const [name, storeConfig] of Object.entries(config.stores)) {
                    stores.set(name, new Store(db, name, storeConfig.zodSchema));
                }

                if (isMounted) {
                    storesRef.current = stores;
                    setState({ isInitialized: true });
                }
            } catch (error) {
                if (isMounted) {
                    setState({
                        isInitialized: false,
                        error: error instanceof Error ? error : new Error("Database initialization failed"),
                    });
                }
            }
        };

        initialize();

        return () => {
            isMounted = false;
        };
    }, [config]);

    // Context value memoization
    const contextValue = React.useMemo<DBContextType>(
        () => ({
            getStore: <T,>(name: string) => {
                const store = storesRef.current.get(name);
                if (!store) throw new Error(`Store ${name} not found`);
                return store as Store<T>;
            },
            isInitialized: state.isInitialized,
            error: state.error,
        }),
        [state.isInitialized, state.error]
    );

    if (state.error) {
        return state.error.message;
    }

    if (!state.isInitialized) {
        return false;
    }

    return <DBContext.Provider value={contextValue}>{children}</DBContext.Provider>;
};

/**
 * Main database hook
 */
export const useDB = () => {
    const context = React.useContext(DBContext);
    if (!context) {
        throw new Error("useDB must be used within a DBProvider");
    }
    return context;
};

/**
 * Hook for accessing a specific store
 */
export const useStore = <T,>(name: string) => {
    const { getStore } = useDB();
    return React.useMemo(() => getStore<T>(name), [getStore, name]);
};

/**
 * Query hook with automatic refresh
 */
export const useQuery = <T,>(storeName: string, queryParams?: { predicate?: (item: T) => boolean }) => {
    const store = useStore<T>(storeName);
    const [queryState, setQueryState] = React.useState<{
        data: T[];
        loading: boolean;
        error?: Error;
    }>({ data: [], loading: true });

    const executeQuery = React.useCallback(async () => {
        try {
            setQueryState((prev) => ({ ...prev, loading: true }));
            const result = await store.query(queryParams?.predicate);
            setQueryState({ data: result, loading: false, error: undefined });
        } catch (error) {
            setQueryState({
                data: [],
                loading: false,
                error: error instanceof Error ? error : new Error("Query failed"),
            });
        }
    }, [store, queryParams?.predicate]);

    React.useEffect(() => {
        executeQuery();
    }, [executeQuery]);

    return {
        ...queryState,
        refresh: executeQuery,
    };
};

/**
 * Mutation hook with error handling
 */
export const useMutation = <T,>(storeName: string) => {
    const store = useStore<T>(storeName);
    const [mutationState, setMutationState] = React.useState<{
        loading: boolean;
        error?: Error;
    }>({ loading: false });

    const mutate = React.useCallback(
        async (operation: DatabaseOperation, item: T | IDBValidKey) => {
            try {
                setMutationState({ loading: true, error: undefined });

                switch (operation) {
                    case "add":
                        await store.add(item as T);
                        break;
                    case "update":
                        await store.update(item as T);
                        break;
                    case "delete":
                        await store.delete(item as IDBValidKey);
                        break;
                    default:
                        throw new Error("Invalid database operation");
                }

                setMutationState({ loading: false });
                return true;
            } catch (error) {
                const mutationError = error instanceof Error ? error : new Error("Database operation failed");
                setMutationState({ loading: false, error: mutationError });
                return false;
            }
        },
        [store]
    );

    return {
        mutate,
        ...mutationState,
    };
};
