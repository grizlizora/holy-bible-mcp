/**
 * 🏊 SqliteConnectionPool (sqlite_connection_pool.ts)
 *
 * Connection pooling & statement dispatching for SQLite.
 * Features multi-connection read pool support with GenericSqlitePool, statement compiling,
 * and hot-mount capabilities for runtime database swap.
 */
import { SqliteConnectionFactory } from './sqlite_connection_factory.js';
import { StatementCompiler } from './statement_compiler.js';
import { AuxDatabaseManager } from '../auxiliary/aux_database_manager.js';
import { WalCheckpointManager } from './wal_checkpoint_manager.js';
import { GenericSqlitePool } from './generic_sqlite_pool.js';
export class SqliteConnectionPool {
    mainDb;
    hasVersesTable = false;
    compiler = new StatementCompiler();
    walManager = new WalCheckpointManager();
    activeQueries = 0;
    currentDbPath;
    readPool;
    constructor(initialPath) {
        this.currentDbPath = initialPath;
        const { instance, hasVerses } = SqliteConnectionFactory.createInstance(initialPath);
        this.mainDb = instance;
        this.hasVersesTable = hasVerses;
        this.readPool = new GenericSqlitePool(initialPath, { min: 2, max: 8 });
    }
    getRawDb() {
        return this.mainDb;
    }
    getReadPool() {
        return this.readPool;
    }
    hasVerses() {
        return this.hasVersesTable;
    }
    prepare(sql, isAux = false) {
        const targetDb = isAux ? AuxDatabaseManager.getAuxDb() : this.mainDb;
        return this.compiler.getOrCompile(targetDb, sql, isAux ? 'aux' : 'main');
    }
    /**
     * Synchronous query with statement caching
     */
    query(sql, params = []) {
        const isAux = sql.includes('commentaries') || sql.includes('semantic_concepts');
        if (!isAux && !this.hasVerses() && (sql.includes('FROM verses') || sql.includes('verses_fts'))) {
            this.checkAndHotMount();
            if (!this.hasVerses())
                return [];
        }
        this.activeQueries++;
        try {
            const stmt = this.prepare(sql, isAux);
            return stmt.all(...params);
        }
        catch (err) {
            if (err.message?.includes('no such table'))
                return [];
            console.error('[DATABASE ENGINE] Query error:', err.message);
            return [];
        }
        finally {
            this.activeQueries = Math.max(0, this.activeQueries - 1);
        }
    }
    /**
     * Synchronous single-row fetch with statement caching
     */
    get(sql, params = []) {
        const isAux = sql.includes('commentaries') || sql.includes('semantic_concepts');
        if (!isAux && !this.hasVerses() && (sql.includes('FROM verses') || sql.includes('verses_fts'))) {
            this.checkAndHotMount();
            if (!this.hasVerses())
                return undefined;
        }
        this.activeQueries++;
        try {
            const stmt = this.prepare(sql, isAux);
            return stmt.get(...params);
        }
        catch (err) {
            if (err.message?.includes('no such table'))
                return undefined;
            console.error('[DATABASE ENGINE] Get error:', err.message);
            return undefined;
        }
        finally {
            this.activeQueries = Math.max(0, this.activeQueries - 1);
        }
    }
    /**
     * Asynchronous pool query using multi-connection reader
     */
    async queryPool(sql, params = []) {
        return this.readPool.withReadConnection((_db, prepare) => {
            const stmt = prepare(sql);
            return stmt.all(...params);
        });
    }
    /**
     * Asynchronous pool get using multi-connection reader
     */
    async getPool(sql, params = []) {
        return this.readPool.withReadConnection((_db, prepare) => {
            const stmt = prepare(sql);
            return stmt.get(...params);
        });
    }
    checkAndHotMount() {
        if (this.hasVersesTable)
            return true;
        if (this.walManager.shouldAttemptHotMount()) {
            try {
                const { valid, dbPath } = this.walManager.checkRealDbPath();
                if (valid) {
                    const oldDb = this.mainDb;
                    const { instance, hasVerses } = SqliteConnectionFactory.createInstance(dbPath);
                    this.mainDb = instance;
                    this.hasVersesTable = hasVerses;
                    this.currentDbPath = dbPath;
                    this.compiler.clear();
                    this.readPool.updatePath(dbPath);
                    if (oldDb && typeof oldDb.close === 'function') {
                        setTimeout(() => {
                            try {
                                oldDb.close();
                            }
                            catch (_) { }
                        }, 1000).unref?.();
                    }
                    return true;
                }
            }
            catch (err) {
                console.error('[DATABASE ENGINE] Hot-mount error:', err.message);
            }
        }
        return false;
    }
    async drainAndClose(timeoutMs = 3000) {
        const start = Date.now();
        while (this.activeQueries > 0 && Date.now() - start < timeoutMs) {
            await new Promise(r => setTimeout(r, 20));
        }
        try {
            this.compiler.clear();
            await this.readPool.drainAndClose();
            this.mainDb.close();
        }
        catch (_) { }
    }
}
