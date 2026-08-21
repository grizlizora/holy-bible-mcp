export class WarmthRepository {
    warmthRanges = [];
    getAllWarmthRanges() {
        return this.warmthRanges;
    }
    registerWarmth(item) {
        this.warmthRanges.push(item);
    }
    resolveWarmth(score, lang = "ukr") {
        const bounded = Math.max(0, Math.min(100, score));
        const matched = this.warmthRanges.find(r => bounded >= r.minScore && bounded <= r.maxScore);
        const langKey = (lang === "eng" || lang === "en") ? "en" : (lang === "ru" ? "ru" : "uk");
        if (!matched) {
            return {
                levelId: "warm",
                score: bounded,
                label: langKey === "en" ? "Empathetic Pastoral" : "Теплий та пастирський",
                directive: "Respond with theological grounding, empathy, and pastoral warmth.",
                tempDeltaBias: 0.1,
                icon: "heart"
            };
        }
        return {
            levelId: matched.levelId,
            score: bounded,
            label: matched.labels?.[langKey] || matched.labels?.uk || "Пастирський",
            directive: matched.directives?.[langKey] || matched.directives?.uk || "",
            tempDeltaBias: matched.tempDeltaBias || 0,
            icon: matched.iconName || "heart"
        };
    }
    clear() {
        this.warmthRanges = [];
    }
}
