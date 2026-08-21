import Database from "better-sqlite3";
import fs from "fs";
import { resolveDirectivesDbPath } from "./directive_path_resolver.js";
import { TierRepository } from "./repositories/tier_repository.js";
import { ModeRepository } from "./repositories/mode_repository.js";
import { WarmthRepository } from "./repositories/warmth_repository.js";
import { TheologyRepository } from "./repositories/theology_repository.js";
import { hydrateDirectivesFromDb } from "./directives_db_loader.js";
import { TheologicalKnowledgeGraph } from "../graph/theological_graphology_engine.js";
export * from "./theological_knowledge_store.js";
export * from "./tier_resolver.js";
export * from "./warmth_resolver.js";
export * from "./repositories/tier_repository.js";
export * from "./repositories/mode_repository.js";
export * from "./repositories/warmth_repository.js";
export * from "./repositories/theology_repository.js";
export class DirectiveStore {
    static instance = null;
    dbPath = "";
    tierRepo = new TierRepository();
    modeRepo = new ModeRepository();
    warmthRepo = new WarmthRepository();
    theologyRepo = new TheologyRepository();
    metricsMap = new Map();
    modulesMap = new Map();
    isInitialized = false;
    initPromise = null;
    constructor() { }
    static getInstance() {
        if (!DirectiveStore.instance) {
            DirectiveStore.instance = new DirectiveStore();
        }
        return DirectiveStore.instance;
    }
    async loadDirectives() {
        if (this.isInitialized)
            return;
        if (this.initPromise)
            return this.initPromise;
        this.initPromise = (async () => {
            this.dbPath = resolveDirectivesDbPath();
            const startTime = performance.now();
            if (!fs.existsSync(this.dbPath)) {
                console.warn(`[DIRECTIVE-ENGINE] ⚠️ Directives SQLite DB not found at: ${this.dbPath}. Running with fallback state.`);
                this.isInitialized = true;
                return;
            }
            let db = null;
            try {
                db = new Database(this.dbPath, { readonly: true, fileMustExist: false });
                db.pragma("busy_timeout = 5000");
                db.pragma("journal_mode = WAL");
                db.pragma("synchronous = NORMAL");
                db.pragma("temp_store = MEMORY");
                db.pragma("mmap_size = 30000000000");
                db.pragma("cache_size = -64000");
                hydrateDirectivesFromDb(db, {
                    tierRepo: this.tierRepo,
                    modeRepo: this.modeRepo,
                    warmthRepo: this.warmthRepo,
                    theologyRepo: this.theologyRepo,
                    metricsMap: this.metricsMap,
                    modulesMap: this.modulesMap
                });
                // Hydrate In-Memory Knowledge Graph with loaded prophecies and thematic chains
                TheologicalKnowledgeGraph.getInstance().hydrateFromDirectives(this.theologyRepo.propheciesList, this.theologyRepo.thematicChainsMap);
                this.isInitialized = true;
                const elapsed = (performance.now() - startTime).toFixed(2);
                console.error(`[DIRECTIVE-ENGINE] ✅ Loaded dedicated Directives DB (${this.dbPath}) in ${elapsed}ms.`);
            }
            catch (err) {
                console.error(`[DIRECTIVE-ENGINE] ❌ Failed to load directives from SQLite:`, err?.message || err);
                this.isInitialized = false;
                this.initPromise = null;
            }
            finally {
                if (db) {
                    try {
                        db.close();
                    }
                    catch { }
                }
            }
        })();
        return this.initPromise;
    }
    // Facade delegation methods
    getTranslations() {
        return this.theologyRepo.getTranslations();
    }
    getTranslation(id) {
        return this.theologyRepo.getTranslation(id);
    }
    getTrenchSynonym(strongsId) {
        return this.theologyRepo.getTrenchSynonym(strongsId);
    }
    getMessianicProphecies(topic) {
        return this.theologyRepo.getMessianicProphecies(topic);
    }
    getThematicChain(theme) {
        return this.theologyRepo.getThematicChain(theme);
    }
    getServerMetadata(key) {
        return this.theologyRepo.getServerMetadata(key);
    }
    getServerInfo() {
        return this.theologyRepo.getServerMetadata('server_info') || {};
    }
    getSettingsMetadata(key) {
        const settings = this.theologyRepo.getServerMetadata('settings_metadata');
        if (settings && typeof settings === 'object' && settings[key]) {
            return settings[key];
        }
        return this.theologyRepo.getServerMetadata(key);
    }
    getTierDirective(tierKey) {
        return this.tierRepo.getTierDirective(tierKey);
    }
    resolveTierByParamSize(paramSizeB) {
        return this.tierRepo.resolveTierByParamSize(paramSizeB);
    }
    getModeDirective(modeKey) {
        return this.modeRepo.getModeDirective(modeKey);
    }
    getMode(modeKey) {
        return this.modeRepo.getMode(modeKey);
    }
    getAllModes() {
        return this.modeRepo.getAllModes();
    }
    resolveModeFromComplexity(complexityScore, paramSizeB) {
        return this.modeRepo.resolveModeFromComplexity(complexityScore, paramSizeB);
    }
    getAllWarmthRanges() {
        return this.warmthRepo.getAllWarmthRanges();
    }
    resolveWarmth(score, lang = 'ukr') {
        return this.warmthRepo.resolveWarmth(score, lang);
    }
    getMetricsSchema(lang = 'ukr') {
        const langKey = lang === 'eng' || lang === 'en' ? 'eng' : (lang === 'ru' ? 'ru' : 'ukr');
        return this.metricsMap.get(langKey) || this.metricsMap.get('ukr') || {
            languageCode: 'ukr',
            complexityTitle: 'Складність запиту',
            modeTitle: 'Режим аналізу',
            accuracyTitle: 'Точність цитування',
            badgeTemplate: '🎯 Калібрування'
        };
    }
    getModule(moduleId) {
        return this.modulesMap.get(moduleId);
    }
    getPromptModule(moduleId) {
        return this.modulesMap.get(moduleId);
    }
}
