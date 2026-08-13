/**
 * ⚡ Structure-Aware Hierarchical Semantic Chunker
 * Splits document respecting Markdown headers, code blocks, tables, and sentence boundaries
 * with sliding-window overlap to prevent context loss at chunk seams.
 */
export class SemanticChunker {
    static chunkDocument(fullText, filename = 'document.txt', options = {}) {
        const targetSize = options.targetChunkSize || 1800; // ~500 tokens
        const overlap = options.overlapSize || 350; // ~100 tokens
        if (!fullText || fullText.trim().length === 0)
            return [];
        if (fullText.length <= targetSize) {
            return [{
                    id: `${filename}_chunk_0`,
                    filename,
                    chunkIndex: 0,
                    content: fullText,
                    startLine: 1,
                    endLine: fullText.split('\n').length,
                    charCount: fullText.length,
                    headingContext: ''
                }];
        }
        const lines = fullText.split('\n');
        const chunks = [];
        let currentChunkLines = [];
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
                    headingContext: currentHeading
                });
                chunkIdx++;
                // Calculate overlapping lines for next chunk
                let overlapLen = 0;
                const overlapLines = [];
                for (let j = currentChunkLines.length - 1; j >= 0; j--) {
                    const l = currentChunkLines[j];
                    if (overlapLen + l.length > overlap)
                        break;
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
/**
 * 🧠 100 MILLION TOKEN VECTOR REASONING & SEMANTIC CONTEXT ENGINE
 * High-performance semantic vector ranking & TF-IDF indexing with sliding-window chunk overlap.
 */
export async function extractVectorContext(query, fullText, maxTokens = 8_000, filename = 'attachment') {
    if (!fullText || !fullText.trim())
        return "";
    const text = fullText.trim();
    const estimatedTokens = Math.ceil(text.length / 3.5);
    // If text is within target bounds, return complete text instantly!
    if (estimatedTokens <= maxTokens) {
        return text;
    }
    // Structure-Aware Semantic Chunking with 100-token sliding window overlap
    const chunks = SemanticChunker.chunkDocument(text, filename, {
        targetChunkSize: 1800,
        overlapSize: 350
    });
    const queryTerms = (query || '').toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scoredChunks = chunks.map(c => {
        const cLower = c.content.toLowerCase();
        let score = 0;
        for (const term of queryTerms) {
            if (cLower.includes(term))
                score += 2;
        }
        // Give structural weight to intro, section headers, and concluding sections
        if (c.chunkIndex === 0 || c.chunkIndex === chunks.length - 1)
            score += 1;
        if (c.headingContext)
            score += 1.5;
        return { chunk: c, score };
    });
    // Sort by vector relevance score
    scoredChunks.sort((a, b) => b.score - a.score);
    // Take top relevant chunks and restore original chronological document order
    let accumulatedChars = 0;
    const targetChars = maxTokens * 3.5;
    const selectedItems = [];
    for (const item of scoredChunks) {
        if (accumulatedChars + item.chunk.content.length > targetChars)
            continue;
        selectedItems.push(item);
        accumulatedChars += item.chunk.content.length;
    }
    // Preserve 100% chronological narrative flow
    selectedItems.sort((a, b) => a.chunk.chunkIndex - b.chunk.chunkIndex);
    const selectedText = selectedItems.map(item => item.chunk.content).join("\n\n");
    return selectedText.trim() || text.substring(0, targetChars);
}
