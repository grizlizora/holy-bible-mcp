/**
 * ⚡ StatementCompiler — Pre-compiles and caches SQLite prepared statements with LRU eviction
 */
export class StatementCompiler {
    stmtCache = new Map();
    maxCacheSize = 200;
    getOrCompile(db, sql, prefix = 'main') {
        const key = `${prefix}:${sql}`;
        let stmt = this.stmtCache.get(key);
        if (stmt) {
            this.stmtCache.delete(key);
            this.stmtCache.set(key, stmt);
            return stmt;
        }
        if (this.stmtCache.size >= this.maxCacheSize) {
            const oldestKey = this.stmtCache.keys().next().value;
            if (oldestKey)
                this.stmtCache.delete(oldestKey);
        }
        stmt = db.prepare(sql);
        this.stmtCache.set(key, stmt);
        return stmt;
    }
    clear() {
        this.stmtCache.clear();
    }
}
