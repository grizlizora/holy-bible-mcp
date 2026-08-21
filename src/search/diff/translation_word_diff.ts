import { diffWordsWithSpace, Change } from "diff";

export interface WordDiffResult {
  diffMarkdown: string;
  wordChanges: Change[];
  addedWords: string[];
  removedWords: string[];
  similarityRatio: number;
}

export class TranslationWordDiff {
  public static computeWordDiff(
    baseTrans: string,
    baseText: string,
    targetTrans: string,
    targetText: string
  ): WordDiffResult {
    const changes: Change[] = diffWordsWithSpace(baseText, targetText);

    const addedWords: string[] = [];
    const removedWords: string[] = [];

    let unchangedCharCount = 0;
    let totalCharCount = 0;

    let inlineDiffText = "";
    for (const part of changes) {
      const len = part.value.length;
      totalCharCount += len;

      if (part.added) {
        addedWords.push(part.value.trim());
        inlineDiffText += `+[${part.value}]`;
      } else if (part.removed) {
        removedWords.push(part.value.trim());
        inlineDiffText += `-[${part.value}]`;
      } else {
        unchangedCharCount += len;
        inlineDiffText += part.value;
      }
    }

    const similarityRatio = totalCharCount > 0 ? (unchangedCharCount * 2) / (baseText.length + targetText.length) : 1;

    const diffMarkdown = `
\`\`\`diff
- [${baseTrans}] ${baseText}
+ [${targetTrans}] ${targetText}
\`\`\`

**Послівне порівняння (Word-level LCS):**
${inlineDiffText}
`.trim();

    return {
      diffMarkdown,
      wordChanges: changes,
      addedWords: addedWords.filter(Boolean),
      removedWords: removedWords.filter(Boolean),
      similarityRatio: Math.min(1, Math.max(0, similarityRatio))
    };
  }
}
