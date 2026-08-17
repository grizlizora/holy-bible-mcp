import sqlite3 from "sqlite3";
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
import { loadDirectivesFromDb } from "./theological_tables.js";
import { TheologicalKnowledgeStore } from "./theological_knowledge_store.js";
import { TierResolver } from "./tier_resolver.js";
import { WarmthResolver } from "./warmth_resolver.js";

export * from "./theological_knowledge_store.js";
export * from "./tier_resolver.js";
export * from "./warmth_resolver.js";

export class DirectiveStore {
  private static instance: DirectiveStore | null = null;
  private db: sqlite3.Database | null = null;
  public dbPath: string = "";

  private tierResolver = new TierResolver();
  private warmthResolver = new WarmthResolver();
  private theologyStore = new TheologicalKnowledgeStore();
  private modeMap = new Map<ModeKey, ModeDirective>();
  private metricsMap = new Map<string, MetricsSchema>();
  private modulesMap = new Map<string, string>();
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DirectiveStore {
    if (!DirectiveStore.instance) {
      DirectiveStore.instance = new DirectiveStore();
    }
    return DirectiveStore.instance;
  }

  public async loadDirectives(): Promise<void> {
    if (this.isInitialized) return;

    this.dbPath = resolveDirectivesDbPath();
    const startTime = performance.now();

    if (!fs.existsSync(this.dbPath)) {
      console.warn(`[DIRECTIVE-ENGINE] ⚠️ Directives SQLite DB not found at: ${this.dbPath}. Running with fallback state.`);
      this.isInitialized = true;
      return;
    }

    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error(`[DIRECTIVE-ENGINE] ⚠️ Error opening SQLite database:`, err.message);
      }
    });

    this.db.serialize(() => {
      this.db?.run("PRAGMA busy_timeout = 5000;");
      this.db?.run("PRAGMA journal_mode = WAL;");
      this.db?.run("PRAGMA synchronous = NORMAL;");
      this.db?.run("PRAGMA temp_store = MEMORY;");
      this.db?.run("PRAGMA mmap_size = 30000000000;");
      this.db?.run("PRAGMA cache_size = -64000;");
    });

    try {
      const data = await loadDirectivesFromDb(this.db);

      // 1. Model Tier Directives
      for (const r of data.tierRows) {
        const item: ModelTierDirective = {
          tierId: r.tier_id as ModelTierKey,
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
          maxAllowedMode: r.max_allowed_mode as ModeKey,
          systemDirective: r.system_directive,
          thinkingDirective: r.thinking_directive
        };
        this.tierResolver.tierMap.set(item.tierId, item);
        this.tierResolver.tierRanges.push(item);
      }

      // 2. Mode Directives
      for (const r of data.modeRows) {
        const item: ModeDirective = {
          modeKey: r.mode_key as ModeKey,
          displayNames: JSON.parse(r.display_names_json || '{}'),
          descriptions: JSON.parse(r.descriptions_json || '{}'),
          iconName: r.icon_name,
          minWords: r.min_words,
          maxWords: r.max_words,
          maxVerses: r.max_verses,
          complexityMin: r.complexity_min,
          complexityMax: r.complexity_max,
          structureMandate: r.structure_mandate,
          templateBody: r.template_body,
          accuracyMatrix: JSON.parse(r.accuracy_matrix_json || '{}')
        };
        this.modeMap.set(item.modeKey, item);
      }

      // 3. Warmth Directives
      for (const r of data.warmthRows) {
        const item: WarmthDirective = {
          levelId: r.level_id,
          minScore: r.min_score,
          maxScore: r.max_score,
          iconName: r.icon_name,
          tempDeltaBias: r.temp_delta_bias,
          labels: JSON.parse(r.labels_json || '{}'),
          directives: JSON.parse(r.directive_text_json || r.directives_json || '{}')
        };
        this.warmthResolver.warmthRanges.push(item);
      }

      // 4. Metrics Schemas
      for (const r of data.metricsRows) {
        const item: MetricsSchema = {
          languageCode: r.language_code,
          complexityTitle: r.complexity_title,
          modeTitle: r.mode_title,
          accuracyTitle: r.accuracy_title,
          badgeTemplate: r.badge_template
        };
        this.metricsMap.set(item.languageCode, item);
        if (item.languageCode === 'uk') this.metricsMap.set('ukr', item);
        if (item.languageCode === 'en') this.metricsMap.set('eng', item);
      }

      // 5. Prompt Modules
      for (const r of data.moduleRows) {
        this.modulesMap.set(r.module_id, r.content);
      }

      // 6. Translations Catalog
      for (const r of data.transRows) {
        let detailsObj: any = {};
        if (r.details_json) {
          try { detailsObj = JSON.parse(r.details_json); } catch {}
        }
        this.theologyStore.translationsMap.set(r.id.toUpperCase(), {
          id: r.id,
          name: r.name,
          language: r.language,
          year: r.year,
          philosophy: r.philosophy,
          textualBasis: r.textual_basis,
          notes: r.notes,
          ...detailsObj
        });
      }

      // 7. Trench Synonyms
      for (const r of data.synRows) {
        this.theologyStore.trenchMap.set(r.strongs_id.toUpperCase(), {
          strongsId: r.strongs_id,
          greekLemma: r.greek_lemma,
          transliteration: r.transliteration,
          group: r.synonym_group,
          synonymGroup: r.synonym_group,
          distinction: r.distinction,
          theologicalSignificance: r.theological_significance
        });
      }

      // 8. Messianic Prophecies
      this.theologyStore.propheciesList = data.propRows.map((r: any) => {
        const pOsis = r.prophecy_osis || r.prophecy_ref || '';
        const fOsis = r.fulfillment_osis || r.fulfillment_ref || '';
        const pText = r.prophecy_text || r.context_description || '';
        const fText = r.theological_significance || r.theological_focus || '';
        return {
          id: r.id,
          topic: r.topic,
          prophecy_ref: pOsis,
          fulfillment_ref: fOsis,
          context_description: pText,
          theological_focus: fText,
          prophecy: { osis: pOsis, text: pText },
          fulfillment: { osis: fOsis, text: fText }
        };
      });

      // 9. Thematic Chains
      for (const r of data.chainRows) {
        if (!this.theologyStore.thematicChainsMap.has(r.theme)) {
          this.theologyStore.thematicChainsMap.set(r.theme, []);
        }
        this.theologyStore.thematicChainsMap.get(r.theme)!.push({
          step: r.step_number,
          ref: r.osis || r.scripture_ref || '',
          covenantStage: r.epoch || r.covenant_stage || '',
          significance: r.theological_link || r.significance || ''
        });
      }

      // 10. Server Metadata
      for (const r of data.metaRows) {
        try {
          this.theologyStore.metadataMap.set(r.key, JSON.parse(r.value_json));
        } catch {
          this.theologyStore.metadataMap.set(r.key, r.value_json);
        }
      }

      this.isInitialized = true;
      const elapsed = (performance.now() - startTime).toFixed(2);
      console.error(`[DIRECTIVE-ENGINE] ✅ Loaded dedicated Directives DB (${this.dbPath}) in ${elapsed}ms.`);
    } catch (err) {
      console.error(`[DIRECTIVE-ENGINE] ❌ Failed to load directives from SQLite:`, err);
      this.isInitialized = true;
    } finally {
      if (this.db) {
        try {
          this.db.close();
          this.db = null;
        } catch {}
      }
    }
  }

  public getTranslations(): Record<string, any> {
    return this.theologyStore.getTranslations();
  }

  public getTranslation(id: string): any {
    return this.theologyStore.getTranslation(id);
  }

  public getTrenchSynonym(strongsId: string): any {
    return this.theologyStore.getTrenchSynonym(strongsId);
  }

  public getMessianicProphecies(topic?: string): any[] {
    return this.theologyStore.getMessianicProphecies(topic);
  }

  public getThematicChain(theme: string): any[] {
    return this.theologyStore.getThematicChain(theme);
  }

  public getServerMetadata(key: string): any {
    return this.theologyStore.getServerMetadata(key);
  }

  public getServerInfo(): any {
    return this.theologyStore.getServerMetadata('server_info') || {};
  }

  public getSettingsMetadata(key: string): any {
    return this.theologyStore.getServerMetadata(key);
  }

  public getTierDirective(tierKey: ModelTierKey): ModelTierDirective | undefined {
    return this.tierResolver.getTierDirective(tierKey);
  }

  public resolveTierByParamSize(paramSizeB: number): ModelTierDirective {
    return this.tierResolver.resolveTierByParamSize(paramSizeB);
  }

  public getModeDirective(modeKey: ModeKey): ModeDirective | undefined {
    return this.modeMap.get(modeKey);
  }

  public getMode(modeKey: string): ModeDirective | undefined {
    return this.modeMap.get(modeKey as ModeKey);
  }

  public getAllModes(): ModeDirective[] {
    return Array.from(this.modeMap.values());
  }

  public resolveModeFromComplexity(complexityScore: number, paramSizeB?: number): string {
    const sorted = Array.from(this.modeMap.values()).sort((a, b) => a.complexityMin - b.complexityMin);
    for (const m of sorted) {
      if (complexityScore >= m.complexityMin && complexityScore <= m.complexityMax) {
        return m.modeKey;
      }
    }
    return 'medium';
  }

  public getAllWarmthRanges(): WarmthDirective[] {
    return this.warmthResolver.warmthRanges;
  }

  public resolveWarmth(score: number, lang = 'ukr') {
    return this.warmthResolver.resolveWarmth(score, lang);
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
