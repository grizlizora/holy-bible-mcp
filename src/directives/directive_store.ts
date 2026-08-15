import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import {
  ModelTierDirective,
  ModeDirective,
  WarmthDirective,
  MetricsSchema,
  ModelTierKey,
  ModeKey
} from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDirectivesDbPath(): string {
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
  ].filter(Boolean) as string[];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }

  return path.resolve(process.cwd(), "data/directives.sqlite");
}

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

  private query(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error("Directives DB not initialized"));
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * ⚡ Pure SQLite Reader: Opens pre-populated directives.sqlite and loads all tables into RAM in <2ms.
   * Contains ZERO hardcoded prompt strings or text templates.
   */
  public async loadDirectives(): Promise<void> {
    const startTime = performance.now();
    this.dbPath = resolveDirectivesDbPath();

    await new Promise<void>((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          // If read-only fails because file doesn't exist, open readwrite
          this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (e) => {
            if (e) reject(e);
            else resolve();
          });
        } else {
          resolve();
        }
      });
    });

    try {
      // 1. Fetch Model Tiers directly from SQLite
      const tierRows = (await this.query(`SELECT * FROM model_tier_directives ORDER BY min_param_size_b ASC`)) as any[];
      this.tierMap.clear();
      this.tierRanges = [];
      for (const r of (tierRows || [])) {
        const obj: ModelTierDirective = {
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
      const modeRows = (await this.query(`SELECT * FROM mode_directives`)) as any[];
      this.modeMap.clear();
      for (const r of (modeRows || [])) {
        const obj: ModeDirective = {
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
      const warmthRows = (await this.query(`SELECT * FROM warmth_directives ORDER BY min_score ASC`)) as any[];
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
      const metricsRows = (await this.query(`SELECT * FROM metrics_schemas`)) as any[];
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
      const moduleRows = (await this.query(`SELECT module_id, content FROM prompt_modules WHERE is_active = 1`)) as any[];
      this.modulesMap.clear();
      for (const r of (moduleRows || [])) {
        this.modulesMap.set(r.module_id, r.content);
      }

      // 6. Fetch Translations Catalog directly from SQLite
      try {
        const transRows = (await this.query(`SELECT * FROM translations_catalog`)) as any[];
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
      } catch (_) {}

      // 7. Fetch Trench Synonyms directly from SQLite
      try {
        const synRows = (await this.query(`SELECT * FROM trench_synonyms`)) as any[];
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
      } catch (_) {}

      // 8. Fetch Messianic Prophecies directly from SQLite
      try {
        const propRows = (await this.query(`SELECT * FROM messianic_prophecies`)) as any[];
        this.propheciesList = (propRows || []).map((r: any) => ({
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
      } catch (_) {}

      // 9. Fetch Thematic Chains directly from SQLite
      try {
        const chainRows = (await this.query(`SELECT * FROM thematic_chains ORDER BY theme ASC, step_number ASC`)) as any[];
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
      } catch (_) {}

      // 10. Fetch Server Metadata directly from SQLite
      try {
        const metaRows = (await this.query(`SELECT key, value_json FROM server_metadata`)) as any[];
        this.metadataMap.clear();
        for (const r of (metaRows || [])) {
          this.metadataMap.set(r.key, JSON.parse(r.value_json || "{}"));
        }
      } catch (_) {}

      this.isInitialized = true;
      const elapsed = (performance.now() - startTime).toFixed(2);
      console.error(`[DIRECTIVE-ENGINE] ✅ Loaded dedicated Directives DB (${this.dbPath}) in ${elapsed}ms.`);
    } catch (e: any) {
      console.error("[DIRECTIVE-ENGINE ERROR]", e);
    }
  }

  // ==========================================================================
  // ZERO-LATENCY RESOLVERS (0.0ms Lookup Time from SQLite Cache)
  // ==========================================================================

  public getTranslations(): Record<string, any> {
    const res: Record<string, any> = {};
    for (const [k, v] of this.translationsMap.entries()) {
      res[k] = v;
    }
    return res;
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

    const fallback = this.warmthRanges[2] || this.warmthRanges[0];
    return {
      score,
      label: fallback?.labels[langKey] || 'Warm',
      iconName: fallback?.iconName || 'Flame',
      tempDelta: fallback?.tempDeltaBias || 0,
      directive: fallback?.directives[langKey] || ''
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
      version: meta.version || '1.1.0',
      server: meta.server || 'holy-bible-mcp'
    };
  }

  public getSettingsMetadata(settingId: string): any {
    const meta = this.metadataMap.get('settings_metadata') || {};
    return meta[settingId];
  }
}
