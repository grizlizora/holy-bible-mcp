import fs from 'fs';
import path from 'path';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_FILE = path.join(LOG_DIR, 'bot.log');

export class Logger {
    private static formatMessage(level: string, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        let metaStr = "";
        if (meta) {
            try {
                metaStr = typeof meta === 'object' ? ` | ${JSON.stringify(meta)}` : ` | ${meta}`;
            } catch (e) {
                metaStr = ` | [Circular Meta]`;
            }
        }
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }

    private static writeToFile(formattedMsg: string) {
        try {
            fs.appendFileSync(LOG_FILE, formattedMsg + '\n', 'utf-8');
        } catch (e) {}
    }

    public static info(message: string, meta?: any) {
        const formatted = this.formatMessage('INFO', message, meta);
        console.log(`\x1b[36m${formatted}\x1b[0m`);
        this.writeToFile(formatted);
    }

    public static warn(message: string, meta?: any) {
        const formatted = this.formatMessage('WARN', message, meta);
        console.warn(`\x1b[33m${formatted}\x1b[0m`);
        this.writeToFile(formatted);
    }

    public static error(message: string, error?: any) {
        const errDetails = error?.stack || error?.message || error;
        const formatted = this.formatMessage('ERROR', message, errDetails);
        console.error(`\x1b[31m${formatted}\x1b[0m`);
        this.writeToFile(formatted);
    }

    public static mcp(toolName: string, args: any, durationMs?: number) {
        const durStr = durationMs !== undefined ? ` (${durationMs}ms)` : '';
        const formatted = this.formatMessage('MCP', `Tool Called: ${toolName}${durStr}`, args);
        console.log(`\x1b[35m${formatted}\x1b[0m`);
        this.writeToFile(formatted);
    }
}
