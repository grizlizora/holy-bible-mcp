import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function resolveDirectivesDbPath() {
    const candidatePaths = [
        process.env.DIRECTIVES_DB_PATH ? path.resolve(process.env.DIRECTIVES_DB_PATH) : null,
        path.resolve(process.cwd(), "data/directives.sqlite"),
        path.resolve(__dirname, "../../data/directives.sqlite"),
        path.resolve(__dirname, "../data/directives.sqlite"),
        path.resolve(__dirname, "data/directives.sqlite"),
        path.join(os.homedir(), ".mcp-hub", "servers", "Holy_Bible_Mcp", "data", "directives.sqlite"),
        path.join(os.homedir(), ".mcp-hub", "servers", "Holy_Bible_MCP", "data", "directives.sqlite"),
        path.join(os.homedir(), ".mcp-hub", "servers", "Holy_Bible_Mcp", "code", "data", "directives.sqlite"),
        path.join(os.homedir(), ".mcp-hub", "servers", "Holy_Bible_MCP", "code", "data", "directives.sqlite"),
        path.join(os.homedir(), ".bible-mcp", "directives.sqlite")
    ].filter(Boolean);
    for (const p of candidatePaths) {
        if (fs.existsSync(p))
            return p;
    }
    return path.resolve(process.cwd(), "data/directives.sqlite");
}
export class DirectiveStore {
    static instance = null;
    db = null;
    dbPath = "";
    // In-Memory O(1) Index Maps for 0.0ms lookup
    tierMap = new Map();
    tierRanges = [];
    modeMap = new Map();
    warmthRanges = [];
    metricsMap = new Map();
    modulesMap = new Map();
    metadataMap = new Map();
    // Open-Source Theological Knowledge Tables loaded from SQLite
    translationsMap = new Map();
    trenchMap = new Map();
    propheciesList = [];
    thematicChainsMap = new Map();
    isInitialized = false;
    constructor() { }
    static getInstance() {
        if (!DirectiveStore.instance) {
            DirectiveStore.instance = new DirectiveStore();
        }
        return DirectiveStore.instance;
    }
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db)
                return reject(new Error("Directives DB not initialized"));
            this.db.all(sql, params, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows || []);
            });
        });
    }
    /**
     * ⚡ Pure SQLite Reader: Opens pre-populated directives.sqlite and loads all tables into RAM in <2ms.
     * Contains ZERO hardcoded prompt strings or text templates.
     */
    async loadDirectives() {
        const startTime = performance.now();
        this.dbPath = resolveDirectivesDbPath();
        await new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    // If read-only fails because file doesn't exist, open readwrite
                    this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (e) => {
                        if (e)
                            reject(e);
                        else
                            resolve();
                    });
                }
                else {
                    resolve();
                }
            });
        });
        try {
            // 1. Fetch Model Tiers directly from SQLite
            const tierRows = (await this.query(`SELECT * FROM model_tier_directives ORDER BY min_param_size_b ASC`));
            this.tierMap.clear();
            this.tierRanges = [];
            for (const r of (tierRows || [])) {
                const obj = {
                    tierId: r.tier_id,
                    nameDisplay: r.name_display,
                    minParamSizeB: r.min_param_size_b,
                    maxParamSizeB: r.max_param_size_b,
                    defaultNumCtx: r.default_num_ctx,
                    defaultNumPredict: r.default_num_predict,
                    minP: r.min_p,
                    baseTemp: r.base_temp,
                    topP: r.top_p,
                    repeatPenalty: r.repeat_penalty,
                    frequencyPenalty: r.frequency_penalty,
                    presencePenalty: r.presence_penalty,
                    repeatLastN: r.repeat_last_n,
                    maxThinkChars: r.max_think_chars,
                    supportsCot: Boolean(r.supports_cot),
                    maxAllowedMode: r.max_allowed_mode,
                    systemDirective: r.system_directive,
                    thinkingDirective: r.thinking_directive
                };
                this.tierMap.set(obj.tierId, obj);
                this.tierRanges.push(obj);
            }
            // 2. Fetch Modes directly from SQLite
            const modeRows = (await this.query(`SELECT * FROM mode_directives`));
            this.modeMap.clear();
            for (const r of (modeRows || [])) {
                const obj = {
                    modeKey: r.mode_key,
                    displayNames: JSON.parse(r.display_names_json || "{}"),
                    descriptions: JSON.parse(r.descriptions_json || "{}"),
                    iconName: r.icon_name,
                    minWords: r.min_words,
                    maxWords: r.max_words,
                    maxVerses: r.max_verses,
                    complexityMin: r.complexity_min,
                    complexityMax: r.complexity_max,
                    structureMandate: r.structure_mandate,
                    templateBody: r.template_body,
                    accuracyMatrix: {
                        tier1: r.accuracy_tier1,
                        tier1_5: r.accuracy_tier1_5,
                        tier2: r.accuracy_tier2,
                        tier3: r.accuracy_tier3
                    }
                };
                this.modeMap.set(obj.modeKey, obj);
            }
            // 3. Fetch Warmth Ranges directly from SQLite
            const warmthRows = (await this.query(`SELECT * FROM warmth_directives ORDER BY min_score ASC`));
            this.warmthRanges = [];
            for (const r of (warmthRows || [])) {
                this.warmthRanges.push({
                    levelId: r.level_id,
                    minScore: r.min_score,
                    maxScore: r.max_score,
                    iconName: r.icon_name,
                    tempDeltaBias: r.temp_delta_bias,
                    labels: JSON.parse(r.labels_json || "{}"),
                    directives: JSON.parse(r.directive_text_json || "{}")
                });
            }
            // 4. Fetch Metrics Schemas directly from SQLite
            const metricsRows = (await this.query(`SELECT * FROM metrics_schemas`));
            this.metricsMap.clear();
            for (const r of (metricsRows || [])) {
                this.metricsMap.set(r.language_code.toLowerCase(), {
                    languageCode: r.language_code,
                    complexityTitle: r.complexity_title,
                    modeTitle: r.mode_title,
                    accuracyTitle: r.accuracy_title,
                    badgeTemplate: r.badge_template
                });
            }
            // 5. Fetch Prompt Modules directly from SQLite
            const moduleRows = (await this.query(`SELECT module_id, content FROM prompt_modules WHERE is_active = 1`));
            this.modulesMap.clear();
            for (const r of (moduleRows || [])) {
                this.modulesMap.set(r.module_id, r.content);
            }
            // 6. Fetch Translations Catalog directly from SQLite
            try {
                const transRows = (await this.query(`SELECT * FROM translations_catalog`));
                this.translationsMap.clear();
                for (const r of (transRows || [])) {
                    this.translationsMap.set(r.id.toUpperCase(), {
                        id: r.id,
                        name: r.name,
                        shortName: r.short_name,
                        languageCode: r.language_code,
                        year: r.year,
                        philosophy: r.philosophy,
                        textualBasis: r.textual_basis,
                        description: r.description
                    });
                }
            }
            catch (_) { }
            // 7. Fetch Trench Synonyms directly from SQLite
            try {
                const synRows = (await this.query(`SELECT * FROM trench_synonyms`));
                this.trenchMap.clear();
                for (const r of (synRows || [])) {
                    const entry = {
                        group: r.synonym_group,
                        distinction: r.distinction,
                        theologicalSignificance: r.theological_significance
                    };
                    this.trenchMap.set(r.strongs_id.toUpperCase(), entry);
                    const rawId = r.strongs_id.toUpperCase().replace(/^([GH])0+/, '$1');
                    this.trenchMap.set(rawId, entry);
                }
            }
            catch (_) { }
            // 8. Fetch Messianic Prophecies directly from SQLite
            try {
                const propRows = (await this.query(`SELECT * FROM messianic_prophecies`));
                this.propheciesList = (propRows || []).map((r) => ({
                    topic: r.topic,
                    topicTitle: r.topic_title,
                    prophecy: {
                        osis: r.prophecy_osis,
                        displayTitle: r.prophecy_display_title,
                        text: r.prophecy_text,
                        epochBCE: r.prophecy_epoch_bce
                    },
                    fulfillment: {
                        osis: r.fulfillment_osis,
                        displayTitle: r.fulfillment_display_title,
                        text: r.fulfillment_text,
                        epochCE: r.fulfillment_epoch_ce
                    },
                    timeGapYears: r.time_gap_years,
                    theologicalSignificance: r.theological_significance
                }));
            }
            catch (_) { }
            // 9. Fetch Thematic Chains directly from SQLite
            try {
                const chainRows = (await this.query(`SELECT * FROM thematic_chains ORDER BY theme ASC, step_number ASC`));
                this.thematicChainsMap.clear();
                for (const r of (chainRows || [])) {
                    const list = this.thematicChainsMap.get(r.theme.toLowerCase()) || [];
                    list.push({
                        step: r.step_number,
                        osis: r.osis,
                        displayTitle: r.display_title,
                        epoch: r.epoch,
                        textSnippet: r.text_snippet,
                        theologicalLink: r.theological_link
                    });
                    this.thematicChainsMap.set(r.theme.toLowerCase(), list);
                }
            }
            catch (_) { }
            // 10. Fetch Server Metadata directly from SQLite
            try {
                const metaRows = (await this.query(`SELECT key, value_json FROM server_metadata`));
                this.metadataMap.clear();
                for (const r of (metaRows || [])) {
                    this.metadataMap.set(r.key, JSON.parse(r.value_json || "{}"));
                }
            }
            catch (_) { }
            // 11. Fetch OSIS Book Dictionary and Aliases directly from SQLite
            try {
                const osisRows = (await this.query(`SELECT * FROM osis_book_dictionary`));
                const aliasRows = (await this.query(`SELECT * FROM osis_aliases`));
                if (osisRows && osisRows.length > 0) {
                    const { OSIS_BOOK_NAMES, OSIS_ALIAS_MAP, OSIS_BOOK_NUMBER } = await import("../data/osis_dictionary.js");
                    for (const r of osisRows) {
                        const osis = r.osis_code.toUpperCase();
                        OSIS_ALIAS_MAP[osis] = osis;
                        OSIS_BOOK_NUMBER[osis] = r.book_order;
                        if (!OSIS_BOOK_NAMES['ukr'])
                            OSIS_BOOK_NAMES['ukr'] = {};
                        if (!OSIS_BOOK_NAMES['eng'])
                            OSIS_BOOK_NAMES['eng'] = {};
                        if (!OSIS_BOOK_NAMES['rus'])
                            OSIS_BOOK_NAMES['rus'] = {};
                        if (r.name_ukr)
                            OSIS_BOOK_NAMES['ukr'][osis] = r.name_ukr;
                        if (r.name_eng)
                            OSIS_BOOK_NAMES['eng'][osis] = r.name_eng;
                        if (r.name_rus)
                            OSIS_BOOK_NAMES['rus'][osis] = r.name_rus;
                    }
                    for (const a of (aliasRows || [])) {
                        OSIS_ALIAS_MAP[a.alias.toUpperCase()] = a.osis_code.toUpperCase();
                    }
                }
            }
            catch (_) { }
            this.isInitialized = true;
            const elapsed = (performance.now() - startTime).toFixed(2);
            console.error(`[DIRECTIVE-ENGINE] ✅ Loaded dedicated Directives DB (${this.dbPath}) in ${elapsed}ms.`);
        }
        catch (e) {
            console.error("[DIRECTIVE-ENGINE ERROR]", e);
        }
    }
    // ==========================================================================
    // ZERO-LATENCY RESOLVERS (0.0ms Lookup Time from SQLite Cache)
    // ==========================================================================
    getTranslations() {
        const res = {};
        for (const [k, v] of this.translationsMap.entries()) {
            res[k] = v;
        }
        return res;
    }
    getTranslation(id) {
        return this.translationsMap.get(id.toUpperCase());
    }
    getTrenchSynonym(strongsId) {
        const norm = strongsId.trim().toUpperCase();
        const letter = norm[0] || 'G';
        const numPart = parseInt(norm.slice(1), 10) || 1;
        const padded = letter + String(numPart).padStart(4, '0');
        const raw = letter + String(numPart);
        return this.trenchMap.get(padded) || this.trenchMap.get(raw) || this.trenchMap.get(norm);
    }
    getMessianicProphecies(topic) {
        if (!topic || topic === 'all')
            return [...this.propheciesList];
        const clean = topic.toLowerCase();
        return this.propheciesList.filter(p => p.topic.toLowerCase().includes(clean) ||
            p.prophecy.osis.toLowerCase().includes(clean) ||
            p.fulfillment.osis.toLowerCase().includes(clean));
    }
    getThematicChain(theme) {
        const clean = theme.toLowerCase();
        for (const [k, list] of this.thematicChainsMap.entries()) {
            if (clean.includes(k) || k.includes(clean))
                return list;
        }
        return this.thematicChainsMap.get("seed_of_faith") || [];
    }
    resolveTierByParamSize(paramSizeB) {
        for (const tier of this.tierRanges) {
            if (paramSizeB >= tier.minParamSizeB && (tier.maxParamSizeB === null || paramSizeB < tier.maxParamSizeB)) {
                return tier;
            }
        }
        return this.tierMap.get('tier3') || this.tierRanges[this.tierRanges.length - 1];
    }
    getTier(tierId) {
        return this.tierMap.get(tierId);
    }
    getMode(modeKey) {
        return this.modeMap.get(modeKey);
    }
    getAllModes() {
        return Array.from(this.modeMap.values());
    }
    getAllWarmthRanges() {
        return [...this.warmthRanges];
    }
    resolveModeFromComplexity(complexityScore, paramSizeB) {
        let selected = 'medium';
        for (const mode of this.modeMap.values()) {
            if (complexityScore >= mode.complexityMin && complexityScore <= mode.complexityMax) {
                selected = mode.modeKey;
                break;
            }
        }
        if (typeof paramSizeB === 'number' && paramSizeB <= 8.5 && selected === 'deep') {
            return 'detailed';
        }
        return selected;
    }
    resolveWarmth(score = 80, lang = 'uk') {
        const isUkr = lang === 'uk' || lang === 'ukr';
        const langKey = isUkr ? 'uk' : (lang === 'ru' || lang === 'rus' ? 'ru' : 'en');
        for (const range of this.warmthRanges) {
            if (score >= range.minScore && score <= range.maxScore) {
                return {
                    score,
                    label: range.labels[langKey] || range.labels['en'] || 'Warm',
                    iconName: range.iconName,
                    tempDelta: range.tempDeltaBias,
                    directive: range.directives[langKey] || range.directives['en'] || ''
                };
            }
        }
        const fallback = this.warmthRanges[2] || this.warmthRanges[0];
        return {
            score,
            label: fallback?.labels[langKey] || 'Warm',
            iconName: fallback?.iconName || 'Flame',
            tempDelta: fallback?.tempDeltaBias || 0,
            directive: fallback?.directives[langKey] || ''
        };
    }
    getMetricsSchema(lang = 'uk') {
        const isUkr = lang === 'uk' || lang === 'ukr';
        const langKey = isUkr ? 'uk' : (lang === 'ru' || lang === 'rus' ? 'ru' : 'en');
        return this.metricsMap.get(langKey) || this.metricsMap.get('uk') || {
            languageCode: 'uk',
            complexityTitle: 'Складність',
            modeTitle: 'Режим',
            accuracyTitle: 'Точність',
            badgeTemplate: '📊 **Складність:** `{complexity}/100` | ⚖️ **Режим:** `{mode}` | 🛡️ **Точність:** `{accuracy}`'
        };
    }
    getModule(moduleId) {
        return this.modulesMap.get(moduleId);
    }
    getPromptModule(moduleId) {
        return this.modulesMap.get(moduleId);
    }
    getServerInfo() {
        const meta = this.metadataMap.get('server_info') || {};
        return {
            name: meta.name || 'Holy Bible MCP',
            description: meta.description || 'Universal Multilingual Bible MCP Server',
            version: meta.version || '1.1.0',
            server: meta.server || 'holy-bible-mcp'
        };
    }
    getSettingsMetadata(settingId) {
        const meta = this.metadataMap.get('settings_metadata') || {};
        return meta[settingId];
    }
}
