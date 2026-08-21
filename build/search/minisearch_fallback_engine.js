import MiniSearch from "minisearch";
import { UkrainianMorphologyEngine } from "./morphology/ukrainian_morphology_engine.js";
export class MiniSearchFallbackEngine {
    static instance = null;
    miniSearch;
    isIndexed = false;
    constructor() {
        this.miniSearch = new MiniSearch({
            fields: ["text", "book"],
            storeFields: ["id", "book", "chapter", "verse", "text", "translation"],
            processTerm: (term) => {
                const lower = term.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
                return UkrainianMorphologyEngine.extractStem(lower);
            },
            searchOptions: {
                boost: { text: 2, book: 1 },
                fuzzy: 0.2,
                prefix: true,
                processTerm: (term) => {
                    const lower = term.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
                    return UkrainianMorphologyEngine.extractStem(lower);
                }
            }
        });
        this.prewarmCoreDoctrinalVerses();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new MiniSearchFallbackEngine();
        }
        return this.instance;
    }
    prewarmCoreDoctrinalVerses() {
        const coreVerses = [
            { id: "JHN.3.16", book: "JHN", chapter: 3, verse: 16, text: "Так бо Бог полюбив світ, що дав Сина Свого Однородженого, щоб кожен, хто вірує в Нього, не згинув, але мав життя вічне.", translation: "UBIO" },
            { id: "GEN.1.1", book: "GEN", chapter: 1, verse: 1, text: "На початку Бог створив Небо та землю.", translation: "UBIO" },
            { id: "PSA.23.1", book: "PSA", chapter: 23, verse: 1, text: "Господь то мій Пастир, тому в недостатку не буду.", translation: "UBIO" },
            { id: "ROM.8.28", book: "ROM", chapter: 8, verse: 28, text: "І знаємо, що тим, хто любить Бога, хто покликаний Його постановою, усе допомагає на добре.", translation: "UBIO" },
            { id: "PHP.4.6", book: "PHP", chapter: 4, verse: 6, text: "Ні про що не турбуйтесь, а в усьому нехай виявляються Богові ваші бажання молитвою й проханням з подякою.", translation: "UBIO" },
            { id: "ISA.53.5", book: "ISA", chapter: 53, verse: 5, text: "А Він був ранений за наші гріхи, за наші провини Він мучений був, кара на Ньому була за наш мир, Його ж ранами нас уздоровлено!", translation: "UBIO" },
            { id: "EPH.2.8", book: "EPH", chapter: 2, verse: 8, text: "Бо спасені ви благодаттю через віру, а це не від вас, то дар Божий.", translation: "UBIO" },
            { id: "REV.22.17", book: "REV", chapter: 22, verse: 17, text: "І Дух і невіста кажуть: Прийди! А хто чує, нехай каже: Прийди! І хто прагне, нехай прийде, і хто хоче, нехай воду життя бере дармо!", translation: "UBIO" }
        ];
        this.addDocuments(coreVerses);
    }
    addDocuments(docs) {
        if (docs.length === 0)
            return;
        this.miniSearch.addAll(docs);
        this.isIndexed = true;
    }
    search(query, limit = 30) {
        if (!this.isIndexed || !query.trim()) {
            return [];
        }
        try {
            const results = this.miniSearch.search(query);
            return results.slice(0, limit).map((r) => ({
                id: String(r.id),
                book: String(r.book),
                chapter: Number(r.chapter),
                verse: Number(r.verse),
                text: String(r.text),
                translation: String(r.translation || "UBIO")
            }));
        }
        catch (_) {
            return [];
        }
    }
    hasIndex() {
        return this.isIndexed;
    }
}
