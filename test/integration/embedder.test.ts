import assert from "node:assert";
import { describe, it } from "node:test";
import { Embedder } from "../../src/embedder/embedder.js";

describe("embedder", () => {
  let embedder: Embedder;

  it("should load the model", async () => {
    embedder = await Embedder.load();
    assert.ok(embedder);
    assert.ok(embedder.maxTokens > 0);
  });

  it("should tokenize text", () => {
    const tokens = embedder.tokenize("hello world");
    assert.ok(Array.isArray(tokens));
    assert.ok(tokens.length > 0);
  });

  it("should embed a single text", async () => {
    const embedding = await embedder.embed("hello world");
    assert.ok(Array.isArray(embedding));
    assert.ok(embedding.length > 0);
    assert.strictEqual(typeof embedding[0], "number");
  });

  it("should return normalized embeddings", async () => {
    const embedding = await embedder.embed("test text");
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    assert.ok(Math.abs(magnitude - 1.0) < 0.01);
  });

  it("should embed a batch of texts", async () => {
    const embeddings = await embedder.embedBatch(["hello", "world"]);
    assert.strictEqual(embeddings.length, 2);
    assert.strictEqual(embeddings[0].length, embeddings[1].length);
  });

  it("should return empty array for empty batch", async () => {
    const embeddings = await embedder.embedBatch([]);
    assert.deepStrictEqual(embeddings, []);
  });

  it("should produce different embeddings for different texts", async () => {
    const [a, b] = await embedder.embedBatch([
      "javascript programming",
      "cooking recipes",
    ]);
    const same = a.every((v, i) => v === b[i]);
    assert.ok(!same);
  });
});
