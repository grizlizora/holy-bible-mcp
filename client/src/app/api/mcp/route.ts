import { NextRequest, NextResponse } from "next/server";
import { mcpManager } from "@/lib/mcp/mcp-manager";
import fs from "fs";
import path from "path";
import os from "os";

export async function GET(req: NextRequest) {
  try {
    await mcpManager.initAllEnabled();
    const rawConfigs = mcpManager.getConfigs();
    const configs = rawConfigs
      .filter(c => c.id !== 'holy-bible-remote' && !c.name?.includes('GitHub Remote'))
      .map(c => c.id === 'holy-bible-local' ? { ...c, name: 'Holy Bible MCP' } : c);
    const statuses = mcpManager.getAllStatuses();
    
    const userHome = os.homedir();
    const dbPath1 = path.join(userHome, ".bible-mcp", "bible_database.sqlite");
    const dbPath2 = path.resolve(process.cwd(), "../data/processed/bible_database.sqlite");
    const dbPath3 = path.resolve(process.cwd(), "./data/processed/bible_database.sqlite");

    const foundDbPath = [dbPath1, dbPath2, dbPath3].find(p => fs.existsSync(p) && fs.statSync(p).size > 1000000);
    const dbSizeBytes = foundDbPath ? fs.statSync(foundDbPath).size : 0;
    const dbDownloaded = dbSizeBytes >= 5800000000;
    const dbSizeFormatted = (dbSizeBytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";

    const localCodePath = path.resolve(process.cwd(), "../mcp-server/build/index.js");
    const codeInstalled = fs.existsSync(localCodePath);

    // Combine config with current status and storage badges
    const data = configs.map(c => ({
      ...c,
      status: statuses[c.id] || 'disconnected',
      codeInstalled: c.id === 'holy-bible-local' ? codeInstalled : true,
      dbDownloaded: c.id === 'holy-bible-local' ? dbDownloaded : true,
      dbSizeBytes,
      dbSizeFormatted
    }));
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const config = await req.json();
    await mcpManager.addServer(config);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...updated } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    
    await mcpManager.updateServer(id, updated);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    
    await mcpManager.removeServer(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
