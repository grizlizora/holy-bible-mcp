import sqlite3 from "sqlite3";
import { OSIS_BOOK_NAMES, OSIS_ALIAS_MAP } from "../data/osis_dictionary.js";

export interface LoadedDirectivesPayload {
  tierRows: any[];
  modeRows: any[];
  warmthRows: any[];
  metricsRows: any[];
  moduleRows: any[];
  transRows: any[];
  synRows: any[];
  propRows: any[];
  chainRows: any[];
  metaRows: any[];
}

export async function loadDirectivesFromDb(db: sqlite3.Database): Promise<LoadedDirectivesPayload> {
  const query = (sql: string, params: any[] = []): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  };

  const [
    tierRes,
    modeRes,
    warmthRes,
    metricsRes,
    moduleRes,
    transRes,
    synRes,
    propRes,
    chainRes,
    metaRes,
    osisRes,
    aliasRes
  ] = await Promise.allSettled([
    query(`SELECT * FROM model_tier_directives ORDER BY min_param_size_b ASC`),
    query(`SELECT * FROM mode_directives`),
    query(`SELECT * FROM warmth_directives ORDER BY min_score ASC`),
    query(`SELECT * FROM metrics_schemas`),
    query(`SELECT module_id, content FROM prompt_modules WHERE is_active = 1`),
    query(`SELECT * FROM translations_catalog`),
    query(`SELECT * FROM trench_synonyms`),
    query(`SELECT * FROM messianic_prophecies`),
    query(`SELECT * FROM thematic_chains ORDER BY theme ASC, step_number ASC`),
    query(`SELECT key, value_json FROM server_metadata`),
    query(`SELECT * FROM osis_book_dictionary`),
    query(`SELECT * FROM osis_aliases`)
  ]);

  const tierRows = tierRes.status === 'fulfilled' ? tierRes.value : [];
  const modeRows = modeRes.status === 'fulfilled' ? modeRes.value : [];
  const warmthRows = warmthRes.status === 'fulfilled' ? warmthRes.value : [];
  const metricsRows = metricsRes.status === 'fulfilled' ? metricsRes.value : [];
  const moduleRows = moduleRes.status === 'fulfilled' ? moduleRes.value : [];
  const transRows = transRes.status === 'fulfilled' ? transRes.value : [];
  const synRows = synRes.status === 'fulfilled' ? synRes.value : [];
  const propRows = propRes.status === 'fulfilled' ? propRes.value : [];
  const chainRows = chainRes.status === 'fulfilled' ? chainRes.value : [];
  const metaRows = metaRes.status === 'fulfilled' ? metaRes.value : [];

  if (osisRes.status === 'fulfilled') {
    for (const r of osisRes.value) {
      if (r.osis_code) {
        OSIS_BOOK_NAMES[r.osis_code] = {
          uk: r.name_uk,
          en: r.name_en,
          ru: r.name_ru
        };
      }
    }
  }

  if (aliasRes.status === 'fulfilled') {
    for (const r of aliasRes.value) {
      if (r.alias && r.osis_code) {
        OSIS_ALIAS_MAP[r.alias.toUpperCase()] = r.osis_code;
        OSIS_ALIAS_MAP[r.alias.toLowerCase()] = r.osis_code;
      }
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
    metaRows
  };
}
