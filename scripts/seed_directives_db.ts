import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TARGET_DB_PATHS = [
  path.resolve(__dirname, "../data/directives.sqlite"),
  path.join(os.homedir(), ".mcp-hub", "servers", "Holy_Bible_MCP", "data", "directives.sqlite"),
  path.join(os.homedir(), ".bible-mcp", "directives.sqlite")
];

function seedDatabase(dbPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
    });

    db.serialize(() => {
      // 1. Create Tables
      db.run(`
        CREATE TABLE model_tier_directives (
          tier_id TEXT PRIMARY KEY,
          name_display TEXT NOT NULL,
          min_param_size_b REAL NOT NULL,
          max_param_size_b REAL,
          default_num_ctx INTEGER NOT NULL DEFAULT 8192,
          default_num_predict INTEGER NOT NULL DEFAULT 3000,
          min_p REAL NOT NULL DEFAULT 0.05,
          base_temp REAL NOT NULL DEFAULT 0.45,
          top_p REAL NOT NULL DEFAULT 0.90,
          repeat_penalty REAL NOT NULL DEFAULT 1.08,
          frequency_penalty REAL NOT NULL DEFAULT 0.05,
          presence_penalty REAL NOT NULL DEFAULT 0.05,
          repeat_last_n INTEGER NOT NULL DEFAULT 128,
          max_think_chars INTEGER NOT NULL DEFAULT 3500,
          supports_cot INTEGER NOT NULL DEFAULT 1,
          max_allowed_mode TEXT NOT NULL DEFAULT 'deep',
          system_directive TEXT NOT NULL,
          thinking_directive TEXT
        );
      `);

      db.run(`
        CREATE TABLE mode_directives (
          mode_key TEXT PRIMARY KEY,
          display_names_json TEXT NOT NULL,
          descriptions_json TEXT NOT NULL,
          icon_name TEXT NOT NULL DEFAULT 'Sliders',
          min_words INTEGER NOT NULL DEFAULT 0,
          max_words INTEGER,
          max_verses INTEGER,
          complexity_min INTEGER NOT NULL DEFAULT 0,
          complexity_max INTEGER NOT NULL DEFAULT 100,
          structure_mandate TEXT NOT NULL,
          template_body TEXT NOT NULL,
          accuracy_tier1 REAL NOT NULL DEFAULT 95.5,
          accuracy_tier1_5 REAL NOT NULL DEFAULT 97.0,
          accuracy_tier2 REAL NOT NULL DEFAULT 98.5,
          accuracy_tier3 REAL NOT NULL DEFAULT 99.5
        );
      `);

      db.run(`
        CREATE TABLE warmth_directives (
          level_id TEXT PRIMARY KEY,
          min_score INTEGER NOT NULL,
          max_score INTEGER NOT NULL,
          icon_name TEXT NOT NULL DEFAULT 'Flame',
          temp_delta_bias REAL NOT NULL DEFAULT 0.0,
          labels_json TEXT NOT NULL,
          directive_text_json TEXT NOT NULL
        );
      `);

      db.run(`
        CREATE TABLE metrics_schemas (
          language_code TEXT PRIMARY KEY,
          complexity_title TEXT NOT NULL,
          mode_title TEXT NOT NULL,
          accuracy_title TEXT NOT NULL,
          badge_template TEXT NOT NULL
        );
      `);

      db.run(`
        CREATE TABLE prompt_modules (
          module_id TEXT PRIMARY KEY,
          category TEXT NOT NULL,
          content TEXT NOT NULL,
          tags TEXT,
          is_active INTEGER NOT NULL DEFAULT 1
        );
      `);

      db.run(`
        CREATE TABLE server_metadata (
          key TEXT PRIMARY KEY,
          value_json TEXT NOT NULL,
          description TEXT
        );
      `);

      // 1.1 Insert Server Metadata
      db.run(`
        INSERT INTO server_metadata (key, value_json, description) VALUES
        ('server_info', '{"server":"holy-bible-mcp","version":"1.0.1","name":{"uk":"Holy Bible MCP","en":"Holy Bible MCP","ru":"Holy Bible MCP"},"description":{"uk":"Богословський інтелектуальний MCP-сервер із першоджерелами, Strong''s номерами та адаптивним контекстом.","en":"Theological intelligent MCP server with primary scripture sources, Strong''s etymology, and adaptive context.","ru":"Богословский интеллектуальный MCP-сервер с первоисточниками, номерами Стронга и адаптивным контекстом."}}', 'General MCP server identity and multilingual descriptions'),
        ('settings_metadata', '{"warmth":{"label":{"uk":"Теплота відповіді","en":"Response Warmth","ru":"Теплота ответа"},"description":{"uk":"Рівень душевного тепла та пасторської глибини у відповідях.","en":"Level of warmth and pastoral depth in responses.","ru":"Уровень теплоты и пасторской глубины в ответах."},"minLabel":{"uk":"Академічний","en":"Academic","ru":"Академический"},"maxLabel":{"uk":"Глибока Емпатія","en":"Deep Empathy","ru":"Глубокая Эмпатия"}},"modeKey":{"label":{"uk":"Режим деталізації","en":"Detail Level","ru":"Режим детализации"},"description":{"uk":"Визначає глибину богословського аналізу та кількість цитат.","en":"Sets depth of theological analysis and number of citations.","ru":"Определяет глубину анализа и количество цитат."}},"showMetrics":{"label":{"uk":"Додаткова інформація (MCP)","en":"Additional Info (MCP)","ru":"Доп. информация (MCP)"},"description":{"uk":"Показувати точність і режими в кінці відповіді.","en":"Show accuracy and modes at the end of responses.","ru":"Показывать точность и режимы в конце ответа."}}}', 'Multilingual labels for top-level MCP settings');
      `);

      // 2. Insert Model Tiers
      db.run(`
        INSERT INTO model_tier_directives 
        (tier_id, name_display, min_param_size_b, max_param_size_b, default_num_ctx, default_num_predict, min_p, base_temp, top_p, repeat_penalty, frequency_penalty, presence_penalty, repeat_last_n, max_think_chars, supports_cot, max_allowed_mode, system_directive, thinking_directive)
        VALUES
        ('tier1', 'Tier 1 (Small <=8.5B)', 0.0, 8.5, 4096, 2000, 0.07, 0.25, 0.85, 1.15, 0.08, 0.08, 256, 1500, 1, 'detailed',
         '[TIER 1 COMPACT MODEL DIRECTIVE — CONCISE & STRUCTURAL]:\n• Focus on 1-2 core theological concepts with high factual precision.\n• Cite authentic Scripture verses from the provided canonical list (e.g. «...» — 1 Івана 4:8).\n• Use short, direct sentences with zero decorative filler, melodrama, or patronizing greetings.\n• Do NOT repeat phrases or enter generation loops.\n• Keep response clean, mature, and highly legible with concise Markdown headers.',
         '<think>1. Identify the core intent of the question. 2. Select 1-2 key verses from the provided canonical list. 3. Formulate direct, clear points without verbosity. Keep reasoning strictly under 1500 characters.</think>'),
        ('tier1_5', 'Tier 1.5 (Compact Mid 8.5-10.5B)', 8.5, 10.5, 6144, 2500, 0.06, 0.30, 0.88, 1.12, 0.06, 0.06, 256, 2000, 1, 'deep',
         '[TIER 1.5 BALANCED COMPACT DIRECTIVE]:\n• Provide balanced structured reasoning with concise scripture etymology.\n• Break down theological meaning into 2-3 logical aspects.\n• Cite verified Scripture verses from the provided canonical list with brief theological explanation.\n• Conclude with an actionable practical life takeaway.\n• Avoid repetitive discourse, melodrama, and maintain disciplined Markdown structure.',
         '<think>1. Analyze question theological depth. 2. Map verified verses to biblical context. 3. Formulate concise linguistic insights. 4. Synthesize practical application.</think>'),
        ('tier2', 'Tier 2 (Medium Standard 10.5-24.9B)', 10.5, 24.99, 8192, 3500, 0.05, 0.40, 0.90, 1.08, 0.05, 0.05, 128, 3500, 1, 'deep',
         '[TIER 2 MEDIUM STANDARD DIRECTIVE — MULTI-DIMENSIONAL]:\n• Provide rich linguistic etymology and multi-dimensional covenantal analysis.\n• Connect Old Testament covenantal foundations with New Testament fulfillment.\n• Cite verified Scripture verses from the canonical list with Strong''s Hebrew/Greek roots and clear theological explanation.\n• Address historical context, theological nuance, and practical spiritual application.\n• Use rich formatting with structured callouts and comparative analysis.',
         '<think>1. Conduct etymological root analysis for Hebrew/Greek keywords. 2. Map Old Testament and New Testament canonical connections. 3. Structure theological nuances, covenant progression, and life applications.</think>'),
        ('tier3', 'Tier 3 (Frontier / High-Capacity >=25B / Cloud)', 25.0, NULL, 16384, 5000, 0.04, 0.50, 0.90, 1.08, 0.05, 0.05, 128, 4500, 1, 'deep',
         '[TIER 3 FRONTIER MODEL DIRECTIVE — EXHAUSTIVE EXEGETICAL & HERMENEUTICAL]:\n• Provide deep canonical cross-mesh analysis, rich typological connections, and multi-layered hermeneutical synthesis.\n• Trace biblical themes across Pentateuch, Prophets, Wisdom literature, Gospels, and Epistles.\n• Synthesize historical, grammatical, covenantal, and patristic dimensions, quoting verified verses from the canonical list.\n• Deliver an authoritative, profound study with exhaustive linguistic depth, Strong''s etymology, and pastoral wisdom.\n• Maintain impeccable Markdown organization with callout alerts, tables, and structured sections.',
         '<think>1. Perform comprehensive exegetical analysis of underlying texts. 2. Trace covenantal and typological theology through canonical trajectory. 3. Integrate historical-grammatical insights and Strong''s concordance. 4. Synthesize doctrinal conclusions and transformative spiritual application.</think>');
      `);

      // 3. Insert Modes
      db.run(`
        INSERT INTO mode_directives 
        (mode_key, display_names_json, descriptions_json, icon_name, min_words, max_words, max_verses, complexity_min, complexity_max, structure_mandate, template_body, accuracy_tier1, accuracy_tier1_5, accuracy_tier2, accuracy_tier3)
        VALUES
        ('minimal', 
         '{"uk":"⚡ Мінімальний","en":"⚡ Minimal","ru":"⚡ Минимальный"}',
         '{"uk":"Коротка суть (до 60 слів)","en":"Short essence (under 60 words)"}',
         'Zap', 0, 60, 1, 0, 29,
         'MINIMAL MODE — STRICT RULES:\n1. Write exactly ONE paragraph (max 60 words).\n2. Reference MAXIMUM 1 scripture verse from the provided "📜 Вірші з Біблії" list.\n3. Do NOT add commentary sections, headers, or numbered lists.\n4. Do NOT cite any verse NOT listed above.',
         'You are a concise Bible Guide. Give a MINIMAL response (under 40 words).',
         95.5, 97.0, 98.5, 99.5),
        ('verses_only', 
         '{"uk":"📜 Тільки Вірші","en":"📜 Verses Only","ru":"📜 Только Стихи"}',
         '{"uk":"Лише цитати Письма","en":"Only Scripture citations"}',
         'Scroll', 0, 9999, 999, 25, 34,
         'VERSES ONLY MODE — STRICT RULES:\n1. Output ONLY the verified scripture references provided in "📜 Вірші з Біблії".\n2. Format each verse as: • 📖 Book Chapter:Verse — «Verse text»\n3. Add NO commentary, explanation, or analysis whatsoever.\n4. Do NOT invent any additional verses.',
         'You are a scripture extraction engine. Give a STRICT VERSES ONLY response.',
         98.5, 99.0, 99.5, 99.9),
        ('short', 
         '{"uk":"📝 Короткий","en":"📝 Short","ru":"📝 Краткий"}',
         '{"uk":"1–2 ключових вірші та суть","en":"1–2 key verses and core meaning"}',
         'Pencil', 60, 150, 2, 30, 49,
         'SHORT MODE — STRICT RULES:\n1. Write 2-3 short paragraphs (max 150 words total).\n2. Reference MAXIMUM 2 scripture verses from the provided "📜 Вірші з Біблії" list.\n3. Focus on the core theological point only.\n4. Do NOT cite any verse NOT listed above.',
         'You are a concise Bible Guide. Give a SHORT response (under 100 words).',
         95.5, 97.0, 98.5, 99.5),
        ('medium', 
         '{"uk":"⚖️ Збалансований","en":"⚖️ Balanced","ru":"⚖️ Сбалансированный"}',
         '{"uk":"Вірші + пояснення + практичний висновок","en":"Verses + explanation + practical takeaway"}',
         'Scale', 150, 350, 4, 50, 67,
         'BALANCED MODE — STRICT RULES:\n1. Write 3-4 structured sections with Markdown headers (###).\n2. Reference MAXIMUM 4 scripture verses from the provided "📜 Вірші з Біблії" list and quote their key lines.\n3. Include brief theological insights and 1-2 practical takeaways.\n4. Do NOT cite any verse NOT listed above. Do NOT hallucinate references.',
         'You are a wise Bible Scholar. Give a BALANCED response (around 150 words).',
         96.5, 97.5, 99.0, 99.9),
        ('detailed', 
         '{"uk":"🔍 Детальний","en":"🔍 Detailed","ru":"🔍 Подробный"}',
         '{"uk":"Контекст + Strong etymology + чеклист дій","en":"Context + Strong etymology + action checklist"}',
         'Search', 350, 750, 8, 68, 79,
         'DETAILED MODE — STRICT RULES:\n1. Write 5+ structured sections with Markdown headers (###).\n2. Reference and quote scripture verses in "📜 Вірші з Біблії" with brief Strong''s etymology if available.\n3. Include historical context, theological analysis, and practical application.\n4. Do NOT cite any verse NOT listed above.',
         'You are a detailed Bible Scholar. Provide a THOROUGH response with full language etymology, Strong''s verification, and deep multi-dimensional reasoning.',
         97.0, 98.0, 99.0, 99.9),
        ('deep', 
         '{"uk":"🏛️ Глибокий","en":"🏛️ Deep","ru":"🏛️ Глубокий"}',
         '{"uk":"Повний богословський аналіз і патристика","en":"Full theological treatise & patristic synthesis"}',
         'Landmark', 750, 2500, 999, 80, 100,
         'DEEP EXHAUSTIVE MODE — STRICT RULES:\n1. Write a full theological treatise with numbered chapters and subheadings.\n2. Reference and quote scripture verses in "📜 Вірші з Біблії" with Strong''s Hebrew/Greek roots.\n3. Include canonical cross-references ONLY from the provided verse list.\n4. Add patristic commentary, practical application, and conclusion.\n5. Do NOT hallucinate or invent any verse references not listed above.',
         'You are an exhaustive Bible Scholar. Provide a DEEP THEOLOGICAL STUDY of the topic.',
         97.0, 98.0, 99.0, 99.9),
        ('unrestricted',
         '{"uk":"🌿 Вільний","en":"🌿 Unrestricted","ru":"🌿 Свободный"}',
         '{"uk":"Природна відповідь без штучних обмежень довжини","en":"Natural response without length constraints"}',
         'Sparkles', 0, 9999, 999, 0, 100,
         'NATURAL UNRESTRICTED RESPONSE — STABILITY & CANONICAL INTEGRITY RULES:\n1. Answer naturally, clearly, and directly in whatever length and style is best suited to the question.\n2. Cite verified Scripture verses from the canonical list (e.g. «...» — 1 Івана 4:8 or 📖 1 Івана 4:8) and explain their meaning.\n3. Maintain a respectful, mature theological voice without emotional melodrama or patronizing greetings (e.g. "дитя моє").\n4. Conclude your answer cleanly once the core meaning is explained — DO NOT repeat verses or loop endlessly.\n5. DO NOT emit citation markers like {{CITATION:...}} or tool-calling tokens.',
         'You are a wise Bible Guide. Give a natural, well-grounded response.',
         96.0, 97.5, 99.0, 99.9);
      `);

      // 4. Insert Warmth Profiles (Mature Pastoral Tone)
      db.run(`
        INSERT INTO warmth_directives 
        (level_id, min_score, max_score, icon_name, temp_delta_bias, labels_json, directive_text_json)
        VALUES
        ('academic', 0, 39, 'Snowflake', -0.05,
         '{"uk":"Аналітичний/Строгий Стиль","en":"Academic / Analytical","ru":"Аналитический / Строгий"}',
         '{"uk":"Надавай точну, академічну та стриману богословську відповідь із чітким етимологічним аналізом без емоційних вступів.","en":"Provide a precise, academic, and dry theological response with strict etymological analysis and zero emotional preambles."}'),
        ('balanced', 40, 69, 'Scale', 0.0,
         '{"uk":"Збалансований Стиль","en":"Balanced / Practical","ru":"Сбалансированный Стиль"}',
         '{"uk":"Поєднуй богословську точність із практичним життєвим застосуванням та повагою до співрозмовника.","en":"Combine rigorous theological accuracy with balanced practical life application."}'),
        ('warm', 70, 84, 'Flame', 0.03,
         '{"uk":"Висока Чутливість (Любов/Душа)","en":"Warm Pastoral / Soul Care","ru":"Высокая Чувствительность"}',
         '{"uk":"Надавай теплу, підтримуючу та пастирську відповідь, фокусуючись на надії, милосерді та живій вірі. Зберігай зрілий, шанобливий тон.","en":"Provide a warm, supportive, and pastoral response focused on living faith, hope, and compassion with mature respect."}'),
        ('deep_love', 85, 100, 'Sparkles', 0.05,
         '{"uk":"Глибока Любов / Емпатія","en":"Deep Love / Unconditional Compassion","ru":"Глубокая Любовь"}',
         '{"uk":"Надавай глибоку пастирську підтримку, співпереживання та духовну втіху на основі Слова Божого. Зберігай дорослий, поважний, богословськи виважений тон. Категорично уникай фамільярних, сюсюкаючих звертань (таких як «дитя моє», «дитинко»).","en":"Provide deep pastoral support, empathy, and spiritual comfort grounded in Scripture. Maintain a mature, respectful, and theologically sound tone. Never use patronizing or infantalizing greetings."}');
      `);

      // 5. Insert Metrics Schemas
      const ukBadge = '📊 **{complexityTitle}:** `{complexityScore}/100` | ⚖️ **{modeTitle}:** `{modeValue}` | 🛡️ **{accuracyTitle}:** `{accuracyScore}`';
      const enBadge = '📊 **{complexityTitle}:** `{complexityScore}/100` | ⚖️ **{modeTitle}:** `{modeValue}` | 🛡️ **{accuracyTitle}:** `{accuracyScore}`';
      const ruBadge = '📊 **{complexityTitle}:** `{complexityScore}/100` | ⚖️ **{modeTitle}:** `{modeValue}` | 🛡️ **{accuracyTitle}:** `{accuracyScore}`';
      db.run(`
        INSERT INTO metrics_schemas (language_code, complexity_title, mode_title, accuracy_title, badge_template)
        VALUES
        ('uk', 'Складність', 'Режим', 'Точність', '${ukBadge}'),
        ('en', 'Complexity', 'Mode', 'Accuracy', '${enBadge}'),
        ('ru', 'Сложность', 'Режим', 'Точность', '${ruBadge}'),
        ('default', 'Complexity', 'Mode', 'Accuracy', '${enBadge}');
      `);

      // 6. Insert Prompt Modules
      db.run(`
        INSERT INTO prompt_modules (module_id, category, content, tags)
        VALUES
        ('critical_rules', 'integrity', 
         '[CRITICAL ANTI-HALLUCINATION & CANONICAL RENDERING MANDATE]:\n• Cite verified scripture verses accurately from the provided canonical list (e.g. «...» — 1 Івана 4:8 or 📖 1 Івана 4:8). Do NOT invent, hallucinate, or misattribute book names.\n• DO NOT use emotional roleplay greetings (e.g. "дитя моє", "дитиночко"). Start directly and speak with adult theological clarity.\n• Conclude cleanly once the answer is complete — DO NOT repeat verses or enter generation loops.\n• DO NOT emit unfinished citation tags like {{CITATION:...}} or tool-calling syntax.\n• Respond in clean Markdown using the provided canonical scripture context.', 'integrity,anti-loop,guardrails'),
        ('grounding_header', 'grounding', '[HOLY BIBLE MCP ACTIVE GROUNDING]:', 'grounding,header'),
        ('grounding_source', 'grounding', '• Grounding Source: SQLite Canonical Scripture Database (5.88 GB, FTS5 Zero-Latency)', 'grounding,source'),
        ('bold_syntax_mandate', 'syntax', 
         'CRITICAL RESPONSE RULES — MANDATORY:\n• Reference ONLY verified scripture verses from "📜 Вірші з Біблії". DO NOT invent, add, or paraphrase other verses.\n• Respond in clean Markdown focusing on theological explanation and application.', 'markdown,formatting,syntax');
      `);

      db.close((err) => {
        if (err) reject(err);
        else {
          console.log(`[SEED ENGINE] ✅ Successfully built pre-populated SQLite database at: ${dbPath}`);
          resolve();
        }
      });
    });
  });
}

async function run() {
  for (const p of TARGET_DB_PATHS) {
    try {
      await seedDatabase(p);
    } catch (e) {
      console.error(`Error seeding ${p}:`, e);
    }
  }
}

run();
