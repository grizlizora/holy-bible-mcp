import path from 'path';
import Database from 'better-sqlite3';
import { MorphologyEngine } from '../src/morphology_engine';
import { TheologicalKnowledgeGraph } from '../src/graph/theological_graphology_engine';

async function runConcurrencyStressTest() {
  console.log('================================================================================');
  console.log('⚡ CONCURRENCY & HIGH-LOAD STRESS TEST (100 CONCURRENT ASYNC REQUESTS)');
  console.log('================================================================================');

  const startTotal = Date.now();
  const dbPath = path.resolve('./data/directives.sqlite');
  const db = new Database(dbPath, { readonly: true });
  db.pragma('journal_mode = WAL');
  db.pragma('cache_size = -64000');

  const testKeywords = ['агапе', 'шалом', 'логос', 'віра', 'надія', 'любов', 'благодать', 'правда', 'світло', 'мир'];
  const testStrongIds = ['G0026', 'H7965', 'G3056', 'G4102', 'G1680', 'G0025', 'G5485', 'G0225', 'G5457', 'H1697'];

  const tasks: Promise<any>[] = [];

  for (let i = 0; i < 100; i++) {
    const kw = testKeywords[i % testKeywords.length];
    const strongId = testStrongIds[i % testStrongIds.length];

    tasks.push((async (index: number) => {
      const t0 = Date.now();

      // 1. Directives DB query
      const row = db.prepare('SELECT concept_name, concept_key, theological_principle FROM theological_semantic_concepts LIMIT 5').all();

      // 2. Morphology parsing & caching
      const morph = MorphologyEngine.parseMorphology(index % 2 === 0 ? 'V-PAI-3S' : 'HR/Ncfsa', index % 2 === 0 ? 'grc' : 'heb');

      // 3. Strong etymology query
      const etym = await MorphologyEngine.getStrongsEtymology(strongId);

      // 4. Theological Knowledge Graph traversal
      const kg = TheologicalKnowledgeGraph.getInstance();
      const nodeCount = kg.getNodeCount();

      const durationMs = Date.now() - t0;
      return { index, durationMs, success: Boolean(row && morph && etym && nodeCount > 0) };
    })(i));
  }

  const results = await Promise.all(tasks);
  const totalDurationMs = Date.now() - startTotal;
  db.close();

  const allPassed = results.every(r => r.success);
  const avgLatency = results.reduce((acc, r) => acc + r.durationMs, 0) / results.length;
  const maxLatency = Math.max(...results.map(r => r.durationMs));

  console.log(`\n📊 STRESS TEST RESULTS:`);
  console.log(`  - Total Concurrent Requests: 100`);
  console.log(`  - Successful Requests: ${results.filter(r => r.success).length}/100`);
  console.log(`  - Total Batch Execution Time: ${totalDurationMs}ms`);
  console.log(`  - Average Latency per Request: ${avgLatency.toFixed(2)}ms`);
  console.log(`  - Maximum Latency: ${maxLatency}ms`);
  console.log(`  - Concurrency Throughput: ${(100 / (totalDurationMs / 1000)).toFixed(1)} req/sec\n`);

  if (allPassed) {
    console.log('✅ [PASS] All 100 concurrent queries completed successfully with 0 deadlocks or errors.');
  } else {
    console.error('❌ [FAIL] Some concurrent requests failed.');
    process.exit(1);
  }
}

runConcurrencyStressTest().catch(err => {
  console.error('Stress test fatal error:', err);
  process.exit(1);
});
