import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export class BibleMcpClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private toolsCache: any[] = [];

  constructor() {
    this.client = new Client(
      {
        name: "telegram-bot-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );
  }

  async connect() {
    console.log("Connecting to Bible MCP Server...");
    
    // We use npx to run the MCP server directly from the repository
    this.transport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "github:grizlizora/holy-bible-mcp#main"],
    });

    await this.client.connect(this.transport);
    console.log("Connected successfully to MCP Server!");
    
    await this.refreshTools();
  }

  private async refreshTools() {
    const response = await this.client.listTools();
    this.toolsCache = response.tools;
    console.log(`Loaded ${this.toolsCache.length} tools from MCP Server.`);
  }

  getTools() {
    return this.toolsCache;
  }

  async callTool(name: string, args: any) {
    console.log(`Calling MCP tool: ${name} with args:`, args);
    const result = await this.client.callTool({
      name,
      arguments: args,
    });
    return result;
  }

  async getPrompt(name: string) {
    return await this.client.getPrompt({ name });
  }
}
