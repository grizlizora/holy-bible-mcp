import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.resolve("./data/directives.sqlite");
console.log("📦 Migrating all text and knowledge databases into SQLite:", dbPath);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Configure high-concurrency WAL & Memory PRAGMAs
  db.run("PRAGMA busy_timeout = 5000;");
  db.run("PRAGMA journal_mode = WAL;");
  db.run("PRAGMA synchronous = NORMAL;");
  db.run("PRAGMA temp_store = MEMORY;");
  db.run("PRAGMA mmap_size = 30000000000;");
  db.run("PRAGMA cache_size = -64000;");

  // 1. Translations Catalog Table
  db.run(`
    CREATE TABLE IF NOT EXISTS translations_catalog (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      language_code TEXT NOT NULL,
      year INTEGER,
      philosophy TEXT NOT NULL,
      textual_basis TEXT NOT NULL,
      description TEXT NOT NULL
    )
  `);

  // 2. Trench Synonyms Table
  db.run(`
    CREATE TABLE IF NOT EXISTS trench_synonyms (
      strongs_id TEXT PRIMARY KEY,
      synonym_group TEXT NOT NULL,
      distinction TEXT NOT NULL,
      theological_significance TEXT NOT NULL
    )
  `);

  // 3. Messianic Prophecies Table
  db.run(`
    CREATE TABLE IF NOT EXISTS messianic_prophecies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      topic_title TEXT NOT NULL,
      prophecy_osis TEXT NOT NULL,
      prophecy_display_title TEXT NOT NULL,
      prophecy_text TEXT NOT NULL,
      prophecy_epoch_bce TEXT NOT NULL,
      fulfillment_osis TEXT NOT NULL,
      fulfillment_display_title TEXT NOT NULL,
      fulfillment_text TEXT NOT NULL,
      fulfillment_epoch_ce TEXT NOT NULL,
      time_gap_years INTEGER NOT NULL,
      theological_significance TEXT NOT NULL
    )
  `);

  // 4. Thematic Chains Table
  db.run(`
    CREATE TABLE IF NOT EXISTS thematic_chains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      theme TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      osis TEXT NOT NULL,
      display_title TEXT NOT NULL,
      epoch TEXT NOT NULL,
      text_snippet TEXT NOT NULL,
      theological_link TEXT NOT NULL
    )
  `);

  // 5. Prompt Templates Table
  db.run(`
    CREATE TABLE IF NOT EXISTS prompt_templates (
      name TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      template_body TEXT NOT NULL,
      category TEXT NOT NULL
    )
  `);

  // Insert Translations
  const translations = [
    ["UBIO", "Біблія Івана Огієнка", "Огієнко", "ukr", 1962, "FORMAL", "Masoretic / Textus Receptus", "Канонічний український переклад: урочистий, точний, літургійний стиль."],
    ["UKRK", "Римська Біблія Івана Хоменка", "Хоменко", "ukr", 1963, "OPTIMAL", "Masoretic / Critical Greek", "Літературний переклад оо. Василіян, поетична мова, повний канон."],
    ["UTT", "Українське Біблійне Товариство (Рафаїл Турконяк)", "Турконяк", "ukr", 2011, "FORMAL", "Septuagint LXX / NA28", "Сучасний академічний переклад УБТ з мов оригіналу."],
    ["UKRL", "Біблія Куліша, Пулюя та Нечуй-Левицького", "Куліш", "ukr", 1903, "FORMAL", "Masoretic / Textus Receptus", "Перший повний український переклад Біблії живою мовою."],
    ["UKRG", "Новий Завіт Михайла Громова", "Громов", "ukr", 2020, "DYNAMIC", "Nestle-Aland 28th", "Сучасна українська мова, смислова динамічна еквівалентність."],
    ["KJV", "King James Version (Authorized)", "KJV", "eng", 1611, "FORMAL", "Textus Receptus / Masoretic", "Historic majesty, poetic cadence, formal equivalence."],
    ["WEB", "World English Bible", "WEB", "eng", 2000, "FORMAL", "BHS / Byzantine Majority", "100% Public Domain modern English formal equivalence."],
    ["BSB", "Berean Standard Bible", "BSB", "eng", 2023, "OPTIMAL", "WLC / NA28 Critical", "High-accuracy modern translation dedicated to Public Domain CC0."],
    ["ASV", "American Standard Version", "ASV", "eng", 1901, "FORMAL", "Westcott-Hort / Masoretic", "Ultra-literal formal equivalence translation."],
    ["NET", "New English Translation", "NET", "eng", 2019, "OPTIMAL", "BHS / NA28 Critical", "Balanced readability with extensive critical footnotes."],
    ["WLC", "Westminster Leningrad Codex", "WLC", "heb", 1008, "INTERLINEAR", "Codex Leningradensis B19a", "Original Hebrew and Aramaic Old Testament text with vowels."],
    ["NA28", "Nestle-Aland 28th Edition / SBLGNT", "NA28", "grc", 2012, "INTERLINEAR", "Critical Alexandrian Text", "Standard scholarly Greek New Testament with full morphology."],
    ["LXX", "Rahlfs-Hanhart Septuaginta", "LXX", "grc", -250, "INTERLINEAR", "Alexandrian Greek OT", "Ancient Greek translation of the Hebrew Scriptures."],
    ["BYZ", "Byzantine Majority Text (RP2018)", "BYZ", "grc", 2018, "INTERLINEAR", "Byzantine Cursives Majority", "Ecclesiastical majority text of the Eastern Greek tradition."],
    ["VULG", "Biblia Sacra Vulgata (Clementina)", "VULG", "lat", 405, "FORMAL", "St. Jerome Latin", "Historic Latin translation foundational for Western Christian theology."]
  ];

  const insertTransStmt = db.prepare(`INSERT OR REPLACE INTO translations_catalog VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const t of translations) {
    insertTransStmt.run(t);
  }
  insertTransStmt.finalize();

  // Insert Trench Synonyms
  const synonyms = [
    ["G0025", "Love: Agape (ἀγαπάω/ἀγάπη) vs Phileo (φιλέω)", "ἀγαπάω (agapao) expresses intentional, selfless, unconditional choice of the will seeking the highest eternal good of the beloved. φιλέω (phileo) expresses natural affection, kinship, emotional fondness, and mutual friendship.", "In John 21:15-17, Christ asks Peter twice 'ἀγαπᾷς με;' (Do you love Me with total devotion?). Peter responds 'φιλῶ σε' (You know I am fondly devoted to You). In the 3rd question, Jesus graciously descends to meet Peter at his level: 'φιλεῖς με;'."],
    ["G0026", "Love: Agape (ἀγάπη) vs Phileo (φιλία)", "ἀγάπη (agape) is divine covenantal love rooted in God's nature (1 John 4:8). It gives itself even when unmerited or rejected (Rom 5:8).", "The supreme ethical virtue of the New Covenant (1 Cor 13). It is the fruit of the Holy Spirit, not human effort."],
    ["G5368", "Love: Phileo (φιλέω) vs Agape (ἀγαπάω)", "φιλέω denotes personal attachment, warmth, and brotherly affection.", "Used for the Father's tender affection for the Son (John 5:20) and for mutual affection among believers (Philadelphia, Rom 12:10)."],
    ["G2222", "Life: Zoe (ζωή) vs Bios (βίος) vs Psyche (ψυχή)", "ζωή (zoe) is uncreated, eternal, divine life in Christ (John 1:4, 10:10). βίος (bios) is biological/physical lifespan and material goods (1 John 3:17). ψυχή (psyche) is the psychological self, soul, and consciousness.", "Believers transition from physical existence (bios) into eternal divine participation (zoe aionios)."],
    ["G1097", "Knowledge: Ginosko (γινώскω) vs Oida (οἶδα)", "γινώσκω (ginosko) is experiential, relational, progressive knowledge gained through encounter. οἶδα (oida) is intuitive, complete, absolute factual perception.", "Eternal life is to 'know' (γινώσκωσιν) the only true God relationally (John 17:3)."],
    ["G3056", "Word: Logos (λόγος) vs Rhema (ῥῆμα)", "λόγος (logos) is the eternal divine Reason, plan, and incarnate Person of the Son (John 1:1). ῥῆма (rhema) is the specific spoken utterance, dynamic living word for a moment (Rom 10:17).", "Christ is the eternal Logos; Scripture spoken to the heart by the Spirit is the sword of the Spirit, the rhema of God (Eph 6:17)."],
    ["H7225", "Beginning: Reshit (רֵאשִׁית) vs Rosh (רֹאשׁ)", "רֵאשִׁית (reshit) denotes first in time, chief in dignity, or firstfruits of harvest. Derived from רֹאשׁ (rosh - head).", "In Genesis 1:1, God initiates creation 'in the firstfruits / headship' which Paul links to Christ as the Head of creation and firstborn from the dead (Col 1:18)."],
    ["H1254", "Creation: Bara (בָּרָא) vs Asah (עָשָׂה) vs Yatsar (יָצַר)", "בָּרָא (bara) is exclusive to divine creation ex-nihilo (out of nothing) with no preexisting materials. עָשָׂה (asah) is fashioning from materials. יָצַר (yatsar) is pottery-like shaping (e.g. Adam from dust).", "Bara signifies God's sovereign transcendence: calling into existence things that were not."],
    ["H2617", "Covenant Love: Hesed (חֶסֶד) vs Emet (אֱמֶת)", "חֶסֶד (hesed) is steadfast, unshakeable covenant loyalty, mercy, and grace. אֱמֶת (emet) is firmness, truth, and faithfulness.", "Hesed and Emet meet at the cross: God's covenant grace (hesed) and righteous truth (emet) harmonized (Ps 85:10, John 1:17)."],
    ["H7965", "Peace: Shalom (שָׁלוֹם)", "שָׁלוֹם (shalom) is not merely the absence of war, but wholeness, completeness, sound health, justice, and harmonious covenant relationship with God.", "The Messiah is the Prince of Shalom (Isa 9:6), establishing the covenant of peace (Ezek 37:26)."]
  ];

  const insertSynStmt = db.prepare(`INSERT OR REPLACE INTO trench_synonyms VALUES (?, ?, ?, ?)`);
  for (const s of synonyms) {
    insertSynStmt.run(s);
  }
  insertSynStmt.finalize();

  // Insert Messianic Prophecies
  const prophecies = [
    ["seed_of_the_woman", "Протоєвангеліє: Насіння Жінки, що розчавить змія", "GEN.3.15", "Буття 3:15", "«І Я покладу ворожнечу між тобою й між жінкою... воно зітре тобі голову, а ти будеш жалити його в п'яту.»", "c. 1440 BCE (Мойсей)", "GAL.4.4", "Галатів 4:4 / 1 Івана 3:8", "«Як настала ж повнота часу, Бог послав Свого Сина, що родився від жони... щоб знищити справи диявола.»", "c. 49–90 CE", 1450, "Перша обітниця спасіння в Едемі: Христос перемагає сатану через Свою хресну смерть та воскресіння."],
    ["virgin_birth", "Народження від Діви: Еммануїл (З нами Бог)", "ISA.7.14", "Ісая 7:14", "«Ось Діва в утробі зачне, і Сина породить, і назвеш ім'я Йому: Еммануїл!»", "c. 734 BCE", "MAT.1.22-23", "Матвія 1:22-23 / Луки 1:34-35", "«А все це сталося, щоб збулося сказане від Господа через пророка: Ось діва в утробі зачне... Еммануїл, що значить: З нами Бог.»", "c. 5 BCE / 60 CE", 730, "Божественне втілення: Христос є істинним Богом і безгрішною Людиною."],
    ["birthplace_bethlehem", "Місце народження: Віфлеєм Юдейський", "MIC.5.2", "Михей 5:2", "«А ти, Віфлеєме-Єфрато... з тебе Мені вийде Той, що буде Владикою в Ізраїлі, і віддавна постання Його, від днів віковічних.»", "c. 710 BCE", "MAT.2.1", "Матвія 2:1-6 / Луки 2:4-7", "«Коли ж народився Ісус у Віфлеємі Юдейськім... прибули мудреці зі сходу.»", "c. 5 BCE", 705, "Підтверджує вічне передвічне походження Сина Божого та Давидову царську лінію."],
    ["suffering_servant_atonement", "Страждаючий Раб: Замісна Жертва за наші гріхи", "ISA.53.5-6", "Ісая 53:5-6", "«А Він був ранений за наші гріхи, за наші провини Він мучений був... ранами Його нас уздоровлено!»", "c. 700 BCE", "1PE.2.24", "1 Петра 2:24 / Римлян 5:8", "«Він тілом Своїм Сам підніс наші гріхи на дерево... Його ранами ви оздоровилися!»", "c. 64 CE", 760, "Серцевина Євангелія: замісна спокута (Substitutionary Atonement), де Христос бере наш вирок на Себе."],
    ["resurrection_no_decay", "Воскресіння: Тіло не побачить тління", "PSA.16.10", "Псалом 16:10", "«Бо Ти не опустиш моєї душі до шеолу, не попустиш Своєму Святому побачити тління!»", "c. 1000 BCE (Давид)", "ACT.2.31", "Дії 2:31 / 13:35-37", "«Він, передбачивши, казав про Христове воскресіння, що не зостанеться в шеолі душа Його, ані тіло Його не зазнає зопління.»", "c. 33 CE", 1030, "Тріумф над смертю: гарантія воскресіння та вічного життя для кожного віруючого."],
    ["betrayal_thirty_silver", "Зрада за 30 срібняків та поле ганчаря", "ZEC.11.12-13", "Захарія 11:12-13", "«І відважили плату мені тридцять срібняків... Кинь її ганчареві, оту славну ціну, що вони оцінили Мене!»", "c. 520 BCE", "MAT.26.15", "Матвія 26:15 / 27:3-10", "«Вони ж відважили йому тридцять срібняків... і купили за них ганчарське поле на гроби для чужинців.»", "c. 33 CE", 550, "Точність біблійних деталей: ціна раба за Законом стала ціною зради Месії."]
  ];

  const insertProphetStmt = db.prepare(`
    INSERT OR REPLACE INTO messianic_prophecies (topic, topic_title, prophecy_osis, prophecy_display_title, prophecy_text, prophecy_epoch_bce, fulfillment_osis, fulfillment_display_title, fulfillment_text, fulfillment_epoch_ce, time_gap_years, theological_significance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of prophecies) {
    insertProphetStmt.run(p);
  }
  insertProphetStmt.finalize();

  // Insert Thematic Chains
  const chains = [
    ["living_water", 1, "EXO.17.6", "Вихід 17:6", "Мойсеєвий Заповіт", "«І вдариш у скелю, і вийде з неї вода, і питиме народ!»", "Скеля у пустелі як фізичне джерело життя."],
    ["living_water", 2, "ISA.55.1", "Ісая 55:1", "Пророча доба", "«О всі спраглі, йдіть до води, а ви, що не маєте срібла, ідіть...»", "Пророче запрошення до благодаті без плати."],
    ["living_water", 3, "JHN.4.14", "Івана 4:14", "Втілення Христа", "«А хто питиме воду, що Я йому дам, прагнути не буде повік...»", "Христос відкриває джерело живої води вічного життя."],
    ["living_water", 4, "REV.22.17", "Об'явлення 22:17", "Есхатологія", "«І Дух і невіста кажуть: Прийди!... хто прагне, нехай прийде, і воду життя нехай бере дармо!»", "Вічний тріумф: благодать у Новому Єрусалимі."],
    ["seed_of_faith", 1, "GEN.3.15", "Буття 3:15", "Едемське Протоєвангеліє", "«Воно зітре тобі голову...»", "Обітниця насіння жінки."],
    ["seed_of_faith", 2, "GEN.12.3", "Буття 12:3", "Авраамовий Заповіт", "«І благословляться в тобі всі племена землі!»", "Благословення народів через Насіння."],
    ["seed_of_faith", 3, "GAL.3.16", "Галатів 3:16", "Апостольське богослов'я", "«Не сказано: 'і насінням', як про багатьох, але як про Одного: 'і Насінню твоєму', Яким є Христос.»", "Христос як єдине істинне Насіння Авраама."],
    ["seed_of_faith", 4, "REV.12.11", "Об'явлення 12:11", "Вічна перемога", "«І вони перемогли його кров'ю Агнця та словом свого засвідчення...»", "Повний розгром сатани та вічне царювання святих."]
  ];

  const insertChainStmt = db.prepare(`
    INSERT OR REPLACE INTO thematic_chains (theme, step_number, osis, display_title, epoch, text_snippet, theological_link)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of chains) {
    insertChainStmt.run(c);
  }
  insertChainStmt.finalize();

  console.log("✅ All tables populated into SQLite successfully.");
  db.close();
});
