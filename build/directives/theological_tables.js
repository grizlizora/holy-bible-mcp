import { OSIS_BOOK_NAMES, OSIS_ALIAS_MAP } from "../data/osis_dictionary.js";
export function loadDirectivesFromDb(db) {
    const query = (sql, params = []) => {
        try {
            return db.prepare(sql).all(...params);
        }
        catch {
            return [];
        }
    };
    const tierRows = query(`SELECT * FROM model_tier_directives ORDER BY min_param_size_b ASC`);
    const modeRows = query(`SELECT * FROM mode_directives`);
    const warmthRows = query(`SELECT * FROM warmth_directives ORDER BY min_score ASC`);
    const metricsRows = query(`SELECT * FROM metrics_schemas`);
    const moduleRows = query(`SELECT module_id, content FROM prompt_modules WHERE is_active = 1`);
    const transRows = query(`SELECT * FROM translations_catalog`);
    const synRows = query(`SELECT * FROM trench_synonyms`);
    const propRows = query(`SELECT * FROM messianic_prophecies`);
    const chainRows = query(`SELECT * FROM thematic_chains ORDER BY theme ASC, step_number ASC`);
    const metaRows = query(`SELECT key, value_json FROM server_metadata`);
    const osisRows = query(`SELECT * FROM osis_book_dictionary`);
    const aliasRows = query(`SELECT * FROM osis_aliases`);
    const commentaryRows = query(`SELECT * FROM patristic_commentaries`);
    const semanticRows = query(`SELECT * FROM theological_semantic_concepts`);
    for (const r of osisRows) {
        if (r.osis_code) {
            OSIS_BOOK_NAMES[r.osis_code] = {
                uk: r.name_uk,
                en: r.name_en,
                ru: r.name_ru
            };
        }
    }
    for (const r of aliasRows) {
        if (r.alias && r.osis_code) {
            OSIS_ALIAS_MAP[r.alias.toUpperCase()] = r.osis_code;
            OSIS_ALIAS_MAP[r.alias.toLowerCase()] = r.osis_code;
        }
    }
    return {
        tierRows,
        modeRows,
        warmthRows,
        metricsRows,
        moduleRows,
        transRows,
        synRows,
        propRows,
        chainRows,
        metaRows,
        commentaryRows,
        semanticRows
    };
}
