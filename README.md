# KPathDB

[![npm version](https://img.shields.io/npm/v/kpathdb.svg)](https://www.npmjs.com/package/kpathdb)
[![Build Status](https://github.com/hacktails/kpathdb/actions/workflows/publish.yml/badge.svg)](https://github.com/hacktails/kpathdb/actions/workflows/publish.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)
![IndexedDB](https://img.shields.io/badge/IndexedDB-3.0-33475B)

KPathDB is a lightweight, open-source ORM for IndexedDB built with TypeScript. It simplifies working with IndexedDB through an easy-to-use API, integrates robust schema validation with [Zod](https://github.com/colinhacks/zod), and includes vector search capabilities tailored for offline storage scenarios such as chat applications, LLMs, or ML model token management.

## Features

- **IndexedDB ORM:** Simplify CRUD operations and schema management for IndexedDB.
- **Schema Validation:** Utilize Zod for ensuring data integrity.
- **Vector Search:** Perform vector similarity searches using cosine similarity, ideal for ML and chat agent use cases.
- **TypeScript Support:** Written in TypeScript for strong typing and improved developer experience.
- **Modern Build Tools:** Built with [Vite](https://vitejs.dev/) for fast development and optimized library bundling.
- **Scalable Design:** Easily extendable to support multi-store transactions and plug-in vector search algorithms.
- **React Hooks:** Provides convenient hooks for seamless integration with React applications.

## Installation

Using npm:

```bash
npm install kpathdb
```

Using yarn:

```bash
yarn add kpathdb
```

Using pnpm:

```bash
pnpm add kpathdb
```

## Usage

KPathDB is designed to work seamlessly within browser environments that support IndexedDB. Here's how to get started with KPathDB in your React projects:

### 1. Configure Your Database

First, define your database configuration:

```tsx
// db-config.ts
import { DBConfig } from "kpathdb";
import { z } from "zod";

// Optional: Define Zod schemas for your stores
const todoSchema = z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
});

export const dbConfig: DBConfig = {
    name: "MyAppDB",
    version: 1,
    stores: {
        todos: {
            keyPath: "id",
            zodSchema: todoSchema, // Optional: Add Zod schema
            indexes: ["completed"], // Optional: Define indexes
        },
        users: { keyPath: "id" }, // Simple store definition
    },
};
```

### 2. Set Up the DBProvider

Wrap your application with the `DBProvider` component:

```tsx
// App.tsx or main.tsx
import { DBProvider } from "kpathdb";
import { dbConfig } from "./db-config";

const App = () => {
    return (
        <DBProvider config={dbConfig}>
            {/* Your app components */}
            <TodoApp />
        </DBProvider>
    );
};

export default App;
```

### 3. Use KPathDB Hooks in Your Components

Now you can use the KPathDB hooks in any component within the `DBProvider`:

```tsx
// TodoApp.tsx
import React from "react";
import { useQuery, useMutation } from "kpathdb";

interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

const TodoApp: React.FC = () => {
    const { data: todos, refresh } = useQuery<Todo>("todos");
    const { mutate } = useMutation<Todo>("todos");

    const handleAdd = async (text: string) => {
        await mutate("add", {
            id: crypto.randomUUID(),
            text,
            completed: false,
        });
        refresh();
    };

    // ... rest of your component code
};
```

### Example with Partial Updates

KPathDB supports partial updates, allowing you to update specific fields without sending the entire object:

```tsx
const UserProfile: React.FC = () => {
    const { data: user, refresh } = useQuery<User>("users");
    const { mutate } = useMutation<User>("users");

    const updateUserTheme = async (userId: string, theme: "light" | "dark") => {
        await mutate(
            "update",
            {
                id: userId,
                preferences: { theme },
            },
            { partial: true } // Enable partial updates
        );
        refresh();
    };
};
```

## API Reference

### `KPathDB`

The main class for interacting with the database.

- **`constructor(config)`:** Initializes a new database instance.
    - `config`: Configuration object specifying database name, version, and stores.
- **`getStore(storeName)`:** Returns a store instance for performing operations.
    - `storeName`: The name of the store to retrieve.

### Store Methods

Methods available on store instances returned by `getStore`. These methods are generic and should be used with the type of your Zod schema.

- **`add(data)`:** Adds a new record to the store.
    - `data`: The data to add, conforming to the store's schema.
- **`get(key)`:** Retrieves a record by its key.
    - `key`: The key of the record to retrieve.
- **`getAll()`:** Retrieves all records from the store.
- **`update(data)`:** Updates an existing record.
    - `data`: The data to update, including the key.
- **`delete(key)`:** Deletes a record by its key.
    - `key`: The key of the record to delete.
- **`findSimilar(vector, options)`:** Finds records similar to the given vector.
    - `vector`: The vector to compare against.
    - `options`: Optional parameters like `limit`.

### React Hooks

KPathDB provides several React hooks for easy database interaction:

#### `useQuery<T>`

Hook for querying data from a store.

```tsx
const {
    data, // The queried data (type T[])
    error, // Error object if query fails
    loading, // Boolean indicating loading state
    refresh, // Function to manually refresh the data
} = useQuery<T>(storeName);
```

Parameters:

- `storeName`: Name of the store to query
- Generic `T`: Type of the data in the store

#### `useMutation<T>`

Hook for performing mutations (add/update/delete operations).

```tsx
const {
    mutate, // Function to perform mutations
    loading, // Boolean indicating operation in progress
    error, // Error object if mutation fails
} = useMutation<T>(storeName);

// Usage examples:
await mutate("add", newItem);
await mutate("update", updatedItem, { partial: true });
await mutate("delete", itemId);
```

Parameters:

- `storeName`: Name of the store to mutate
- Generic `T`: Type of the data in the store

Mutation Options:

- `partial`: Enable partial updates (only update specified fields)

#### `useStore<T>`

Low-level hook for direct store access.

```tsx
const store = useStore<T>(storeName);
// Access store methods directly
await store.add(data);
await store.update(data);
await store.delete(key);
```

### Database Configuration

#### Basic Configuration

```tsx
interface DBConfig {
    name: string; // Database name
    version: number; // Database version
    stores: {
        // Store configurations
        [key: string]: {
            keyPath: string; // Primary key field
            zodSchema?: z.ZodSchema; // Optional Zod schema
            indexes?: string[]; // Optional indexed fields
        };
    };
}
```

#### Example with Advanced Configuration

```tsx
import { z } from "zod";
import { DBConfig } from "kpathdb";

const userSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    profile: z.object({
        name: z.string(),
        age: z.number().min(0),
        preferences: z.object({
            theme: z.enum(["light", "dark"]),
            notifications: z.boolean(),
        }),
    }),
});

export const dbConfig: DBConfig = {
    name: "MyApp",
    version: 1,
    stores: {
        users: {
            keyPath: "id",
            zodSchema: userSchema,
            indexes: ["email"],
        },
        settings: {
            keyPath: "key",
        },
    },
};
```

### Error Handling

KPathDB provides structured error handling:

```tsx
const TodoList: React.FC = () => {
    const { data, error, loading } = useQuery<Todo>("todos");
    const { mutate, error: mutationError } = useMutation<Todo>("todos");

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    const handleAdd = async (todo: Todo) => {
        try {
            const success = await mutate("add", todo);
            if (!success) {
                console.error("Failed to add todo:", mutationError);
            }
        } catch (e) {
            console.error("Unexpected error:", e);
        }
    };
};
```

### TypeScript Integration

KPathDB is built with TypeScript and provides full type safety:

```tsx
// Define your types
interface User {
    id: string;
    email: string;
    profile: {
        name: string;
        age: number;
        preferences: {
            theme: "light" | "dark";
            notifications: boolean;
        };
    };
}

// Use with hooks
const { data: users } = useQuery<User>("users");
const { mutate } = useMutation<User>("users");

// Type-safe mutations
await mutate(
    "update",
    {
        id: "user-1",
        profile: {
            preferences: {
                theme: "dark", // TypeScript ensures valid theme value
            },
        },
    },
    { partial: true }
);
```

### Performance Considerations

1. **Indexing**

```tsx
const dbConfig: DBConfig = {
    stores: {
        users: {
            keyPath: "id",
            indexes: ["email", "username"], // Fields you frequently query
        },
    },
};
```

2. **Batch Operations**

```tsx
const batchUpdate = async (items: Item[]) => {
    for (const item of items) {
        await mutate("update", item);
    }
    refresh(); // Single refresh after all updates
};
```

3. **Partial Updates**

```tsx
// Prefer partial updates for large objects
await mutate(
    "update",
    {
        id: userId,
        lastSeen: new Date(),
    },
    { partial: true }
);
```

### Best Practices

1. **Schema Validation**

    - Always define Zod schemas for critical data stores
    - Include runtime type checking for user inputs

2. **Error Handling**

    - Implement proper error boundaries
    - Provide user-friendly error messages
    - Log errors for debugging

3. **Performance**

    - Use indexes for frequently queried fields
    - Implement pagination for large datasets
    - Use partial updates when possible

4. **Data Management**
    - Implement proper cleanup strategies
    - Handle version migrations
    - Regular data validation

### Migration Guide

#### Upgrading Database Version

```tsx
const dbConfig: DBConfig = {
    name: "MyApp",
    version: 2, // Increment version number
    stores: {
        users: {
            // ... updated store configuration
        },
    },
    migrations: {
        2: async (db) => {
            // Perform migration logic
            const store = db.getStore("users");
            const users = await store.getAll();
            // Update user data structure
        },
    },
};
```

## Architecture Overview

Features demonstrated in TodoApp:

- Real-time CRUD operations using React Hooks.
- Automatic query refresh after mutations.
- Integration with Zod for schema validation.
- Vector field simulation for storing embeddings.

## Performance Characteristics

| Operation     | Complexity | Notes                                          |
| ------------- | ---------- | ---------------------------------------------- |
| Add           | O(1)       | With Zod validation                            |
| Query         | O(n)       | Index-optimized                                |
| Vector Search | O(n\*d)    | d = vector dimensions, optimized with k-d tree |

## Testing Environment

To start the reference implementation and run tests:

```bash
npm run dev:test
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Avoiding Unnecessary Re-renders with `useQuery`

When using `useQuery`, you might encounter unnecessary re-renders if the query parameters or predicates change frequently. To mitigate this, use `React.useCallback` to memoize functions and `React.useMemo` for derived values.

**Example:**

```tsx
import React from "react";
import { useQuery } from "kpathdb";

interface Agent {
    id: string;
    name: string;
    status: string;
}

const AgentList: React.FC = () => {
    // Assume paramsPromise is a promise that resolves to the query parameters
    const params = React.use(paramsPromise);

    // Use useCallback to memoize the predicate function
    const predicate = React.useCallback((item: Agent) => item.id === params.agent, [params.agent]);

    // Use useQuery with the memoized predicate
    const { data: agents, loading, error } = useQuery<Agent>("agents", { predicate });

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <ul>
            {agents.map((agent) => (
                <li key={agent.id}>{agent.name}</li>
            ))}
        </ul>
    );
};
```

**Key Points:**

- **Memoization:** Use `React.useCallback` to memoize functions that are passed as dependencies to hooks like `useQuery`.
- **Performance:** This approach helps in reducing unnecessary re-renders by ensuring that the function reference remains stable unless its dependencies change.

#### 2. Handling Asynchronous Parameters

If your query parameters are derived from asynchronous operations, ensure they are resolved before using them in hooks.

**Example:**

```tsx
const fetchParams = async () => {
    // Simulate fetching parameters
    return { agent: "agent-123" };
};

const paramsPromise = fetchParams();

const params = React.use(paramsPromise);
```

**Key Points:**

- **Async Handling:** Use promises or async/await to handle asynchronous operations before using their results in hooks.

#### 3. Debugging Data Fetching Errors

If you encounter errors while fetching data, ensure that:

- The store name is correct and matches the configuration.
- The predicate function is correctly defined and does not throw errors.
- The database is properly initialized with `DBProvider`.

**Example:**

```tsx
const { data, error } = useQuery<Agent>("agents");

if (error) {
    console.error("Data fetching error:", error);
    return <div>Error: {error.message}</div>;
}
```

**Key Points:**

- **Error Logging:** Log errors to the console for easier debugging.
- **Validation:** Ensure that your database configuration and queries are correctly set up.

#### 4. Ensuring Proper Cleanup

When using hooks that involve side effects, ensure proper cleanup to avoid memory leaks.

**Example:**

```tsx
React.useEffect(() => {
    const subscription = someObservable.subscribe();

    return () => {
        subscription.unsubscribe();
    };
}, []);
```

**Key Points:**

- **Cleanup:** Always return a cleanup function from `useEffect` when subscribing to observables or adding event listeners.

By following these troubleshooting tips, you can optimize your use of KPathDB and React hooks, ensuring efficient and error-free data management in your applications.

## Roadmap

- [ ] **Web Workers Integration:** Offload vector calculations to Web Workers for improved performance.
- [ ] **HNSW Algorithm:** Implement the Hierarchical Navigable Small World (HNSW) algorithm for approximate nearest neighbor search.
- [ ] **Suspense API Integration:** Utilize React Suspense for smoother data fetching and loading states.
- [ ] **WASM Acceleration:** Accelerate mathematical operations using WebAssembly.
- [ ] **Cross-Tab Synchronization:** Implement mechanisms for synchronizing data across multiple browser tabs.
- [ ] **Automatic Schema Migrations:** Develop utilities for handling schema changes and data migrations seamlessly.

## Contributing

We welcome contributions! Here are some areas where you can help:

1.  **IndexedDB Performance Optimizations:** Investigate and implement strategies for enhancing IndexedDB performance.
2.  **Additional Vector Search Algorithms:** Contribute implementations of different vector search algorithms.
3.  **React Server Components Integration:** Explore and integrate KPathDB with React Server Components.
4.  **Enhanced Testing Utilities:** Develop and improve testing utilities for easier and more comprehensive testing.

Please follow our [contribution guidelines](CONTRIBUTING.md).

## License

This project is licensed under the [MIT License](https://mit-license.org/).
