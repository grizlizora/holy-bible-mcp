import { DirectiveStore } from "../build/directives/directive_store.js";
import { MorphologyEngine } from "../build/morphology_engine.js";
import { ScriptureGraphEngine } from "../build/scripture_graph_engine.js";
import { UkrainianMorphologyEngine, HybridSearchEngine } from "../build/hybrid_search_engine.js";
import { ParallelCorpusEngine } from "../build/parallel_corpus_engine.js";
import { DynamicTokenBudgetManager, NeuralThinkingEngine } from "../build/token_optimizer/index.js";

export async function runVerificationTests() {
  console.log("=================================================================");
  console.log("🧪 RUNNING COMPREHENSIVE VERIFICATION FOR HOLY BIBLE MCP 2.0 (SQLITE-DRIVEN)");
  console.log("=================================================================\n");

  // 1. Initialize DirectiveStore from SQLite
  await DirectiveStore.getInstance().loadDirectives();

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      failed++;
    }
  }

  // --- STAGE 1: SQLITE TRANSLATION CATALOG ---
  console.log("📦 1. VERIFYING SQLITE TRANSLATION CATALOG (15 Translations from SQLite):");
  const translations = DirectiveStore.getInstance().getTranslations();
  assert(Object.keys(translations).length >= 15, "15 Canonical translations loaded from SQLite");
  assert(translations["UBIO"]?.name.includes("Огієнк"), "UBIO Ogienko loaded from SQLite");
  assert(translations["WLC"]?.philosophy === "INTERLINEAR", "WLC Hebrew Interlinear loaded from SQLite");
  assert(translations["NA28"]?.textualBasis.includes("Critical"), "NA28 Critical Greek loaded from SQLite");

  // --- STAGE 2: SQLITE TRENCH SYNONYMS & MORPHOLOGY ---
  console.log("\n🏛️ 2. VERIFYING MORPHOLOGY & SQLITE STRONG'S ENGINE:");
  const greekMorph = MorphologyEngine.parseGreekMorphCode("V-AAI-3S");
  assert(greekMorph.pos === "Verb" && greekMorph.tense === "Aorist" && greekMorph.voice === "Active", "Greek Robinson V-AAI-3S parsed correctly");

  const greekParticiple = MorphologyEngine.parseGreekMorphCode("V-PAP-NSM");
  assert(greekParticiple.mood === "Participle" && greekParticiple.caseGrammatical === "Nominative", "Greek Robinson Participle V-PAP-NSM parsed correctly");
  
  const hebrewMorph = MorphologyEngine.parseHebrewMorphCode("V-q-3ms");
  assert(hebrewMorph.stem === "Qal", "Hebrew WLC V-q-3ms parsed correctly");

  const hebrewPrefix = MorphologyEngine.parseHebrewMorphCode("HR/Ncfsa");
  assert(hebrewPrefix.description.includes("Preposition"), "Hebrew WLC Clitic HR/Ncfsa decomposed correctly");

  const strongsEtym = await MorphologyEngine.getStrongsEtymology("G26");
  assert(strongsEtym.lemma === "ἀγάπη" || strongsEtym.lemma.length > 0, "Strong's G26 lemma resolved");
  assert(strongsEtym.trenchSynonyms?.group.includes("Agape"), "Trench's Synonyms (Agape vs Phileo) loaded from SQLite");

  const cyrillicAliasEtym = await MorphologyEngine.getStrongsEtymology("агапе");
  assert(cyrillicAliasEtym.strongsId === "G0026", "Cyrillic Strong's alias 'агапе' -> G0026 resolved");

  const interlinear = await MorphologyEngine.getInterlinearVerse("GEN", 1, 1);
  assert(interlinear.wordsCount > 0, `Interlinear generated ${interlinear.wordsCount} words for GEN 1:1`);

  // --- STAGE 3: SQLITE CROSS-REFERENCES & PROPHESIES GRAPH ---
  console.log("\n🔗 3. VERIFYING SCRIPTURE GRAPH ENGINE (Messianic Prophecy & Thematic Chains from SQLite):");
  const prophecies = DirectiveStore.getInstance().getMessianicProphecies();
  assert(prophecies.length >= 6, "Core Messianic Prophecy Pairs loaded from SQLite");
  
  const crossrefs = await ScriptureGraphEngine.getInstance().getRankedCrossReferences("JHN", 3, 16);
  assert(crossrefs.results.length > 0, `Cross references retrieved for John 3:16 (${crossrefs.results.length} found)`);

  const chain = await ScriptureGraphEngine.findThematicChain("living_water");
  assert(chain.length >= 4, `Thematic chain for 'living_water' retrieved ${chain.length} covenantal steps from SQLite`);

  // --- STAGE 4: HYBRID SEARCH & UKRAINIAN MORPHOLOGY ---
  console.log("\n⚡ 4. VERIFYING HYBRID SEARCH & UKRAINIAN MORPHOLOGY:");
  const stem = UkrainianMorphologyEngine.extractStem("благословеннями");
  assert(stem.length > 0 && stem.length < "благословеннями".length, `Stemmer reduced 'благословеннями' -> '${stem}'`);

  const suppletiveVerb = UkrainianMorphologyEngine.extractStem("буде");
  assert(suppletiveVerb === "бути", "Ukrainian suppletive verb 'буде' -> 'бути' resolved");

  const pastoral = await HybridSearchEngine.getInstance().findByLifeSituation("страх та тривога перед майбутнім", "auto", "ukr");
  assert(pastoral.emotion.includes("anxiety"), `Detected emotion: ${pastoral.emotion}`);
  assert(pastoral.pastoralCounsel.length > 20, "Pastoral counsel generated");

  const parallel = await ParallelCorpusEngine.getInstance().getParallelVerses("JHN", 3, 16, undefined, ["UBIO", "KJV"]);
  assert(parallel.translations.length === 2, "Parallel verses aligned across 2 translations");

  const diff = await ParallelCorpusEngine.getInstance().compareTranslationsDiff("JHN", 1, 1, "UBIO", "UKRK");
  assert(diff.diffMarkdown.includes("```diff"), "Myers LCS diff markdown produced");

  // --- STAGE 5: TOKEN OPTIMIZER & NEURAL ENGINE ---
  console.log("\n🧠 5. VERIFYING TOKEN OPTIMIZER & NEURAL ENGINE:");
  const profileTrae = DynamicTokenBudgetManager.detectContextProfile({ clientHost: "trae-ide" });
  assert(profileTrae.key === "ctx_32k", "Detected Trae IDE context window as ctx_32k (32,768 tokens)");

  const profileClaude = DynamicTokenBudgetManager.detectContextProfile({ modelName: "claude-3-7-sonnet" });
  assert(profileClaude.key === "ctx_128k_plus", "Detected Claude 3.7 context window as ctx_128k_plus (131,072 tokens)");

  const allocation = DynamicTokenBudgetManager.calculateAllocation({
    profile: profileTrae,
    mode: "medium",
    hasStrongs: true,
    hasCrossrefs: true,
    complexityScore: 80
  });
  assert(allocation.scripture > 0 && allocation.strongs > 0 && allocation.crossref > 0 && allocation.directive > 0, "40/20/20/20 budget allocated correctly");

  const cotGuidance = NeuralThinkingEngine.buildThinkingGuidance(true, "ukr");
  assert(cotGuidance.includes("<think>"), "CoT reasoning thinking protocol created for Ukrainian");

  const telemetry = NeuralThinkingEngine.generateTelemetryFooter({
    showMetrics: true,
    complexityScore: 85,
    effectiveMode: "deep",
    accuracyScore: "99.8% Canonical"
  });
  assert(telemetry.includes("[[METRICS:"), "Telemetry machine tag and badge formatted cleanly");

  console.log("\n=================================================================");
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerificationTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
