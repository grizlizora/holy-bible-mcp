export function detectQueryLanguage(query) {
    const text = (query || "").toLowerCase();
    if (/[а-яєіїґ]/.test(text))
        return "ukr";
    if (/[ыэъё]/.test(text))
        return "rus";
    if (/[áéíóúñ¿¡]/.test(text))
        return "spa";
    if (/[äöüß]/.test(text))
        return "deu";
    if (/[éèêëàâùûç]/.test(text))
        return "fra";
    if (/[ąćęłńóśźż]/.test(text))
        return "pol";
    if (/[a-z]/.test(text))
        return "eng";
    return null;
}
export function evaluateQuestionComplexity(q, manualScore) {
    const text = (q || "").toLowerCase().trim();
    let score = 10;
    if (typeof manualScore === "number" && !isNaN(manualScore)) {
        score = Math.min(100, Math.max(0, Math.round(manualScore)));
    }
    else {
        const isVerseLookup = /^([1-3]?\s*[\p{L}\p{M}]{2,20})\s+\d+[:.]\d+/u.test(text);
        if (isVerseLookup) {
            return {
                complexity_score: 10,
                category: "Simple Verse Lookup",
                recommended_mode: "verses_only",
                recommended_mode_label: "📜 Verses Only",
                reason: "Direct verse coordinates search."
            };
        }
        const deepTopics = [
            "страждан", "теодіце", "пророцтв", "об'явлен", "даниїл", "есхатол", "триєдн", "троиц", "відкуплен", "вибранн", "предестинац",
            "suffer", "theodicy", "prophecy", "revelation", "daniel", "eschatol", "trinity", "redemption", "elect", "predestin"
        ];
        const detailedTopics = [
            "закон", "благодать", "депрес", "гріх", "прощен", "крипт", "крипто", "валют", "інвест", "грош", "багатст", "розлучен", "шлюб", "етик", "децентрал", "любов", "віра",
            "law", "grace", "depress", "sin", "forgiv", "crypt", "crypto", "currency", "invest", "money", "wealth", "divorce", "marriage", "ethic", "decentral", "love", "faith"
        ];
        let deepMatches = deepTopics.filter(k => text.includes(k)).length;
        let detailedMatches = detailedTopics.filter(k => text.includes(k)).length;
        if (deepMatches > 0 || text.includes("choho boh") || text.includes("why god") || text.length > 120) {
            score = Math.min(95, 75 + deepMatches * 10);
        }
        else if (detailedMatches > 0 || text.includes("should i") || text.includes("how to") || text.includes("chi varto")) {
            score = Math.min(75, 60 + detailedMatches * 5);
        }
        else if (text.length > 40) {
            score = 35;
        }
        else {
            score = 10;
        }
    }
    let recommended_mode = "medium";
    let recommended_mode_label = "⚖️ Medium";
    let category = "Everyday Biblical Inquiry";
    if (score <= 25) {
        recommended_mode = "minimal";
        recommended_mode_label = "⚡ Minimal";
        category = "Simple Direct Question";
    }
    else if (score <= 45) {
        recommended_mode = "short";
        recommended_mode_label = "📝 Short";
        category = "Short Thematic Question";
    }
    else if (score <= 65) {
        recommended_mode = "medium";
        recommended_mode_label = "⚖️ Medium";
        category = "Standard Biblical Inquiry";
    }
    else if (score <= 85) {
        recommended_mode = "detailed";
        recommended_mode_label = "🔍 Detailed";
        category = "In-Depth Thematic Inquiry";
    }
    else {
        recommended_mode = "deep";
        recommended_mode_label = "🏛️ Deep";
        category = "Complex Theological Study";
    }
    return {
        complexity_score: score,
        category,
        recommended_mode,
        recommended_mode_label,
        reason: `Question categorized as '${category}' based on semantics and topic complexity (score ${score}/100).`
    };
}
