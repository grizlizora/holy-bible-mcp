import { mcpManager } from "./mcp-manager";

export class BibleMcpClient {
  constructor() {
    // Optionally trigger initialization of enabled servers if not already done.
    // In a real Next.js app, we should ideally call this once on server startup,
    // but calling it here asynchronously is safe for Serverless.
    mcpManager.initAllEnabled().catch(console.error);
  }

  async connect() {
    // The manager handles connections automatically based on registry.
    // We just ensure enabled servers are initialized.
    await mcpManager.initAllEnabled();
  }

  getTools() {
    return mcpManager.getAllTools();
  }

  async callTool(name: string, args: any) {
    return await mcpManager.callTool(name, args);
  }

  async getPrompt(name: string) {
    // If you need prompt support, you'd need to add it to McpManager similarly.
    // Assuming prompts aren't heavily used right now or can be handled identically:
    throw new Error("getPrompt is not yet implemented in multi-MCP proxy");
  }
}
