# KPathDB

[![npm version](https://img.shields.io/npm/v/kpathdb.svg)](https://www.npmjs.com/package/kpathdb)
[![Build Status](https://img.shields.io/github/actions/workflow/status/hacktails/kpathdb/ci.yml)](https://github.com/hacktails/kpathdb/actions)
[![License: MIT](https://img.shields.io/npm/l/kpathdb.svg)](LICENSE)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)
![IndexedDB](https://img.shields.io/badge/IndexedDB-3.0-33475B)

KPathDB is a lightweight, open-source ORM for IndexedDB built with TypeScript. It simplifies working with IndexedDB through an easy-to-use API, integrates robust schema validation with [Zod](https://github.com/colinhacks/zod), and includes vector search capabilities tailored for offline storage scenarios such as chat applications, LLMs, or ML model token management.

## Features

-   **IndexedDB ORM:** Simplify CRUD operations and schema management for IndexedDB.
-   **Schema Validation:** Utilize Zod for ensuring data integrity.
-   **Vector Search:** Perform vector similarity searches using cosine similarity, ideal for ML and chat agent use cases.
-   **TypeScript Support:** Written in TypeScript for strong typing and improved developer experience.
-   **Modern Build Tools:** Built with [Vite](https://vitejs.dev/) for fast development and optimized library bundling.
-   **Scalable Design:** Easily extendable to support multi-store transactions and plug-in vector search algorithms.
-   **React Hooks:** Provides convenient hooks for seamless integration with React applications.

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

### Basic Example with React Hooks

This example demonstrates how to use KPathDB's React hooks (`useQuery` and `useMutation`) to manage a simple Todo list.

```tsx
// TodoApp.tsx
import React from "react";
import { useQuery, useMutation } from "kpathdb";
import { z } from "zod";

// Define the schema for a Todo item
const TodoSchema = z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
    vector: z.array(z.number()).optional(), // Optional vector for embeddings
});

// Infer the TypeScript type from the Zod schema
type Todo = z.infer<typeof TodoSchema>;

const TodoApp: React.FC = () => {
    // Use the useQuery hook to fetch and manage the 'todos' data
    const { data: todos, refresh } = useQuery<Todo>("todos");
    // Use the useMutation hook for adding and updating todos
    const { mutate } = useMutation<Todo>("todos");

    // Function to simulate generating an embedding for a todo item
    const generateEmbedding = async (text: string): Promise<number[]> => {
        // Simulate an API call or computation to generate a vector embedding
        return Array.from({ length: 10 }, () => Math.random());
    };

    // Handler for adding a new todo
    const handleAdd = async (text: string) => {
        const newTodo: Todo = {
            id: crypto.randomUUID(),
            text,
            completed: false,
            vector: await generateEmbedding(text), // Generate and store the embedding
        };
        await mutate("add", newTodo);
        refresh(); // Refresh the todo list after adding
    };

    // Handler for toggling a todo's completion status
    const handleToggle = async (id: string) => {
        const todoToUpdate = todos.find((todo) => todo.id === id);
        if (todoToUpdate) {
            await mutate("update", { ...todoToUpdate, completed: !todoToUpdate.completed });
            refresh(); // Refresh the todo list after updating
        }
    };

    // Handler for deleting a todo
    const handleDelete = async (id: string) => {
        await mutate("delete", { id });
        refresh();
    };

    return (
        <div>
            <h1>Todo App</h1>
            <input
                type="text"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleAdd(e.currentTarget.value);
                        e.currentTarget.value = "";
                    }
                }}
                placeholder="Add a new todo..."
            />
            {todos.map((todo) => (
                <div key={todo.id}>
                    <input type="checkbox" checked={todo.completed} onChange={() => handleToggle(todo.id)} />
                    <span style={{ textDecoration: todo.completed ? "line-through" : "none" }}>{todo.text}</span>
                    <button onClick={() => handleDelete(todo.id)}>Delete</button>
                </div>
            ))}
        </div>
    );
};

export default TodoApp;
```

### Standalone Example (without React)

This example shows how to initialize and interact with KPathDB outside of a React component, demonstrating direct database operations.

```tsx
import { KPathDB } from "kpathdb";
import { z } from "zod";

// Define a Zod schema for message records
const MessageSchema = z.object({
    id: z.number().optional(), // Auto-incremented key; optional when adding
    text: z.string(),
    vector: z.array(z.number()),
    timestamp: z.number(),
});

// Database configuration with a "messages" store
const dbConfig = {
    name: "ChatDB",
    version: 1,
    stores: {
        messages: { keyPath: "id", autoIncrement: true, zodSchema: MessageSchema },
    },
};

// Initialize the database
const db = new KPathDB(dbConfig);

// Retrieve the "messages" store (automatically infers the data type)
const messageStore = db.getStore<(typeof MessageSchema)["_output"]>("messages");

// Example operations (you can perform these inside async functions)
async function performOperations() {
    // Add a new message
    const newMessage = {
        text: "Hello, world!",
        vector: [0.1, 0.2, 0.3], // Example vector
        timestamp: Date.now(),
    };
    const addedMessageId = await messageStore.add(newMessage);
    console.log("Added message with ID:", addedMessageId);

    // Retrieve all messages
    const allMessages = await messageStore.getAll();
    console.log("All messages:", allMessages);

    // Find messages similar to a given vector
    const targetVector = [0.15, 0.25, 0.35];
    const similarMessages = await messageStore.findSimilar(targetVector);
    console.log("Messages similar to", targetVector, ":", similarMessages);

    // Delete a message by ID
    await messageStore.delete(addedMessageId);
    console.log("Message with ID", addedMessageId, "deleted.");
}

performOperations().catch(console.error);
```

### Using `useVectorQuery` for Vector Search in React

This section demonstrates the usage of the `useVectorQuery` hook, which is specifically designed for performing vector-based similarity searches within your React components. This hook simplifies the process of finding items in your database that are most similar to a given vector, making it ideal for applications like recommendation systems or content-based filtering.

```tsx
import React from "react";
import { useVectorQuery } from "kpathdb";
import { z } from "zod";

// Define the schema for your data, including a vector field.
const ItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    vector: z.array(z.number()), // The vector field used for similarity search.
});

type Item = z.infer<typeof ItemSchema>;

const VectorSearchComponent: React.FC = () => {
    // Example target vector for the similarity search.
    const targetVector = [0.5, 0.7, 0.2];

    // Use the useVectorQuery hook to perform the similarity search.
    // 'items' is the name of your store, and targetVector is the vector you're comparing against.
    const { data: similarItems, isLoading } = useVectorQuery<Item>("items", targetVector);

    if (isLoading) {
        return <div>Loading similar items...</div>;
    }

    return (
        <div>
            <h1>Items similar to the target vector:</h1>
            {similarItems.map((item) => (
                <div key={item.id}>
                    <h2>{item.name}</h2>
                    {/* Display other item details here */}
                </div>
            ))}
        </div>
    );
};

export default VectorSearchComponent;
```

### Explanation

-   schema definition: you should have a vector field.
-   targetVector: This is the vector you want to find similar items to. You might generate this dynamically based on user input or other criteria.
-   useVectorQuery Hook: This hook takes the store name and the target vector as arguments. It returns the similar items found and a loading state.
-   Displaying Results: The component renders a loading message while the search is in progress and then displays the similar items found.

## API Reference

### `KPathDB`

The main class for interacting with the database.

-   **`constructor(config)`:** Initializes a new database instance.
    -   `config`: Configuration object specifying database name, version, and stores.
-   **`getStore(storeName)`:** Returns a store instance for performing operations.
    -   `storeName`: The name of the store to retrieve.

### Store Methods

Methods available on store instances returned by `getStore`. These methods are generic and should be used with the type of your Zod schema.

-   **`add(data)`:** Adds a new record to the store.
    -   `data`: The data to add, conforming to the store's schema.
-   **`get(key)`:** Retrieves a record by its key.
    -   `key`: The key of the record to retrieve.
-   **`getAll()`:** Retrieves all records from the store.
-   **`update(data)`:** Updates an existing record.
    -   `data`: The data to update, including the key.
-   **`delete(key)`:** Deletes a record by its key.
    -   `key`: The key of the record to delete.
-   **`findSimilar(vector, options)`:** Finds records similar to the given vector.
    -   `vector`: The vector to compare against.
    -   `options`: Optional parameters like `limit`.

### React Hooks

-   **`useQuery(storeName, queryKey?)`:** Hook for querying data.
    -   `storeName`: The name of the store to query.
    -   `queryKey`: Optional key for caching.
-   **`useMutation(storeName)`:** Hook for performing mutations (add, update, delete).
    -   `storeName`: The name of the store to perform mutations on.
-   **`useVectorQuery(storeName, targetVector, options?)`:** Hook for performing vector similarity searches.
    -   `storeName`: The name of the store.
    -   `targetVector`: The vector to search for similarity.
    -   `options`: Optional parameters, such as `limit`.

## Architecture Overview

Features demonstrated in TodoApp:

-   Real-time CRUD operations using React Hooks.
-   Automatic query refresh after mutations.
-   Integration with Zod for schema validation.
-   Vector field simulation for storing embeddings.

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

## Roadmap

-   [ ] **Web Workers Integration:** Offload vector calculations to Web Workers for improved performance.
-   [ ] **HNSW Algorithm:** Implement the Hierarchical Navigable Small World (HNSW) algorithm for approximate nearest neighbor search.
-   [ ] **Suspense API Integration:** Utilize React Suspense for smoother data fetching and loading states.
-   [ ] **WASM Acceleration:** Accelerate mathematical operations using WebAssembly.
-   [ ] **Cross-Tab Synchronization:** Implement mechanisms for synchronizing data across multiple browser tabs.
-   [ ] **Automatic Schema Migrations:** Develop utilities for handling schema changes and data migrations seamlessly.

## Contributing

We welcome contributions! Here are some areas where you can help:

1.  **IndexedDB Performance Optimizations:** Investigate and implement strategies for enhancing IndexedDB performance.
2.  **Additional Vector Search Algorithms:** Contribute implementations of different vector search algorithms.
3.  **React Server Components Integration:** Explore and integrate KPathDB with React Server Components.
4.  **Enhanced Testing Utilities:** Develop and improve testing utilities for easier and more comprehensive testing.

Please follow our [contribution guidelines](CONTRIBUTING.md).

## License

This project is licensed under the [MIT License](https://mit-license.org/).
