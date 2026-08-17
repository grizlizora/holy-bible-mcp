/**
 * =====================================================================
 * 🧪 BLOCK 3 POLISHING VERIFICATION (DIRECTIVE ENGINE & SQLITE)
 * =====================================================================
 */

import { DirectiveStore } from '../src/directives/directive_store';

console.log('\n=================================================================');
console.log('📖 RUNNING BLOCK 3 VERIFICATION: SQLITE MAPPINGS & DIRECTIVES');
console.log('=================================================================\n');

async function testBlock3() {
  let passed = 0;
  const store = DirectiveStore.getInstance();
  await store.loadDirectives();

  // 1. Warmth Directives & Text Resolution
  console.log('🔥 1. PASTORAL WARMTH RESOLUTION & DIRECTIVE TEXT:');
  const warmthAcademic = store.resolveWarmth(15, 'uk');
  const warmthDeep = store.resolveWarmth(95, 'uk');

  if (!warmthAcademic.label || !warmthDeep.label) {
    throw new Error('Warmth label is empty!');
  }
  console.log('  ✅ [PASS] Academic Warmth: ' + warmthAcademic.label + ' [' + warmthAcademic.levelId + ']');
  console.log('  ✅ [PASS] Deep Pastoral Love Warmth: ' + warmthDeep.label + ' [' + warmthDeep.levelId + ']');
  passed++;

  // 2. Metrics Schema ISO language codes (uk, ukr, en, eng)
  console.log('\n📊 2. METRICS SCHEMA LANGUAGE CODES (ISO 639-1 & 639-2):');
  const schemaUk = store.getMetricsSchema('uk');
  const schemaUkr = store.getMetricsSchema('ukr');
  const schemaEn = store.getMetricsSchema('en');
  const schemaEng = store.getMetricsSchema('eng');

  if (!schemaUk || !schemaUkr || !schemaEn || !schemaEng) {
    throw new Error('Metrics schema failed to resolve for dual language codes!');
  }
  console.log('  ✅ [PASS] UK / UKR Schema: ' + schemaUk.complexityTitle + ' / ' + schemaUkr.complexityTitle);
  console.log('  ✅ [PASS] EN / ENG Schema: ' + schemaEn.complexityTitle + ' / ' + schemaEng.complexityTitle);
  passed++;

  // 3. Messianic Prophecies Aliases & Fallbacks
  console.log('\n👑 3. MESSIANIC PROPHECIES ALIASES:');
  const prophecies = store.getMessianicProphecies();
  if (prophecies.length === 0) {
    throw new Error('No messianic prophecies loaded!');
  }
  for (const p of prophecies) {
    if (!p.prophecy?.osis || !p.fulfillment?.osis) {
      throw new Error('Prophecy osis mapping is missing or undefined!');
    }
  }
  console.log('  ✅ [PASS] Loaded ' + prophecies.length + ' Prophecy pairs with valid OSIS references');
  passed++;

  // 4. Thematic Chains
  console.log('\n🔗 4. THEMATIC COVENANTAL CHAINS:');
  const livingWaterChain = store.getThematicChain('living_water');
  if (livingWaterChain.length === 0) {
    throw new Error('Living water thematic chain is empty!');
  }
  for (const step of livingWaterChain) {
    if (!step.ref) throw new Error('Chain step reference is undefined!');
  }
  console.log('  ✅ [PASS] Loaded thematic chain "living_water" with ' + livingWaterChain.length + ' steps');
  passed++;

  // 5. Trench Synonyms (Agape vs Phileo)
  console.log('\n🏛️ 5. TRENCH SYNONYMS (ORIGINAL GREEK DISTINCTIONS):');
  const agape = store.getTrenchSynonym('G26');
  if (!agape || !agape.greekLemma) {
    throw new Error('Trench synonym G26 not found!');
  }
  console.log('  ✅ [PASS] Resolved G26 -> ' + agape.greekLemma + ' (' + agape.transliteration + '): ' + agape.group);
  passed++;

  // 6. Settings Metadata & Capabilities
  console.log('\n⚙️ 6. SETTINGS METADATA:');
  const warmthMeta = store.getSettingsMetadata('warmth');
  if (!warmthMeta) {
    throw new Error('Warmth settings metadata resolution returned undefined!');
  }
  console.log('  ✅ [PASS] Settings metadata "warmth": ' + JSON.stringify(warmthMeta));
  passed++;

  console.log('\n=================================================================');
  console.log('🏁 BLOCK 3 VERIFICATION COMPLETE: ' + passed + ' TESTS PASSED, 0 FAILED');
  console.log('=================================================================\n');
}

testBlock3().catch(err => {
  console.error('❌ Block 3 verification failed:', err);
  process.exit(1);
});
