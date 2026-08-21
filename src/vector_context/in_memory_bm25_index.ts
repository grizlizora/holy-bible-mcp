/**
 * ⚡ InMemoryBm25Index (in_memory_bm25_index.ts)
 * 
 * High-performance in-memory BM25 index powered by MiniSearch.
 * Features:
 * - Weighted multi-field ranking (heading: 2.5x, content: 1.0x)
 * - Typo tolerance & prefix matching
 * - Sub-millisecond vector/lexical search evaluation
 */

import MiniSearch from 'minisearch';
import { TextChunk } from './markdown_semantic_splitter.js';

export class InMemoryBm25Index {
  private miniSearch: MiniSearch<TextChunk>;

  constructor(chunks: TextChunk[]) {
    this.miniSearch = new MiniSearch({
      fields: ['headingContext', 'content'],
      storeFields: ['id', 'filename', 'chunkIndex', 'content', 'headingContext', 'startLine', 'endLine'],
      searchOptions: {
        boost: { headingContext: 2.5, content: 1.0 },
        prefix: true,
        fuzzy: 0.2
      }
    });

    if (chunks.length > 0) {
      this.miniSearch.addAll(chunks);
    }
  }

  public search(query: string, maxResults = 10): Array<{ chunk: TextChunk; score: number }> {
    if (!query || !query.trim()) return [];
    const searchResults = this.miniSearch.search(query);

    return searchResults.slice(0, maxResults).map(res => ({
      chunk: {
        id: res.id,
        filename: res.filename,
        chunkIndex: res.chunkIndex,
        content: res.content,
        headingContext: res.headingContext,
        startLine: res.startLine,
        endLine: res.endLine,
        charCount: res.content?.length || 0,
        estimatedTokens: Math.ceil((res.content?.length || 0) / 4)
      },
      score: res.score
    }));
  }
}
