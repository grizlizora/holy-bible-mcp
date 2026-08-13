import { NextResponse } from "next/server";
import { mcpManager } from "@/lib/mcp/mcp-manager";

export async function GET() {
  const configs = mcpManager.getCapabilities();
  return NextResponse.json(configs);
}
