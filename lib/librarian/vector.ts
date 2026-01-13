export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) {
    throw new Error('Invalid vectors: must be non-empty arrays of equal length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

export interface VectorSearchResult {
  id: string;
  similarity: number;
}

export function rankBySimilarity(
  queryEmbedding: number[],
  documents: Array<{ id: string; embedding: number[] | null }>,
  threshold: number = 0.7
): VectorSearchResult[] {
  const results: VectorSearchResult[] = [];

  for (const doc of documents) {
    if (!doc.embedding) continue;

    try {
      const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
      
      if (similarity >= threshold) {
        results.push({
          id: doc.id,
          similarity,
        });
      }
    } catch (error) {
      console.warn(`Failed to calculate similarity for document ${doc.id}:`, error);
      continue;
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}

export function validateEmbedding(embedding: any): embedding is number[] {
  if (!Array.isArray(embedding)) {
    return false;
  }

  if (embedding.length === 0) {
    return false;
  }

  return embedding.every((val) => typeof val === 'number' && !isNaN(val));
}

export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude === 0) {
    return vector;
  }

  return vector.map((val) => val / magnitude);
}
