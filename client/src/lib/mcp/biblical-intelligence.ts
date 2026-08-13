import { BibleMcpClient } from './mcp-client';
import { Logger } from './logger';

/**
 * UNIVERSAL DYNAMIC BIBLICAL INTELLIGENCE ENGINE
 *
 * Architecture Principles:
 * 1. Zero hardcoded keyword arrays or language-specific word lists.
 * 2. Dynamic FTS5 scripture retrieval directly from SQLite database via MCP.
 * 3. Universal Archetypal Framework — the LLM dynamically evaluates, discovers,
 *    and deduces non-obvious systemic connections for ANY topic in ANY language.
 */

export interface BiblicalIntelligenceResult {
    contextText: string;
    verseMap: Map<string, { book: string; chapter: number; verse: number; text: string }>;
    accuracyScore: number;
    accuracyLabel: string;
    complexityScore: number;
    category: string;
    appliedMode: string;
}

export async function buildBiblicalIntelligenceContext(
    question: string,
    modeKey: string,
    warmth: number,
    mcpClient: BibleMcpClient,
    safeParseJson: (str: string) => any
): Promise<BiblicalIntelligenceResult> {
    const defaultFallback: BiblicalIntelligenceResult = {
        contextText: "",
        verseMap: new Map(),
        accuracyScore: 80,
        accuracyLabel: "Базовий рівень",
        complexityScore: 60,
        category: "Повсякденне біблійне питання",
        appliedMode: modeKey || "medium"
    };

    try {
        const start = Date.now();
        const res: any = await mcpClient.callTool("build_biblical_context", { 
            question, 
            warmth, 
            modeKey 
        });
        Logger.mcp("build_biblical_context", { question }, Date.now() - start);

        if (res?.content?.[0]?.text) {
            const parsed = safeParseJson(res.content[0].text);
            
            // Reconstruct Map from plain JS object returned by MCP
            const verseMap = new Map<string, { book: string; chapter: number; verse: number; text: string }>();
            if (parsed.verseMap) {
                Object.keys(parsed.verseMap).forEach(key => {
                    verseMap.set(key, parsed.verseMap[key]);
                });
            }

            return {
                contextText: parsed.contextText || "",
                verseMap,
                accuracyScore: parsed.accuracyScore || 80,
                accuracyLabel: parsed.accuracyLabel || "Базовий рівень",
                complexityScore: parsed.complexityScore || 60,
                category: parsed.category || "Повсякденне біблійне питання",
                appliedMode: parsed.appliedMode || modeKey || "medium"
            };
        }
    } catch (e: any) {
        Logger.error("Biblical Intelligence Context (build_biblical_context) error:", e);
    }

    return defaultFallback;
}
