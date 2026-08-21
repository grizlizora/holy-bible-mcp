import { formatScriptureVerse } from "../../../formatting.js";
import { DirectiveStore } from "../../../directives/directive_store.js";
export class PromptContextComposer {
    static compose(options) {
        const { question, detectedLang, paramSizeB, tier, tierName, effectiveMode, requestedMode, complexityScore, warmthControlEnabled, modesControlEnabled, sensInfo, verses } = options;
        const store = DirectiveStore.getInstance();
        const isCotAllowed = Boolean(tier.supportsCot && tier.supportsCot !== 0);
        const groundingHeader = store.getPromptModule("grounding_header") || "[HOLY BIBLE MCP ACTIVE GROUNDING]:";
        const groundingSource = store.getPromptModule("grounding_source") || "• Grounding Source: SQLite Canonical Scripture Database (5.88 GB, FTS5 Zero-Latency)";
        const criticalRules = store.getPromptModule("critical_rules");
        const warmthLine = (warmthControlEnabled && sensInfo)
            ? ("• Active Sensitivity & Warmth: " + (sensInfo.score || sensInfo.levelId) + "% (" + sensInfo.label + ")")
            : "• Warmth Control: DISABLED / OFF (Status: Inactive. If asked, report that Warmth Control is OFF and no sensitivity percentage applies).";
        const modeLine = (modesControlEnabled && effectiveMode !== "unrestricted")
            ? ("• Active Detail Mode: " + effectiveMode + " (" + (requestedMode === "auto" ? ("Auto-Resolved from Complexity " + complexityScore + "%") : "Manual") + ")")
            : "• Mode Control: DISABLED / OFF (Status: Inactive / Natural Unrestricted. If asked, report that Mode Control is OFF with zero length or structural caps).";
        const groundingLines = [
            groundingHeader,
            "• Model Tier Calibration: " + tierName + " (Detected: " + paramSizeB + "B parameters)",
            isCotAllowed
                ? ("• Thinking Protocol (CoT): Active (<think> enabled for " + tierName + ")")
                : "• Output Format: Direct, concise Markdown response.",
            warmthLine,
            modeLine,
            groundingSource
        ].filter(Boolean).join("\n");
        let modeText = "";
        if (modesControlEnabled && effectiveMode !== "unrestricted") {
            const modeObj = store.getMode(effectiveMode);
            if (modeObj) {
                modeText = "[MCP MODE DIRECTIVE — " + effectiveMode.toUpperCase() + "]:\n" + modeObj.structureMandate;
            }
        }
        else {
            const unrestrictedObj = store.getMode("unrestricted");
            if (unrestrictedObj) {
                modeText = "[MCP NATURAL RESPONSE DIRECTIVE]:\n" + unrestrictedObj.structureMandate;
            }
        }
        let warmthText = "";
        if (warmthControlEnabled && sensInfo) {
            warmthText = "[MCP SENSITIVITY & TONE DIRECTIVE (Warmth: " + (sensInfo.score || sensInfo.levelId) + "%, Level: " + sensInfo.label + ")]:\n" + sensInfo.directive;
        }
        const formattedVerses = verses.map((v) => {
            return formatScriptureVerse({ book: v.book, chapter: v.chapter, verse: v.verse, text: v.text, language: detectedLang }).formattedText;
        }).join("\n\n");
        const tierDirectiveText = tier.systemDirective || "";
        const scriptureBlock = formattedVerses
            ? `📜 Вірші з Біблії:\n${formattedVerses}`
            : `📜 Вірші з Біблії:\n${formatScriptureVerse({ book: '1JN', chapter: 4, verse: 7, text: 'Улюблені, любімо один одного, бо любов від Бога, і кожен, хто любить, родився від Бога і знає Бога.', language: detectedLang }).formattedText}\n\n${formatScriptureVerse({ book: '1COR', chapter: 13, verse: 4, text: 'Любов довготерпить, любов милосердствує, не заздрить, любов не величається, не гордиться.', language: detectedLang }).formattedText}`;
        return [
            groundingLines,
            tierDirectiveText,
            scriptureBlock,
            modeText,
            warmthText,
            criticalRules
        ].filter(Boolean).join("\n\n");
    }
}
