import type { Embedder } from "../embedder/embedder.js";
import { getAllChunks, searchFts } from "../store/db.js";
import type { ChunkRow, SearchResult } from "../types.js";

/** @package */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const RRF_K = 60;

/** @package */
export function rankChunksHybrid(
  chunks: ChunkRow[],
  queryEmbedding: number[],
  ftsRankedIds: number[],
  limit: number,
): SearchResult[] {
  const vectorRanked = chunks
    .map((chunk) => ({
      chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const vectorRankMap = new Map<number, number>();
  for (let i = 0; i < vectorRanked.length; i++) {
    vectorRankMap.set(vectorRanked[i].chunk.id, i + 1);
  }

  const bm25RankMap = new Map<number, number>();
  for (let i = 0; i < ftsRankedIds.length; i++) {
    bm25RankMap.set(ftsRankedIds[i], i + 1);
  }

  const chunkById = new Map<number, ChunkRow>();
  for (const chunk of chunks) {
    chunkById.set(chunk.id, chunk);
  }

  const allIds = new Set<number>([
    ...vectorRankMap.keys(),
    ...bm25RankMap.keys(),
  ]);

  const scored: { chunk: ChunkRow; score: number }[] = [];
  for (const id of allIds) {
    const chunk = chunkById.get(id);
    if (!chunk) continue;

    const vectorRank = vectorRankMap.get(id);
    const bm25Rank = bm25RankMap.get(id);

    let score = 0;
    if (vectorRank !== undefined) score += 1 / (RRF_K + vectorRank);
    if (bm25Rank !== undefined) score += 1 / (RRF_K + bm25Rank);

    scored.push({ chunk, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ chunk, score }) => ({
      path: chunk.path,
      fileHeading: chunk.fileHeading,
      heading: chunk.heading,
      text: chunk.text,
      metadata: chunk.metadata,
      score,
    }));
}

export async function search(
  embedder: Embedder,
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const queryEmbedding = await embedder.embed(query);
  const chunks = getAllChunks();
  const ftsRankedIds = searchFts(query, chunks.length);
  return rankChunksHybrid(chunks, queryEmbedding, ftsRankedIds, limit);
}
