export interface BaseChunk {
  path: string;
  fileHeading: string;
  heading: string;
  text: string;
  metadata: Record<string, unknown>;
}

export interface ChunkRow extends BaseChunk {
  id: number;
  embedding: number[];
}

export interface SearchResult extends Omit<ChunkRow, "id" | "embedding"> {
  score: number;
}
