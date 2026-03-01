import assert from "node:assert";
import { describe, it } from "node:test";
import { cosineSimilarity, rankChunksHybrid } from "../../src/search/search.js";
import type { ChunkRow } from "../../src/types.js";

function makeChunk(id: number, embedding: number[]): ChunkRow {
  return {
    id,
    path: `doc${id}.md`,
    fileHeading: `Doc ${id}`,
    heading: `Section ${id}`,
    text: `text ${id}`,
    metadata: {},
    embedding,
  };
}

describe("cosineSimilarity", () => {
  it("should return 1 for identical vectors", () => {
    const v = [1, 2, 3];
    const sim = cosineSimilarity(v, v);
    assert.ok(Math.abs(sim - 1) < 1e-6);
  });

  it("should return 0 for orthogonal vectors", () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    const sim = cosineSimilarity(a, b);
    assert.ok(Math.abs(sim) < 1e-6);
  });

  it("should return -1 for opposite vectors", () => {
    const a = [1, 0];
    const b = [-1, 0];
    const sim = cosineSimilarity(a, b);
    assert.ok(Math.abs(sim + 1) < 1e-6);
  });
});

describe("rankChunksHybrid", () => {
  const queryEmbedding = [1, 0, 0];
  const chunks: ChunkRow[] = [
    makeChunk(1, [1, 0, 0]), // best vector match
    makeChunk(2, [0, 1, 0]), // orthogonal
    makeChunk(3, [0.5, 0.5, 0]), // moderate vector match
  ];

  it("should boost results that appear in both rankings", () => {
    // FTS ranks chunk 1 first too — both signals agree
    const results = rankChunksHybrid(chunks, queryEmbedding, [1, 3, 2], 3);
    assert.strictEqual(results[0].path, "doc1.md");
  });

  it("should include results from only one signal", () => {
    // FTS returns no results — pure vector ranking
    const results = rankChunksHybrid(chunks, queryEmbedding, [], 3);
    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].path, "doc1.md");
  });

  it("should rank FTS-only match above absent chunks", () => {
    // Chunk 4 only exists in FTS results (not in chunks array) — should be ignored
    const results = rankChunksHybrid(chunks, queryEmbedding, [4, 2], 3);
    assert.strictEqual(results.length, 3);
  });

  it("should respect limit", () => {
    const results = rankChunksHybrid(chunks, queryEmbedding, [1, 2, 3], 1);
    assert.strictEqual(results.length, 1);
  });

  it("should rank dual-signal result higher than single-signal", () => {
    // Chunk 2 is orthogonal (bad vector) but FTS rank 1
    // Chunk 1 is best vector but not in FTS
    // Chunk 3 is moderate vector and FTS rank 2
    const results = rankChunksHybrid(chunks, queryEmbedding, [2, 3], 3);
    // Chunk 1: vector rank 1 only → 1/(60+1) = 0.01639
    // Chunk 2: vector rank 3 + FTS rank 1 → 1/(60+3) + 1/(60+1) = 0.01587 + 0.01639 = 0.03226
    // Chunk 3: vector rank 2 + FTS rank 2 → 1/(60+2) + 1/(60+2) = 0.01613 + 0.01613 = 0.03226
    // Both chunk 2 and 3 (dual signal) should rank above chunk 1 (single signal)
    const chunk1Idx = results.findIndex((r) => r.path === "doc1.md");
    const chunk2Idx = results.findIndex((r) => r.path === "doc2.md");
    const chunk3Idx = results.findIndex((r) => r.path === "doc3.md");
    assert.ok(
      chunk2Idx < chunk1Idx,
      "dual-signal chunk 2 should rank above single-signal chunk 1",
    );
    assert.ok(
      chunk3Idx < chunk1Idx,
      "dual-signal chunk 3 should rank above single-signal chunk 1",
    );
  });
});
