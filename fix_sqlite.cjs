const fs = require('fs');

const path = 'client/src/app/api/verse/route.ts';
let code = fs.readFileSync(path, 'utf8');

const target = `    try {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      const sqlite3 = await import('sqlite3');

      const possibleDbPaths = [
        ...(process.env.BIBLE_DB_PATH ? [path.resolve(process.env.BIBLE_DB_PATH)] : []),
        path.resolve(process.cwd(), '../data/processed/bible_database.sqlite'),
        path.resolve(process.cwd(), 'data/processed/bible_database.sqlite'),
        path.resolve(process.cwd(), '../../data/processed/bible_database.sqlite'),
        path.join(os.homedir(), '.bible-mcp', 'bible_database.sqlite')
      ];

      const dbPath = possibleDbPaths.find(p => fs.existsSync(p) && fs.statSync(p).size > 1000000);

      if (dbPath) {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
        const queryDb = (sql: string, params: any[]) => new Promise<any[]>((resolve) => {
          db.all(sql, params, (err, rows) => {
            if (err || !rows) resolve([]);
            else resolve(rows);
          });
        });

        const directTexts: string[] = [];
        for (const v of verseNumbers) {
          let rows = await queryDb(
            \`SELECT text FROM verses WHERE UPPER(book) = ? AND chapter = ? AND verse = ? AND language = ? LIMIT 1\`,
            [engBook, chapter, v, lang]
          );
          if (!rows || rows.length === 0) {
            rows = await queryDb(
              \`SELECT text FROM verses WHERE UPPER(book) = ? AND chapter = ? AND verse = ? LIMIT 1\`,
              [engBook, chapter, v]
            );
          }
          if (rows && rows[0] && rows[0].text) {
            directTexts.push(rows[0].text.trim());
          }
        }
        db.close();

        if (directTexts.length > 0) {
          console.log(\`📖 [DIRECT SQLITE VERSE] Ref: "\${ref}" (\${engBook} \${chapter}:\${verseExpr}) -> extracted \${directTexts.length} verses in 1ms\`);
          return NextResponse.json({ text: directTexts.join(' ') });
        }
      }
    } catch (e) {
      console.warn('[VERSE API] Direct SQLite lookup error, falling back to MCP:', e);
    }`;

const replacement = `    try {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const possibleDbPaths = [
        ...(process.env.BIBLE_DB_PATH ? [path.resolve(process.env.BIBLE_DB_PATH)] : []),
        path.resolve(process.cwd(), '../data/processed/bible_database.sqlite'),
        path.resolve(process.cwd(), 'data/processed/bible_database.sqlite'),
        path.resolve(process.cwd(), '../../data/processed/bible_database.sqlite'),
        path.join(os.homedir(), '.bible-mcp', 'bible_database.sqlite')
      ];

      const dbPath = possibleDbPaths.find(p => fs.existsSync(p) && fs.statSync(p).size > 1000000);

      if (dbPath) {
        const Database = (await import('better-sqlite3')).default || await import('better-sqlite3');
        const db = new (Database as any)(dbPath, { readonly: true });

        const directTexts: string[] = [];
        for (const v of verseNumbers) {
          let row = db.prepare(\`SELECT text FROM verses WHERE UPPER(book) = ? AND chapter = ? AND verse = ? AND language = ? LIMIT 1\`).get(engBook, chapter, v, lang) as {text: string} | undefined;
          if (!row) {
            row = db.prepare(\`SELECT text FROM verses WHERE UPPER(book) = ? AND chapter = ? AND verse = ? LIMIT 1\`).get(engBook, chapter, v) as {text: string} | undefined;
          }
          if (row && row.text) {
            directTexts.push(row.text.trim());
          }
        }
        db.close();

        if (directTexts.length > 0) {
          console.log(\`📖 [DIRECT SQLITE VERSE] Ref: "\${ref}" (\${engBook} \${chapter}:\${verseExpr}) -> extracted \${directTexts.length} verses in 1ms\`);
          return NextResponse.json({ text: directTexts.join(' ') });
        }
      }
    } catch (e) {
      console.warn('[VERSE API] Direct SQLite lookup error, falling back to MCP:', e);
    }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(path, code);
  console.log("Successfully replaced sqlite block.");
} else {
  console.log("Target not found!");
}
