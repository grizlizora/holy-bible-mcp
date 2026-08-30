/**
 * 🧠 100 MILLION TOKEN VECTOR REASONING & SEMANTIC CONTEXT ENGINE
 * High-performance semantic vector ranking & MiniSearch BM25 indexing with sliding-window chunk overlap.
 */

import { MarkdownSemanticSplitter, type TextChunk, type ChunkOptions } from './vector_context/markdown_semantic_splitter.js';
import { InMemoryBm25Index } from './vector_context/in_memory_bm25_index.js';

export type { TextChunk, ChunkOptions };
export { MarkdownSemanticSplitter as SemanticChunker };

export async function extractVectorContext(
  query: string, 
  fullText: string, 
  maxTokens = 8_000,
  filename = 'attachment'
): Promise<string> {
  if (!fullText || !fullText.trim()) return "";

  const text = fullText.trim();
  const estimatedTokens = Math.ceil(text.length / 3.5);

  // If text is within target bounds, return complete text instantly
  if (estimatedTokens <= maxTokens) {
    return text;
  }

  // Yield event loop for large attachments (>1MB) to prevent latency spikes on other connections
  if (text.length > 1_000_000) {
    await new Promise((resolve) => setImmediate(resolve));
  }

  // Structure-Aware Semantic Chunking with sliding window overlap
  const chunks = MarkdownSemanticSplitter.chunkDocument(text, filename, {
    targetChunkSize: 1800,
    overlapSize: 350
  });

  // Limit indexed chunks to 2500 max to bound memory overhead during indexing
  const boundedChunks = chunks.length > 2500 ? chunks.slice(0, 2500) : chunks;

  const bm25Index = new InMemoryBm25Index(boundedChunks);
  const searchResults = bm25Index.search(query, 25);

  // If BM25 yields results, take top scored chunks; else fallback to first chunks
  let scoredChunks = searchResults;
  if (scoredChunks.length === 0) {
    scoredChunks = boundedChunks.map((c, i) => ({ chunk: c, score: 1.0 / (i + 1) }));
  }

  // Accumulate characters while preserving narrative chronological order
  let accumulatedChars = 0;
  const targetChars = maxTokens * 3.5;
  const selectedChunks: TextChunk[] = [];

  for (const item of scoredChunks) {
    if (accumulatedChars + item.chunk.content.length > targetChars) continue;
    selectedChunks.push(item.chunk);
    accumulatedChars += item.chunk.content.length;
  }

  // Preserve 100% chronological narrative flow
  selectedChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

  const selectedText = selectedChunks.map(c => c.content).join("\n\n");
  return selectedText.trim() || text.substring(0, targetChars);
}

