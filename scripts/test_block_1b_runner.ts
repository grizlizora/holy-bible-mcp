/**
 * 🧪 Test Verification Suite for Block 1B: High-Performance Database & Connection Pool
 */

import { GenericSqlitePool } from '../src/database/connection/generic_sqlite_pool.js';
import { SqliteConnectionPool } from '../src/database/connection/sqlite_connection_pool.js';
import { BibleRepository } from '../src/database/bible_repository.js';
import { checkSqliteHeader } from '../src/database/integrity_checker.js';
import { MarkdownSemanticSplitter } from '../src/vector_context/markdown_semantic_splitter.js';
import { resolveDbPath } from '../src/database/database_downloader.js';

async function runBlock1BTests() {
  console.log('🚀 Running Block 1B Database & Connection Pool Verification...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // 1. GenericSqlitePool Verification
  console.log('--- 1. Testing GenericSqlitePool ---');
  const memPool = new GenericSqlitePool(':memory:', { min: 2, max: 4 });
  assert(memPool.getStats().total >= 2, 'Initial min connections established');

  const writer = memPool.getWriterDb();
  writer.exec('CREATE TABLE test_items (id INTEGER PRIMARY KEY, name TEXT);');
  writer.exec("INSERT INTO test_items (name) VALUES ('Genesis'), ('Exodus'), ('Leviticus');");

  const queryResult = await memPool.withReadConnection((_db, prepare) => {
    const stmt = prepare('SELECT count(*) as count FROM test_items');
    return stmt.get() as { count: number };
  });
  assert(queryResult.count === 3, 'GenericSqlitePool RAII read execution returned 3 items');

  const stats = memPool.getStats();
  assert(stats.inUse === 0, 'Connection automatically released back to pool after read');

  await memPool.drainAndClose();
  assert(memPool.getStats().total === 0, 'GenericSqlitePool drained and closed all connections');

  // 2. SqliteConnectionPool Verification
  console.log('\n--- 2. Testing SqliteConnectionPool ---');
  const connPool = new SqliteConnectionPool(':memory:');
  const rawDb = connPool.getRawDb();
  rawDb.exec('CREATE TABLE sample (id INT, val TEXT);');
  rawDb.exec("INSERT INTO sample VALUES (1, 'Faith'), (2, 'Hope'), (3, 'Love');");

  const sampleRows = connPool.query<{ id: number; val: string }>('SELECT * FROM sample ORDER BY id ASC');
  assert(sampleRows.length === 3 && sampleRows[2].val === 'Love', 'SqliteConnectionPool synchronous query execution');

  const singleRow = connPool.get<{ val: string }>('SELECT val FROM sample WHERE id = ?', [1]);
  assert(singleRow?.val === 'Faith', 'SqliteConnectionPool single-row get execution');

  await connPool.drainAndClose();

  // 3. BibleRepository Function Verification
  console.log('\n--- 3. Testing BibleRepository ---');
  assert(typeof BibleRepository.getVerse === 'function', 'BibleRepository.getVerse is available');
  assert(typeof BibleRepository.getVerseRange === 'function', 'BibleRepository.getVerseRange is available');
  assert(typeof BibleRepository.getChapter === 'function', 'BibleRepository.getChapter is available');
  assert(typeof BibleRepository.getStrongs === 'function', 'BibleRepository.getStrongs is available');
  assert(typeof BibleRepository.getCrossReferences === 'function', 'BibleRepository.getCrossReferences is available');

  // 4. MarkdownSemanticSplitter Verification
  console.log('\n--- 4. Testing MarkdownSemanticSplitter ---');
  const sampleDoc = `
# Title: Theological Overview
This is an introductory paragraph explaining biblical themes.

## Chapter 1: Covenant Theology
God establishes eternal covenants with humanity throughout scripture.
\`\`\`sql
SELECT * FROM covenants WHERE type = 'Abrahamic';
\`\`\`

## Chapter 2: Grace and Faith
Salvation is received through faith alone by grace divine.
`;

  const chunks = MarkdownSemanticSplitter.chunkDocument(sampleDoc, 'overview.md', {
    targetChunkSize: 100,
    overlapSize: 20
  });
  assert(chunks.length >= 2, `MarkdownSemanticSplitter generated ${chunks.length} hierarchical chunks`);
  assert(chunks[0].filename === 'overview.md', 'Chunk preserves filename metadata');
  assert(chunks[0].estimatedTokens > 0, 'Chunk estimates token count');

  // 5. Database Integrity Checker & Path Resolver
  console.log('\n--- 5. Testing Integrity Checker & Path Resolver ---');
  const resolvedPath = resolveDbPath();
  assert(typeof resolvedPath === 'string' && resolvedPath.length > 0, `Database path resolved: ${resolvedPath}`);
  
  const headerCheck = checkSqliteHeader('non_existent.db');
  assert(headerCheck.valid === false, 'Header check correctly flags missing file');

  console.log(`\n🎉 ALL ${passed}/${total} TESTS PASSED FOR BLOCK 1B!`);
}

runBlock1BTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
