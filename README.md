# KPathDB: IndexedDB React Abstraction with Vector Search

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)
![IndexedDB](https://img.shields.io/badge/IndexedDB-3.0-33475B)

A modern abstraction layer for IndexedDB with React hooks API, featuring:

-   Type-safe database operations with Zod validation
-   Vector similarity search capabilities
-   React 19 compatible hooks architecture
-   Transaction management and connection pooling
-   Comprehensive test environment with reference implementation

## Architecture Overview

Features demonstrated in TodoApp:

-   Real-time CRUD operations
-   Automatic query refresh
-   Error boundary integration
-   Vector field simulation
-   Transaction sequencing

## Performance Characteristics

| Operation     | Complexity | Notes                 |
| ------------- | ---------- | --------------------- |
| Add           | O(1)       | With Zod validation   |
| Query         | O(n)       | Index-optimized       |
| Vector Search | O(n\*d)    | d = vector dimensions |

## Testing Environment

Start the reference implementation:

```
npm run dev:test
```

## Usage Example

```tsx
// TodoApp.tsx
const { data: todos, refresh } = useQuery<Todo>("todos");
const { mutate } = useMutation<Todo>("todos");

const handleAdd = async (text: string) => {
    await mutate("add", {
        id: crypto.randomUUID(),
        text,
        completed: false,
        vector: await generateEmbedding(text),
    });
    refresh();
};
```

## Roadmap

-   [ ] Web Workers for vector calculations
-   [ ] HNSW approximate nearest neighbor
-   [ ] Suspense API integration
-   [ ] WASM-accelerated math operations
-   [ ] Cross-tab synchronization
-   [ ] Automatic schema migrations

## Contributing

We welcome contributions in these areas:

1. IndexedDB performance optimizations
2. Additional vector search algorithms
3. React Server Components integration
4. Enhanced testing utilities

Please follow our [contribution guidelines](CONTRIBUTING.md).

## License

MIT
