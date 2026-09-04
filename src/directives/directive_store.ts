import Database from "better-sqlite3";
import fs from "fs";
import {
  ModelTierDirective,
  ModeDirective,
  WarmthDirective,
  MetricsSchema,
  ModelTierKey,
  ModeKey
} from "./types.js";
import { resolveDirectivesDbPath } from "./directive_path_resolver.js";
import { TierRepository } from "./repositories/tier_repository.js";
import { ModeRepository } from "./repositories/mode_repository.js";
import { WarmthRepository } from "./repositories/warmth_repository.js";
import { TheologyRepository } from "./repositories/theology_repository.js";
import { hydrateDirectivesFromDb } from "./directives_db_loader.js";
import { TheologicalKnowledgeGraph } from "../graph/theological_graphology_engine.js";

export * from "./tier_resolver.js";
export * from "./warmth_resolver.js";
export * from "./repositories/tier_repository.js";
export * from "./repositories/mode_repository.js";
export * from "./repositories/warmth_repository.js";
export * from "./repositories/theology_repository.js";

export class DirectiveStore {
  private static instance: DirectiveStore | null = null;
  public dbPath: string = "";

  public tierRepo = new TierRepository();
  public modeRepo = new ModeRepository();
  public warmthRepo = new WarmthRepository();
  public theologyRepo = new TheologyRepository();
  public metricsMap = new Map<string, MetricsSchema>();
  public modulesMap = new Map<string, string>();

  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): DirectiveStore {
    if (!DirectiveStore.instance) {
      DirectiveStore.instance = new DirectiveStore();
    }
    return DirectiveStore.instance;
  }

  public async loadDirectives(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.dbPath = resolveDirectivesDbPath();
      const startTime = performance.now();

      if (!fs.existsSync(this.dbPath)) {
        console.warn(`[DIRECTIVE-ENGINE] ⚠️ Directives SQLite DB not found at: ${this.dbPath}. Running with fallback state.`);
        this.isInitialized = true;
        return;
      }

      let db: Database.Database | null = null;
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
        TheologicalKnowledgeGraph.getInstance().hydrateFromDirectives(
          this.theologyRepo.propheciesList,
          this.theologyRepo.thematicChainsMap
        );

        this.isInitialized = true;
        const elapsed = (performance.now() - startTime).toFixed(2);
        console.error(`[DIRECTIVE-ENGINE] ✅ Loaded dedicated Directives DB (${this.dbPath}) in ${elapsed}ms.`);
      } catch (err: any) {
        console.error(`[DIRECTIVE-ENGINE] ❌ Failed to load directives from SQLite:`, err?.message || err);
        this.isInitialized = false;
        this.initPromise = null;
      } finally {
        if (db) {
          try {
            db.close();
          } catch {}
        }
      }
    })();

    return this.initPromise;
  }

  // Facade delegation methods
  public getTranslations(): Record<string, any> {
    return this.theologyRepo.getTranslations();
  }

  public getTranslation(id: string): any {
    return this.theologyRepo.getTranslation(id);
  }

  public getTrenchSynonym(strongsId: string): any {
    return this.theologyRepo.getTrenchSynonym(strongsId);
  }

  public getMessianicProphecies(topic?: string): any[] {
    return this.theologyRepo.getMessianicProphecies(topic);
  }

  public getThematicChain(theme: string): any[] {
    return this.theologyRepo.getThematicChain(theme);
  }

  public getServerMetadata(key: string): any {
    return this.theologyRepo.getServerMetadata(key);
  }

  public getServerInfo(): any {
    return this.theologyRepo.getServerMetadata('server_info') || {};
  }

  public getSettingsMetadata(key: string): any {
    const settings = this.theologyRepo.getServerMetadata('settings_metadata');
    if (settings && typeof settings === 'object' && settings[key]) {
      return settings[key];
    }
    return this.theologyRepo.getServerMetadata(key);
  }

  public getTierDirective(tierKey: ModelTierKey): ModelTierDirective | undefined {
    return this.tierRepo.getTierDirective(tierKey);
  }

  public resolveTierByParamSize(paramSizeB: number): ModelTierDirective {
    return this.tierRepo.resolveTierByParamSize(paramSizeB);
  }

  public getModeDirective(modeKey: ModeKey): ModeDirective | undefined {
    return this.modeRepo.getModeDirective(modeKey);
  }

  public getMode(modeKey: string): ModeDirective | undefined {
    return this.modeRepo.getMode(modeKey);
  }

  public getAllModes(): ModeDirective[] {
    return this.modeRepo.getAllModes();
  }

  public resolveModeFromComplexity(complexityScore: number, paramSizeB?: number): string {
    return this.modeRepo.resolveModeFromComplexity(complexityScore, paramSizeB);
  }

  public getAllWarmthRanges(): WarmthDirective[] {
    return this.warmthRepo.getAllWarmthRanges();
  }

  public resolveWarmth(score: number, lang = 'ukr') {
    return this.warmthRepo.resolveWarmth(score, lang);
  }

  public getMetricsSchema(lang = 'ukr'): MetricsSchema {
    const langKey = lang === 'eng' || lang === 'en' ? 'eng' : (lang === 'ru' ? 'ru' : 'ukr');
    return this.metricsMap.get(langKey) || this.metricsMap.get('ukr') || {
      languageCode: 'ukr',
      complexityTitle: 'Складність запиту',
      modeTitle: 'Режим аналізу',
      accuracyTitle: 'Точність цитування',
      badgeTemplate: '🎯 Калібрування'
    };
  }

  public getModule(moduleId: string): string | undefined {
    return this.modulesMap.get(moduleId);
  }

  public getPromptModule(moduleId: string): string | undefined {
    return this.modulesMap.get(moduleId);
  }
}

export { TheologicalKnowledgeStore } from "./theological_knowledge_store.js";
