import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const FASTER_WHISPER_MODEL_PATH =
  `${os.homedir()}/.cache/huggingface/hub/models--Systran--faster-whisper-small/snapshots/536b0662742c02347bc0e980a01041f333bce120`;

const DAEMON_SCRIPT = path.join(process.cwd(), 'src', 'lib', 'parsers', 'whisper_daemon.py');
const PYTHON_BIN = '/opt/homebrew/bin/python3';

// Global state for the persistent daemon process
let daemonProcess: ChildProcess | null = null;
let daemonReady = false;
let daemonBuffer = '';

// Pending request callbacks: reqId → { resolve, reject, timer }
const pendingRequests = new Map<string, {
  resolve: (text: string | null) => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
}>();

function startDaemon(): void {
  if (daemonProcess && !daemonProcess.killed) return;

  console.log('[WHISPER DAEMON] Starting persistent daemon...');
  daemonReady = false;
  daemonBuffer = '';

  daemonProcess = spawn(PYTHON_BIN, [DAEMON_SCRIPT], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  daemonProcess.stdout?.setEncoding('utf8');
  daemonProcess.stderr?.setEncoding('utf8');

  daemonProcess.stdout?.on('data', (chunk: string) => {
    daemonBuffer += chunk;
    const lines = daemonBuffer.split('\n');
    daemonBuffer = lines.pop() ?? ''; // Keep incomplete last line

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);

        // Daemon ready signal
        if (msg.status === 'ready') {
          console.log('[WHISPER DAEMON] Ready. Model will load on first request.');
          daemonReady = true;
          return;
        }

        // Response to a transcription request or ping
        if (msg.id && pendingRequests.has(msg.id)) {
          const pending = pendingRequests.get(msg.id)!;
          clearTimeout(pending.timer);
          pendingRequests.delete(msg.id);

          if (msg.error) {
            console.warn(`[WHISPER DAEMON] Error for ${msg.id}:`, msg.error);
            pending.resolve(null);
          } else if (msg.status === 'pong') {
            console.log('[WHISPER DAEMON] 🏓 Pong! Model is fully loaded and ready in RAM.');
            pending.resolve('pong');
          } else {
            console.log(`[WHISPER DAEMON] ✅ "${msg.text}" (${msg.elapsed_ms}ms, lang=${msg.language})`);
            pending.resolve(msg.text || null);
          }
        }
      } catch (e) {
        console.warn('[WHISPER DAEMON] Failed to parse stdout line:', line);
      }
    }
  });

  daemonProcess.stderr?.on('data', (data: string) => {
    // Log daemon internal messages (model loading, transcription info)
    const lines = data.split('\n').filter(l => l.trim());
    lines.forEach(l => console.log('[WHISPER DAEMON]', l));
  });

  daemonProcess.on('exit', (code, signal) => {
    console.warn(`[WHISPER DAEMON] Process exited (code=${code}, signal=${signal}). Will restart on next request.`);
    daemonProcess = null;
    daemonReady = false;
    // Fail all pending requests
    for (const [id, pending] of pendingRequests.entries()) {
      clearTimeout(pending.timer);
      pending.resolve(null);
    }
    pendingRequests.clear();
  });

  daemonProcess.on('error', (err) => {
    console.error('[WHISPER DAEMON] Spawn error:', err);
    daemonProcess = null;
    daemonReady = false;
  });
}

/**
 * Transcribes a WAV file using the persistent faster-whisper daemon.
 * Keeps the model warm in memory — no cold start after first use.
 * @param wavPath - path to 16kHz mono WAV file
 * @param isShort - true for voice messages (uses beam_size=1 greedy, 6x faster)
 * @param timeoutMs - max wait time in milliseconds
 */
export async function transcribeWithDaemon(
  wavPath: string,
  isShort: boolean = true,
  timeoutMs: number = 60000
): Promise<string | null> {
  // Ensure daemon is running
  if (!daemonProcess || daemonProcess.killed) {
    startDaemon();
  }

  // Wait for daemon to be ready (max 10s)
  if (!daemonReady) {
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (daemonReady) { clearInterval(check); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); resolve(); }, 10000);
    });
  }

  if (!daemonProcess || !daemonProcess.stdin) {
    console.warn('[WHISPER DAEMON] Daemon not available, skipping transcription.');
    return null;
  }

  return new Promise((resolve, reject) => {
    const reqId = uuidv4();
    const command = JSON.stringify({
      id: reqId,
      wav_path: wavPath,
      model_path: FASTER_WHISPER_MODEL_PATH,
      short: isShort,
    }) + '\n';

    const timer = setTimeout(() => {
      pendingRequests.delete(reqId);
      console.warn(`[WHISPER DAEMON] Request ${reqId} timed out after ${timeoutMs}ms`);
      resolve(null);
    }, timeoutMs);

    pendingRequests.set(reqId, { resolve, reject, timer });

    try {
      daemonProcess!.stdin!.write(command);
    } catch (e) {
      clearTimeout(timer);
      pendingRequests.delete(reqId);
      console.warn('[WHISPER DAEMON] Failed to write to stdin:', e);
      resolve(null);
    }
  });
}

/**
 * Pre-warms the model by sending a ping command
 */
export async function pingDaemon(): Promise<boolean> {
  if (!daemonProcess || daemonProcess.killed) startDaemon();
  
  if (!daemonReady) {
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (daemonReady) { clearInterval(check); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); resolve(); }, 10000);
    });
  }

  if (!daemonProcess || !daemonProcess.stdin) return false;

  return new Promise((resolve) => {
    const reqId = uuidv4();
    const command = JSON.stringify({ id: reqId, ping: true, model_path: FASTER_WHISPER_MODEL_PATH }) + '\n';

    const timer = setTimeout(() => {
      pendingRequests.delete(reqId);
      resolve(false);
    }, 15000);

    pendingRequests.set(reqId, { resolve: () => resolve(true), reject: () => resolve(false), timer });
    daemonProcess!.stdin!.write(command);
  });
}

// Pre-warm daemon on server startup
if (typeof window === 'undefined') {
  startDaemon();
  setTimeout(() => pingDaemon().catch(() => {}), 1000);
}
