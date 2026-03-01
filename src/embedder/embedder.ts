import type { FeatureExtractionPipeline } from "@huggingface/transformers";
import { pipeline } from "@huggingface/transformers";

const MODEL = "Xenova/all-MiniLM-L6-v2";
const BATCH_SIZE = 32;

export class Embedder {
  readonly maxTokens: number;
  private readonly pipeline: FeatureExtractionPipeline;

  private constructor(pipe: FeatureExtractionPipeline) {
    this.pipeline = pipe;
    this.maxTokens = (pipe.tokenizer.model_max_length as number) ?? 256;
  }

  static async load(): Promise<Embedder> {
    const pipe = await pipeline<"feature-extraction">(
      "feature-extraction",
      MODEL,
    );
    return new Embedder(pipe);
  }

  tokenize(text: string): number[] {
    return this.pipeline.tokenizer.encode(text);
  }

  async embed(text: string): Promise<number[]> {
    const result = await this.pipeline(text, {
      pooling: "mean",
      normalize: true,
    });
    return (result.tolist() as number[][])[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const result = await this.pipeline(batch, {
        pooling: "mean",
        normalize: true,
      });
      results.push(...(result.tolist() as number[][]));
    }

    return results;
  }
}
