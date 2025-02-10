import { VectorSearchAlgorithm } from "../types";

export class CosineSimilaritySearch<T> implements VectorSearchAlgorithm<T> {
    search(queryVector: number[], records: T[]): Array<{ record: T; score: number }> {
        return records
            .map((record) => {
                const vector: number[] = (record as any).vector;
                const score = cosineSimilarity(queryVector, vector);
                return { record, score };
            })
            .sort((a, b) => b.score - a.score);
    }
}

/** Helper function to calculate cosine similarity between two vectors */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dot = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return normA === 0 || normB === 0 ? 0 : dot / (normA * normB);
} 