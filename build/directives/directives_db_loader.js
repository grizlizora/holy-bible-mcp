import { loadDirectivesFromDb } from './theological_tables.js';
const KNOWN_SYNONYMS_FALLBACK = {
    "G0025": { lemma: "ἀγαπάω", translit: "agapao" },
    "G0026": { lemma: "ἀγάπη", translit: "agape" },
    "G5368": { lemma: "φιλέω", translit: "phileo" },
    "G2222": { lemma: "ζωή", translit: "zoe" },
    "G1097": { lemma: "γινώскω", translit: "ginosko" },
    "G3056": { lemma: "λόγος", translit: "logos" },
    "H7225": { lemma: "רֵאשִׁית", translit: "reshit" },
    "H1254": { lemma: "בָּרָא", translit: "bara" },
    "H2617": { lemma: "חֶסֶד", translit: "hesed" },
    "H7965": { lemma: "שָׁלוֹם", translit: "shalom" }
};
export function hydrateDirectivesFromDb(db, targets) {
    const payload = loadDirectivesFromDb(db);
    // 1. Tiers
    for (const r of payload.tierRows) {
        const item = {
            tierId: (r.level_id || r.tier_id || r.tier_key),
            nameDisplay: r.display_name || r.name_display || '',
            minParamSizeB: r.min_param_size_b ?? 0,
            maxParamSizeB: r.max_param_size_b ?? null,
            defaultNumCtx: r.default_num_ctx ?? 4096,
            defaultNumPredict: r.default_num_predict ?? 1024,
            minP: r.min_p ?? 0.05,
            baseTemp: r.base_temp ?? 0.4,
            topP: r.top_p ?? 0.9,
            repeatPenalty: r.repeat_penalty ?? 1.1,
            frequencyPenalty: r.frequency_penalty ?? 0.0,
            presencePenalty: r.presence_penalty ?? 0.0,
            repeatLastN: r.repeat_last_n ?? 64,
            maxThinkChars: r.max_think_chars ?? 0,
            supportsCot: Boolean(r.supports_cot),
            maxAllowedMode: (r.max_allowed_mode || 'medium'),
            systemDirective: r.system_directive || '',
            thinkingDirective: r.thinking_directive || ''
        };
        targets.tierRepo.registerTier(item);
    }
    // 2. Modes
    for (const r of payload.modeRows) {
        let accMatrix = { tier1: 0.8, tier1_5: 0.85, tier2: 0.9, tier3: 0.95 };
        if (r.accuracy_matrix_json) {
            try {
                accMatrix = JSON.parse(r.accuracy_matrix_json);
            }
            catch { }
        }
        const item = {
            modeKey: (r.mode_id || r.mode_key),
            displayNames: JSON.parse(r.labels_json || r.display_names_json || '{}'),
            descriptions: JSON.parse(r.descriptions_json || '{}'),
            iconName: r.icon_name || 'book',
            minWords: r.min_words ?? 50,
            maxWords: r.max_words ?? null,
            maxVerses: r.max_verses ?? 5,
            complexityMin: r.min_complexity ?? r.complexity_min ?? 0,
            complexityMax: r.max_complexity ?? r.complexity_max ?? 100,
            structureMandate: r.structure_mandate || r.prompt_instruction || '',
            templateBody: r.template_body || '',
            accuracyMatrix: accMatrix
        };
        targets.modeRepo.registerMode(item);
    }
    // 3. Warmth
    for (const r of payload.warmthRows) {
        const item = {
            levelId: (r.level_id || r.level_key),
            minScore: r.min_score ?? 0,
            maxScore: r.max_score ?? 100,
            iconName: r.icon_name || 'heart',
            tempDeltaBias: r.temp_delta_bias ?? 0,
            labels: JSON.parse(r.labels_json || '{}'),
            directives: JSON.parse(r.directive_text_json || r.directives_json || '{}')
        };
        targets.warmthRepo.registerWarmth(item);
    }
    // 4. Metrics
    for (const r of payload.metricsRows) {
        const item = {
            languageCode: r.language_code,
            complexityTitle: r.complexity_title,
            modeTitle: r.mode_title,
            accuracyTitle: r.accuracy_title,
            badgeTemplate: r.badge_template
        };
        targets.metricsMap.set(item.languageCode, item);
        if (item.languageCode === 'uk')
            targets.metricsMap.set('ukr', item);
        if (item.languageCode === 'en')
            targets.metricsMap.set('eng', item);
    }
    // 5. Modules
    for (const r of payload.moduleRows) {
        targets.modulesMap.set(r.module_id || r.id, r.content || r.template_body || '');
    }
    // 6. Translations
    for (const r of payload.transRows) {
        let detailsObj = {};
        if (r.details_json) {
            try {
                detailsObj = JSON.parse(r.details_json);
            }
            catch { }
        }
        targets.theologyRepo.translationsMap.set(r.id.toUpperCase(), {
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
    // 7. Trench
    for (const r of payload.synRows) {
        const sId = r.strongs_id.toUpperCase();
        const fallback = KNOWN_SYNONYMS_FALLBACK[sId] || { lemma: "", translit: "" };
        targets.theologyRepo.trenchMap.set(sId, {
            strongsId: r.strongs_id,
            greekLemma: r.greek_lemma || r.lemma || fallback.lemma,
            transliteration: r.transliteration || fallback.translit,
            group: r.synonym_group,
            synonymGroup: r.synonym_group,
            distinction: r.distinction,
            theologicalSignificance: r.theological_significance
        });
    }
    // 8. Prophecies
    targets.theologyRepo.propheciesList = payload.propRows.map((r) => {
        const pOsis = r.prophecy_osis || r.prophecy_ref || '';
        const fOsis = r.fulfillment_osis || r.fulfillment_ref || '';
        const pText = r.prophecy_text || r.context_description || '';
        const fText = r.theological_significance || r.theological_focus || '';
        return {
            id: r.id,
            topic: r.topic,
            topic_title: r.topic_title,
            prophecy_ref: pOsis,
            fulfillment_ref: fOsis,
            theological_focus: fText,
            time_gap_years: r.time_gap_years,
            prophecy: {
                osis: pOsis,
                displayTitle: pOsis,
                text: pText,
                epochBCE: `${r.time_gap_years || 700} BCE`
            },
            fulfillment: {
                osis: fOsis,
                displayTitle: fOsis,
                text: fText,
                epochCE: "33 CE"
            },
            timeGapYears: r.time_gap_years || 700,
            theologicalSignificance: fText
        };
    });
    // 9. Thematic Chains
    const sortedThematic = [...payload.chainRows].sort((a, b) => (a.step_number || a.step || a.id) - (b.step_number || b.step || b.id));
    for (const r of sortedThematic) {
        let list = targets.theologyRepo.thematicChainsMap.get(r.theme);
        if (!list) {
            list = [];
            targets.theologyRepo.thematicChainsMap.set(r.theme, list);
        }
        list.push({
            step: r.step_number ?? r.step ?? r.id,
            ref: r.osis || r.scripture_ref || '',
            covenantStage: r.epoch || r.covenant_stage || '',
            significance: r.theological_link || r.significance || ''
        });
    }
    // 10. Metadata
    for (const r of payload.metaRows) {
        const rawVal = r.value_json || r.value;
        try {
            targets.theologyRepo.metadataMap.set(r.key, JSON.parse(rawVal));
        }
        catch {
            targets.theologyRepo.metadataMap.set(r.key, rawVal);
        }
    }
    // 11. Patristic Commentaries
    if (payload.commentaryRows && payload.commentaryRows.length > 0) {
        targets.theologyRepo.commentariesList = payload.commentaryRows.map((r) => ({
            id: r.id,
            book: r.book,
            chapter: r.chapter,
            verse: r.verse,
            author: r.author,
            era: r.era,
            commentary_text: r.commentary_text
        }));
    }
    // 12. Semantic Concepts
    if (payload.semanticRows && payload.semanticRows.length > 0) {
        targets.theologyRepo.semanticConceptsList = payload.semanticRows.map((r) => ({
            id: r.id,
            concept_key: r.concept_key,
            concept_name: r.concept_name,
            keywords: r.keywords,
            book: r.book,
            chapter: r.chapter,
            verse: r.verse,
            theological_principle: r.theological_principle
        }));
    }
}
