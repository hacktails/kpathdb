import { z } from "zod";

/** Database configuration types */
export type StoreConfig<T> = {
    keyPath: string;
    autoIncrement?: boolean;
    indexes?: string[];
    zodSchema?: z.ZodType<any>;
    autoIndex?: (keyof T)[];
    vectorOptions?: VectorSearchOptions;
    cacheTTL?: number;
};

export type DBConfig = {
    name: string;
    version: number;
    stores: Record<string, StoreConfig<any>>;
};

export interface VectorSearchAlgorithm<T> {
    search(queryVector: number[], records: T[]): Array<{ record: T; score: number }>;
}

export interface VectorSearchOptions {
    vectorField: string;
    dimensions: number;
    indexType?: "flat" | "hnsw" | "ivf";
    metric?: "cosine" | "euclidean" | "dotproduct";
}
