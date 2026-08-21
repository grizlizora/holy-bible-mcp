/**
 * 🌐 Cross-Platform Path Resolver
 *
 * Safely resolves application data, SQLite databases, and config paths
 * across macOS (Apple Silicon ARM / Intel), Windows (x64 / ARM64 UNC paths),
 * Linux (XDG Base Directory), and containerized runtimes.
 */
import os from 'os';
import path from 'path';
import fs from 'fs';
export class CrossPlatformPath {
    static APP_DIR_NAME = 'holy-bible-mcp';
    /**
     * Returns the canonical OS-specific data directory
     */
    static getAppDataDir() {
        const platform = process.platform;
        let baseDir;
        if (platform === 'win32') {
            baseDir = process.env.APPDATA || process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
        }
        else if (platform === 'darwin') {
            baseDir = path.join(os.homedir(), 'Library', 'Application Support');
        }
        else {
            // Linux & Unix standard (XDG)
            baseDir = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
        }
        const appPath = path.join(baseDir, this.APP_DIR_NAME);
        if (!fs.existsSync(appPath)) {
            try {
                fs.mkdirSync(appPath, { recursive: true });
            }
            catch {
                // Fallback to local cwd
                return path.resolve(process.cwd(), 'data');
            }
        }
        return appPath;
    }
    /**
     * Resolves the primary directives database path (with project root fallback)
     */
    static getDirectivesDbPath() {
        const candidatePaths = [
            path.resolve(process.cwd(), 'data/directives.sqlite'),
            path.resolve(process.cwd(), '../data/directives.sqlite'),
            path.join(this.getAppDataDir(), 'directives.sqlite'),
            path.resolve('/data/directives.sqlite')
        ];
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) {
                return this.normalizeWindowsUnc(p);
            }
        }
        return this.normalizeWindowsUnc(path.resolve(process.cwd(), 'data/directives.sqlite'));
    }
    /**
     * Resolves canonical OSIS dictionary file path
     */
    static getOsisDictionaryPath() {
        const candidatePaths = [
            path.resolve(process.cwd(), 'src/data/osis_dictionary.json'),
            path.resolve(process.cwd(), 'build/data/osis_dictionary.json'),
            path.resolve(process.cwd(), '../src/data/osis_dictionary.json'),
            path.join(this.getAppDataDir(), 'osis_dictionary.json')
        ];
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) {
                return this.normalizeWindowsUnc(p);
            }
        }
        return this.normalizeWindowsUnc(path.resolve(process.cwd(), 'src/data/osis_dictionary.json'));
    }
    /**
     * Normalizes path slashes to standard POSIX forward slashes
     */
    static toPosixPath(filePath) {
        return filePath.replace(/\\/g, '/');
    }
    /**
     * Normalizes Windows paths with UNC extended-length prefix if long (> 260 chars)
     */
    static normalizeWindowsUnc(filePath) {
        if (process.platform === 'win32' && filePath.length > 240 && !filePath.startsWith('\\\\?\\')) {
            const resolved = path.resolve(filePath);
            return `\\\\?\\${resolved}`;
        }
        return filePath;
    }
}
