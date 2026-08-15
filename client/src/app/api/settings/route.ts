import { NextResponse } from 'next/server';
import { sqlite } from '@/db';
import { encryptSecret, decryptSecret } from '@/lib/crypto/encryption';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const row = sqlite.prepare('SELECT value FROM app_settings WHERE key = ?').get('settings') as { value: string } | undefined;
    if (!row || !row.value) {
      return NextResponse.json({ settings: null });
    }

    const parsed = JSON.parse(row.value);
    const stateObj = parsed?.state || parsed;

    // 🔓 Decrypt all cloud provider API keys for application use
    if (Array.isArray(stateObj?.cloudProviders)) {
      stateObj.cloudProviders = stateObj.cloudProviders.map((cp: any) => {
        if (cp.apiKey && typeof cp.apiKey === 'string') {
          return { ...cp, apiKey: decryptSecret(cp.apiKey) };
        }
        return cp;
      });
    }

    if (parsed?.state) {
      parsed.state = stateObj;
      return NextResponse.json({ settings: parsed });
    }

    return NextResponse.json({ settings: stateObj });
  } catch (error: any) {
    console.error('[SETTINGS API] Failed to get app settings from SQLite:', error);
    return NextResponse.json({ settings: null, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const settingsJson = typeof body.settings === 'string' ? body.settings : JSON.stringify(body.settings || body);
    const updatedAt = Date.now();
    let dataToSave = settingsJson;

    try {
      const parsed = JSON.parse(settingsJson);
      const stateObj = parsed?.state || parsed;

      // 🔒 Encrypt all cloud provider API keys before persisting to SQLite disk
      if (Array.isArray(stateObj?.cloudProviders)) {
        stateObj.cloudProviders = stateObj.cloudProviders.map((cp: any) => {
          if (cp.apiKey && typeof cp.apiKey === 'string') {
            return { ...cp, apiKey: encryptSecret(cp.apiKey.trim()) };
          }
          return cp;
        });
      }

      if (parsed?.state) {
        parsed.state = stateObj;
        dataToSave = JSON.stringify(parsed);
      } else {
        dataToSave = JSON.stringify(stateObj);
      }
    } catch {}

    const existing = sqlite.prepare('SELECT key FROM app_settings WHERE key = ?').get('settings');

    if (existing) {
      sqlite.prepare('UPDATE app_settings SET value = ?, updated_at = ? WHERE key = ?')
        .run(dataToSave, updatedAt, 'settings');
    } else {
      sqlite.prepare('INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)')
        .run('settings', dataToSave, updatedAt);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[SETTINGS API] Failed to save app settings to SQLite:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
