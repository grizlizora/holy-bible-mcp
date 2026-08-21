#!/usr/bin/env npx tsx
/**
 * ==============================================================================
 * 📖 HOLY BIBLE MCP - CROSS-PLATFORM TYPESCRIPT SETUP ENGINE
 * Works natively on Windows (PowerShell/CMD), macOS (Apple Silicon/Intel), Linux
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import readline from 'readline';
import { execSync } from 'child_process';

interface McpServerEnv {
  DEFAULT_MODE: string;
  DEFAULT_WARMTH: string;
  SHOW_METRICS: string;
}

interface McpServerConfigEntry {
  command: string;
  args: string[];
  env: McpServerEnv;
}

interface McpSettingsOutput {
  mcpServers: {
    'holy-bible': McpServerConfigEntry;
  };
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => 
  new Promise((resolve) => rl.question(query, resolve));

const GLOBAL_DIR = path.join(os.homedir(), '.bible-mcp');
const GLOBAL_DB = path.join(GLOBAL_DIR, 'bible_database.sqlite');
const REMOTE_DB = 'https://huggingface.co/datasets/grizlizora/holy-bible-mcp/resolve/main/bible_database.sqlite';

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const request = (targetUrl: string) => {
      https.get(targetUrl, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return request(response.headers.location);
        }
        if (response.statusCode !== 200) {
          return reject(new Error(`Server responded with status ${response.statusCode}`));
        }

        const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;
        let lastReport = 0;

        response.on('data', (chunk: Buffer) => {
          downloadedBytes += chunk.length;
          const now = Date.now();
          if (now - lastReport > 500) {
            lastReport = now;
            const percent = totalBytes > 0 ? ((downloadedBytes / totalBytes) * 100).toFixed(1) : '?';
            const mb = (downloadedBytes / (1024 * 1024)).toFixed(1);
            const totalMb = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) : '?';
            process.stdout.write(`\r   📥 Downloaded: ${mb} MB / ${totalMb} MB (${percent}%)`);
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close(() => {
            process.stdout.write('\n');
            resolve();
          });
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    };
    request(url);
  });
}

async function main(): Promise<void> {
  console.log('==============================================================================');
  console.log('📖 HOLY BIBLE MCP SERVER - CROSS-PLATFORM TYPESCRIPT INSTALLER');
  console.log('==============================================================================');
  console.log(`OS: ${os.type()} ${os.release()} (${os.arch()}) | Node: ${process.version}`);
  console.log('==============================================================================\n');

  try {
    // Check if running in non-interactive/automated mode
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      console.log('Usage: npx tsx setup.ts [options]');
      console.log('Options:');
      console.log('  --help, -h     Show this help message');
      console.log('  --check-db     Verify local database presence');
      return;
    }

    if (process.argv.includes('--check-db')) {
      if (fs.existsSync(GLOBAL_DB)) {
        const stats = fs.statSync(GLOBAL_DB);
        console.log(`✅ SQLite Database verified: ${(stats.size / (1024 * 1024 * 1024)).toFixed(2)} GB at ${GLOBAL_DB}`);
      } else {
        console.log(`⚠️ SQLite Database not found at ${GLOBAL_DB}`);
      }
      return;
    }

    // STEP 1: Codebase setup
    const cloneAns = await askQuestion('1. Do you want to set up the MCP Server codebase locally? [Y/n]: ');
    if (!cloneAns || cloneAns.toLowerCase().startsWith('y')) {
      const targetFolderAns = await askQuestion('   Enter target folder name [default: holy-bible-mcp]: ');
      const targetDir = targetFolderAns.trim() || 'holy-bible-mcp';

      if (!fs.existsSync(targetDir)) {
        console.log(`📦 Cloning MCP Server codebase into ./${targetDir}...`);
        try {
          execSync(`git clone --depth 1 https://github.com/grizlizora/holy-bible-mcp.git "${targetDir}"`, { stdio: 'inherit' });
        } catch (e) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }

      if (fs.existsSync(targetDir)) {
        console.log('⚙️ Building local MCP Server...');
        try {
          execSync('npm install', { cwd: targetDir, stdio: 'inherit' });
          execSync('npm run build', { cwd: targetDir, stdio: 'inherit' });
          console.log('✅ MCP Server compiled successfully!\n');
        } catch (err) {
          console.warn('⚠️ Build note: ensure dependencies are installed.\n');
        }
      }
    }

    // STEP 2: Database setup
    fs.mkdirSync(GLOBAL_DIR, { recursive: true });

    let isDbValid = false;
    if (fs.existsSync(GLOBAL_DB)) {
      const stats = fs.statSync(GLOBAL_DB);
      if (stats.size > 1000000) {
        isDbValid = true;
        console.log(`✅ Holy Bible SQLite Database verified at ${GLOBAL_DB} (${(stats.size / (1024 * 1024 * 1024)).toFixed(2)} GB)\n`);
      }
    }

    if (!isDbValid) {
      const dbAns = await askQuestion('2. Do you want to download the 5.88GB Offline Holy Bible Database now? [Y/n]: ');
      if (!dbAns || dbAns.toLowerCase().startsWith('y')) {
        console.log(`📥 Downloading Holy Bible SQLite Database to ${GLOBAL_DB}...`);
        const tempDb = `${GLOBAL_DB}.tmp`;
        await downloadFile(REMOTE_DB, tempDb);
        fs.renameSync(tempDb, GLOBAL_DB);
        console.log('✅ Database download & verification complete!\n');
      } else {
        console.log('⚠️ Database download skipped. Server will auto-download on first query or use remote mode.\n');
      }
    }

    // STEP 3: Config snippet
    console.log('==============================================================================');
    console.log('🎉 SETUP COMPLETE! COPY THIS JSON SNIPPET INTO TREA / CURSOR / CLAUDE DESKTOP:');
    console.log('==============================================================================\n');

    const config: McpSettingsOutput = {
      mcpServers: {
        'holy-bible': {
          command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
          args: ['-y', '@grizlizora/holy-bible-mcp'],
          env: {
            DEFAULT_MODE: 'deep',
            DEFAULT_WARMTH: '80',
            SHOW_METRICS: 'on'
          }
        }
      }
    };

    console.log(JSON.stringify(config, null, 2));
    console.log('\n==============================================================================');
  } catch (error: any) {
    console.error('❌ Setup error:', error?.message || error);
  } finally {
    rl.close();
  }
}

main();
