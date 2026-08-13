import { BibleMcpClient } from './mcp-client';
import { Logger } from './logger';

function safeParseJson(str: string): any {
    if (!str) return {};
    try {
        return JSON.parse(str);
    } catch (e) {
        const match = (str || "").match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (err) {}
        }
        return {};
    }
}

export async function evaluateComplexityHybrid(
    question: string,
    mcpClient: BibleMcpClient
): Promise<{ score: number; category: string; recMode: string; recLabel: string }> {
    const startTime = Date.now();
    try {
        const evalRes: any = await mcpClient.callTool("evaluate_question", { question });
        if (evalRes && evalRes.content && Array.isArray(evalRes.content) && evalRes.content.length > 0) {
            const localResult = safeParseJson(evalRes.content[0].text);
            if (localResult && typeof localResult.complexity_score === "number") {
                const duration = Date.now() - startTime;
                Logger.info(`Question Evaluated (${duration}ms): "${question}" -> Score ${localResult.complexity_score}/100 [Mode: ${localResult.recommended_mode}]`);
                return {
                    score: localResult.complexity_score,
                    category: localResult.category || "Повсякденне біблійне питання",
                    recMode: localResult.recommended_mode || "medium",
                    recLabel: localResult.recommended_mode_label || "⚖️ Середньо"
                };
            }
        }
    } catch (e: any) {
        Logger.warn(`MCP evaluate_question failed, using fallback: ${e.message}`);
    }

    return {
        score: 60,
        category: "Повсякденне біблійне питання",
        recMode: "medium",
        recLabel: "⚖️ Середньо"
    };
}
