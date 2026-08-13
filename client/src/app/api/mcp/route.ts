import { NextRequest, NextResponse } from "next/server";
import { mcpManager } from "@/lib/mcp/mcp-manager";

export async function GET(req: NextRequest) {
  try {
    const configs = mcpManager.getConfigs();
    const statuses = mcpManager.getAllStatuses();
    
    // Combine config with current status
    const data = configs.map(c => ({
      ...c,
      status: statuses[c.id] || 'disconnected'
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
