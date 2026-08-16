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

export class DirectiveStore {
  private static instance: DirectiveStore | null = null;
  private db: sqlite3.Database | null = null;
  public dbPath: string = "";

  // In-Memory O(1) Index Maps for 0.0ms lookup
  private tierMap = new Map<ModelTierKey, ModelTierDirective>();
  private tierRanges: ModelTierDirective[] = [];
  private modeMap = new Map<ModeKey, ModeDirective>();
  private warmthRanges: WarmthDirective[] = [];
  private metricsMap = new Map<string, MetricsSchema>();
  private modulesMap = new Map<string, string>();
  private metadataMap = new Map<string, any>();

  // Open-Source Theological Knowledge Tables loaded from SQLite
  private translationsMap = new Map<string, any>();
  private trenchMap = new Map<string, any>();
  private propheciesList: any[] = [];
  private thematicChainsMap = new Map<string, any[]>();

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
        this.tierMap.set(item.tierId, item);
        this.tierRanges.push(item);
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
          directives: JSON.parse(r.directives_json || '{}')
        };
        this.warmthRanges.push(item);
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
        this.translationsMap.set(r.id.toUpperCase(), {
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
        this.trenchMap.set(r.strongs_id.toUpperCase(), {
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
      this.propheciesList = data.propRows.map((r: any) => ({
        id: r.id,
        topic: r.topic,
        prophecy_ref: r.prophecy_ref,
        fulfillment_ref: r.fulfillment_ref,
        context_description: r.context_description,
        theological_focus: r.theological_focus,
        prophecy: { osis: r.prophecy_ref, text: r.context_description },
        fulfillment: { osis: r.fulfillment_ref, text: r.theological_focus }
      }));

      // 9. Thematic Chains
      for (const r of data.chainRows) {
        if (!this.thematicChainsMap.has(r.theme)) {
          this.thematicChainsMap.set(r.theme, []);
        }
        this.thematicChainsMap.get(r.theme)!.push({
          step: r.step_number,
          ref: r.scripture_ref,
          covenantStage: r.covenant_stage,
          significance: r.significance
        });
      }

      // 10. Server Metadata
      for (const r of data.metaRows) {
        try {
          this.metadataMap.set(r.key, JSON.parse(r.value_json));
        } catch {
          this.metadataMap.set(r.key, r.value_json);
        }
      }

      this.isInitialized = true;
      const elapsed = (performance.now() - startTime).toFixed(2);
      console.error(`[DIRECTIVE-ENGINE] ✅ Loaded dedicated Directives DB (${this.dbPath}) in ${elapsed}ms.`);
    } catch (err) {
      console.error(`[DIRECTIVE-ENGINE] ❌ Failed to load directives from SQLite:`, err);
      this.isInitialized = true;
    }
  }

  public getTranslations(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [k, v] of this.translationsMap.entries()) {
      result[k] = v;
    }
    return result;
  }

  public getTranslation(id: string): any {
    return this.translationsMap.get(id.toUpperCase());
  }

  public getTrenchSynonym(strongsId: string): any {
    const norm = strongsId.trim().toUpperCase();
    const letter = norm[0] || 'G';
    const numPart = parseInt(norm.slice(1), 10) || 1;
    const padded = letter + String(numPart).padStart(4, '0');
    const raw = letter + String(numPart);
    return this.trenchMap.get(padded) || this.trenchMap.get(raw) || this.trenchMap.get(norm);
  }

  public getMessianicProphecies(topic?: string): any[] {
    if (!topic || topic === 'all') return [...this.propheciesList];
    const clean = topic.toLowerCase();
    return this.propheciesList.filter(p => 
      p.topic.toLowerCase().includes(clean) || 
      p.prophecy.osis.toLowerCase().includes(clean) || 
      p.fulfillment.osis.toLowerCase().includes(clean)
    );
  }

  public getThematicChain(theme: string): any[] {
    const clean = theme.toLowerCase();
    for (const [k, list] of this.thematicChainsMap.entries()) {
      if (clean.includes(k) || k.includes(clean)) return list;
    }
    return this.thematicChainsMap.get("seed_of_faith") || [];
  }

  public resolveTierByParamSize(paramSizeB: number): ModelTierDirective {
    for (const tier of this.tierRanges) {
      if (paramSizeB >= tier.minParamSizeB && (tier.maxParamSizeB === null || paramSizeB < tier.maxParamSizeB)) {
        return tier;
      }
    }
    return this.tierMap.get('tier3') || this.tierRanges[this.tierRanges.length - 1];
  }

  public getTier(tierId: ModelTierKey): ModelTierDirective | undefined {
    return this.tierMap.get(tierId);
  }

  public getMode(modeKey: ModeKey): ModeDirective | undefined {
    return this.modeMap.get(modeKey);
  }

  public getAllModes(): ModeDirective[] {
    return Array.from(this.modeMap.values());
  }

  public getAllWarmthRanges(): WarmthDirective[] {
    return [...this.warmthRanges];
  }

  public resolveModeFromComplexity(complexityScore: number, paramSizeB?: number): ModeKey {
    let selected: ModeKey = 'medium';
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

  public resolveWarmth(score: number = 80, lang: string = 'uk'): {
    score: number;
    label: string;
    iconName: string;
    tempDelta: number;
    directive: string;
  } {
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

    const fallback = this.warmthRanges[2] || this.warmthRanges[0] || {
      labels: { uk: 'Теплий', en: 'Warm', ru: 'Теплый' },
      iconName: 'Flame',
      tempDeltaBias: 0,
      directives: { uk: 'Відповідайте з пасторською турботою.', en: 'Respond with pastoral warmth.', ru: 'Отвечайте с пасторской теплотой.' }
    };
    return {
      score,
      label: fallback.labels[langKey] || fallback.labels['en'] || 'Warm',
      iconName: fallback.iconName || 'Flame',
      tempDelta: fallback.tempDeltaBias || 0,
      directive: fallback.directives[langKey] || fallback.directives['en'] || ''
    };
  }

  public getMetricsSchema(lang: string = 'uk'): MetricsSchema {
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

  public getModule(moduleId: string): string | undefined {
    return this.modulesMap.get(moduleId);
  }

  public getPromptModule(moduleId: string): string | undefined {
    return this.modulesMap.get(moduleId);
  }

  public getServerInfo(): { name: string; description: string; version: string; server: string } {
    const meta = this.metadataMap.get('server_info') || {};
    return {
      name: meta.name || 'Holy Bible MCP',
      description: meta.description || 'Universal Multilingual Bible MCP Server',
      version: meta.version || '2.0.0',
      server: meta.server || 'holy-bible-mcp'
    };
  }

  public getSettingsMetadata(settingId: string): any {
    const meta = this.metadataMap.get('settings_metadata') || {};
    return meta[settingId];
  }
}
