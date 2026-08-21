/**
 * ⚡ MarkdownSemanticSplitter (markdown_semantic_splitter.ts)
 * 
 * Structure-Aware Hierarchical Semantic Chunker
 * Splits documents along Markdown headers (#, ##, ###), code blocks, tables, and sentence boundaries
 * with sliding-window overlap to eliminate context truncation at chunk seams.
 */

export interface TextChunk {
  id: string;
  filename: string;
  chunkIndex: number;
  content: string;
  startLine: number;
  endLine: number;
  charCount: number;
  headingContext: string;
  estimatedTokens: number;
}

export interface ChunkOptions {
  targetChunkSize?: number; // characters (~450 tokens)
  overlapSize?: number;     // characters (~90 tokens)
}

export class MarkdownSemanticSplitter {
  /**
   * Estimates token count (~4 chars per token average in mixed text)
   */
  public static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Chunks a markdown document into semantic, structure-aware pieces with overlapping boundaries
   */
  public static chunkDocument(
    fullText: string,
    filename = 'document.txt',
    options: ChunkOptions = {}
  ): TextChunk[] {
    const targetSize = options.targetChunkSize || 1800;
    const overlap = options.overlapSize || 350;

    if (!fullText || fullText.trim().length === 0) return [];
    
    if (fullText.length <= targetSize) {
      return [{
        id: `${filename}_chunk_0`,
        filename,
        chunkIndex: 0,
        content: fullText,
        startLine: 1,
        endLine: fullText.split('\n').length,
        charCount: fullText.length,
        headingContext: '',
        estimatedTokens: this.estimateTokens(fullText)
      }];
    }

    const lines = fullText.split('\n');
    const chunks: TextChunk[] = [];
    let currentChunkLines: string[] = [];
    let currentLength = 0;
    let currentHeading = '';
    let startLine = 1;
    let chunkIdx = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Track active markdown section headers
      if (/^#{1,4}\s+/.test(line)) {
        currentHeading = line.trim();
      }

      currentChunkLines.push(line);
      currentLength += line.length + 1;

      const isHardBoundary = line.trim() === '' || /^#{1,3}\s+/.test(line) || line.startsWith('```');

      if ((currentLength >= targetSize && isHardBoundary) || currentLength >= targetSize * 1.5 || i === lines.length - 1) {
        const content = currentChunkLines.join('\n');
        const alreadyHasHeader = currentHeading && content.trim().startsWith(currentHeading);
        const formattedContent = currentHeading && !alreadyHasHeader && !content.startsWith('[Section:') 
          ? `[Section: ${currentHeading}]\n${content}` 
          : content;

        chunks.push({
          id: `${filename}_chunk_${chunkIdx}`,
          filename,
          chunkIndex: chunkIdx,
          content: formattedContent,
          startLine,
          endLine: lineNum,
          charCount: formattedContent.length,
          headingContext: currentHeading,
          estimatedTokens: this.estimateTokens(formattedContent)
        });

        chunkIdx++;

        // Calculate overlapping lines for next chunk
        let overlapLen = 0;
        const overlapLines: string[] = [];
        for (let j = currentChunkLines.length - 1; j >= 0; j--) {
          const l = currentChunkLines[j];
          if (overlapLen + l.length > overlap) break;
          overlapLines.unshift(l);
          overlapLen += l.length + 1;
        }

        currentChunkLines = overlapLines;
        currentLength = overlapLen;
        startLine = Math.max(1, lineNum - overlapLines.length + 1);
      }
    }

    return chunks;
  }
}
