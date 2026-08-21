import { MultiDirectedGraph } from "graphology";
import { OSIS_ALIAS_MAP } from "../data/osis_dictionary.js";
export class TheologicalKnowledgeGraph {
    static instance = null;
    graph;
    isLoaded = false;
    constructor() {
        this.graph = new MultiDirectedGraph();
        this.seedDefaultCoreGraph();
    }
    static getInstance() {
        if (!TheologicalKnowledgeGraph.instance) {
            TheologicalKnowledgeGraph.instance = new TheologicalKnowledgeGraph();
        }
        return TheologicalKnowledgeGraph.instance;
    }
    seedDefaultCoreGraph() {
        const coreEdges = [
            {
                source: "GEN.3.15",
                target: "GAL.4.4",
                attr: {
                    category: "messianic_prophecy",
                    categoryLabel: "📜 Протоєвангеліє та виконання",
                    weight: 0.99,
                    theologicalSignificance: "Насіння жінки — народження Спасителя від діви"
                }
            },
            {
                source: "ISA.53.5",
                target: "1PE.2.24",
                attr: {
                    category: "messianic_prophecy",
                    categoryLabel: "📜 Замісна жертва Месії",
                    weight: 0.98,
                    theologicalSignificance: "Його ранами нас оздоровлено"
                }
            },
            {
                source: "PSA.22.1",
                target: "MAT.27.46",
                attr: {
                    category: "messianic_prophecy",
                    categoryLabel: "📜 Страждання на хресті",
                    weight: 0.98,
                    theologicalSignificance: "Боже мій, Боже мій, нащо Мене Ти покинув?"
                }
            },
            {
                source: "MIC.5.2",
                target: "MAT.2.1",
                attr: {
                    category: "messianic_prophecy",
                    categoryLabel: "📜 Місце народження Месії",
                    weight: 0.97,
                    theologicalSignificance: "Народження у Віфлеємі Юдейськім"
                }
            },
            {
                source: "PHP.4.6",
                target: "1PE.5.7",
                attr: {
                    category: "doctrinal_corroboration",
                    categoryLabel: "⚓ Доктринальна єдність",
                    weight: 0.95,
                    theologicalSignificance: "Покладання всіх турбот на Господа"
                }
            },
            {
                source: "JHN.3.16",
                target: "ROM.5.8",
                attr: {
                    category: "doctrinal_corroboration",
                    categoryLabel: "⚓ Жертовна любов Бога",
                    weight: 0.99,
                    theologicalSignificance: "Бог доводить Свою любов до нас тим, що Христос умер за нас"
                }
            }
        ];
        for (const e of coreEdges) {
            this.addEdge(e.source, e.target, e.attr);
        }
        this.isLoaded = true;
    }
    addEdge(source, target, attr) {
        if (!this.graph.hasNode(source)) {
            this.graph.addNode(source);
        }
        if (!this.graph.hasNode(target)) {
            this.graph.addNode(target);
        }
        this.graph.addEdge(source, target, attr);
    }
    normalizeOsis(rawOsis) {
        const parts = rawOsis.split(".");
        if (parts.length >= 3) {
            const book = parts[0].trim().toUpperCase();
            const normBook = OSIS_ALIAS_MAP[book] || book;
            return `${normBook}.${parts[1]}.${parts[2]}`;
        }
        return rawOsis;
    }
    getNeighbors(sourceOsis, category = "all", limit = 5) {
        const normSource = this.normalizeOsis(sourceOsis);
        if (!this.graph.hasNode(normSource)) {
            return [];
        }
        const results = [];
        this.graph.forEachOutEdge(normSource, (_, attr, __, target) => {
            if (category === "all" || attr.category === category) {
                results.push({
                    targetOsis: target,
                    category: attr.category,
                    categoryLabel: attr.categoryLabel,
                    weight: attr.weight,
                    theologicalSignificance: attr.theologicalSignificance
                });
            }
        });
        results.sort((a, b) => b.weight - a.weight);
        return results.slice(0, limit);
    }
    hydrateFromDirectives(prophecies, thematicChains) {
        let addedEdges = 0;
        // 1. Hydrate Messianic Prophecies
        for (const p of prophecies) {
            const source = this.normalizeOsis(p.prophecy_ref || p.prophecy?.osis || p.prophecy_osis || "");
            const target = this.normalizeOsis(p.fulfillment_ref || p.fulfillment?.osis || p.fulfillment_osis || "");
            if (source && target && source.includes(".") && target.includes(".")) {
                this.addEdge(source, target, {
                    category: "messianic_prophecy",
                    categoryLabel: `📜 ${p.topic_title || p.topic || "Месіанське пророцтво"}`,
                    weight: 0.98,
                    theologicalSignificance: p.theological_significance || p.theologicalSignificance || p.theological_focus || ""
                });
                addedEdges++;
            }
        }
        // 2. Hydrate Thematic Chains (Sequential Covenant Steps)
        for (const [theme, steps] of thematicChains.entries()) {
            if (Array.isArray(steps) && steps.length > 1) {
                for (let i = 0; i < steps.length - 1; i++) {
                    const current = this.normalizeOsis(steps[i]?.ref || steps[i]?.osis || "");
                    const next = this.normalizeOsis(steps[i + 1]?.ref || steps[i + 1]?.osis || "");
                    if (current && next && current.includes(".") && next.includes(".")) {
                        this.addEdge(current, next, {
                            category: "thematic_chain",
                            categoryLabel: `🔗 Тематичний ланцюг: ${theme}`,
                            weight: 0.92,
                            theologicalSignificance: steps[i + 1]?.significance || steps[i + 1]?.theological_link || `Етап: ${steps[i + 1]?.covenantStage || "Завіт"}`,
                            covenantEpoch: steps[i + 1]?.covenantStage
                        });
                        addedEdges++;
                    }
                }
            }
        }
        if (addedEdges > 0) {
            this.isLoaded = true;
        }
    }
    hasOsisNode(sourceOsis) {
        return this.graph.hasNode(this.normalizeOsis(sourceOsis));
    }
    getNodeCount() {
        return this.graph.order;
    }
    getEdgeCount() {
        return this.graph.size;
    }
}
