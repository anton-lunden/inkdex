import { basename } from "node:path";
import matter from "gray-matter";
import type { BaseChunk } from "../types.js";

const OVERLAP_RATIO = 0.1;
const SUB_SEPARATORS = [/^### /m, /\n\n/, /\. /];

export interface ChunkOptions {
  readonly maxTokens: number;
  readonly countTokens: (text: string) => number;
}

function extractH1(body: string): string | null {
  const match = body.match(/^# (.+)$/m);
  return match ? match[1].trim() : null;
}

function clean(text: string): string {
  return text
    .replace(/<!--.*?-->/gs, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitWithOverlap(
  text: string,
  separators: RegExp[],
  maxTokens: number,
  overlap: number,
  countTokens: (text: string) => number,
): string[] {
  if (countTokens(text) <= maxTokens) return [text];

  const separator = separators[0];
  const remaining = separators.slice(1);

  const parts = text.split(separator).filter((p) => p.trim());
  if (parts.length <= 1) {
    // Separator didn't help — try the next one
    if (remaining.length > 0) {
      return splitWithOverlap(text, remaining, maxTokens, overlap, countTokens);
    }
    // Last resort: hard split
    return hardSplit(text, maxTokens, overlap, countTokens);
  }

  const chunks: string[] = [];
  let current = "";

  for (const part of parts) {
    const combined = current ? `${current}\n\n${part}` : part;
    if (current && countTokens(combined) > maxTokens) {
      chunks.push(current.trim());
      // Start next chunk with overlap from the end of the previous
      const overlapText = current.slice(-overlap);
      current = overlapText + part;
    } else {
      current = combined;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // Recursively split any chunks that are still too large
  return chunks.flatMap((chunk) => {
    if (countTokens(chunk) <= maxTokens) return [chunk];
    if (remaining.length > 0) {
      return splitWithOverlap(
        chunk,
        remaining,
        maxTokens,
        overlap,
        countTokens,
      );
    }
    return hardSplit(chunk, maxTokens, overlap, countTokens);
  });
}

function hardSplit(
  text: string,
  maxTokens: number,
  overlap: number,
  countTokens: (text: string) => number,
): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (countTokens(next) > maxTokens && current) {
      chunks.push(current.trim());
      // Keep overlap from end of current chunk
      const overlapText = current.slice(-overlap);
      current = overlapText + word;
    } else {
      current = next;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

/** @package */
export function chunkMarkdown(
  content: string,
  path: string,
  options: ChunkOptions,
): BaseChunk[] {
  const { maxTokens, countTokens } = options;
  const overlap = Math.floor(maxTokens * OVERLAP_RATIO);
  const { data: metadata, content: body } = matter(content);
  const fileHeading = extractH1(body) || basename(path, ".md");
  const sections = body.split(/^## /m);
  const chunks: BaseChunk[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (!section.trim()) continue;

    let heading: string;
    let text: string;

    if (i === 0) {
      // Content before the first ## — strip the H1 line and use fileHeading
      heading = fileHeading;
      const withoutH1 = section.replace(/^# .+$/m, "");
      text = clean(withoutH1);
    } else {
      const [headingLine, ...rest] = section.split("\n");
      heading = headingLine.trim();
      text = clean(rest.join("\n"));
    }

    if (!text) continue;

    const subChunks = splitWithOverlap(
      text,
      SUB_SEPARATORS,
      maxTokens,
      overlap,
      countTokens,
    );

    for (const sub of subChunks) {
      chunks.push({
        path,
        fileHeading,
        heading,
        text: sub,
        metadata,
      });
    }
  }

  return chunks;
}
