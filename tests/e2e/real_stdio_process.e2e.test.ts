import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

describe("E2E: Real Stdio Subprocess IPC Test (Wire Boundary)", () => {
  it("should spawn build/index.js as a child process and execute JSON-RPC over stdio", async () => {
    const indexPath = path.resolve(__dirname, "../../build/index.js");

    const transport = new StdioClientTransport({
      command: "node",
      args: [indexPath]
    });

    const client = new Client(
      { name: "real-process-tester", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(transport);

    // List tools over standard OS pipes
    const tools = await client.listTools();
    expect(tools.tools.length).toBeGreaterThanOrEqual(25);

    // Call ask_holy_bible tool over standard OS pipes
    const askResult = await client.callTool({
      name: "ask_holy_bible",
      arguments: {
        query: "What is love?",
        language: "eng"
      }
    });

    expect(askResult.isError).toBeFalsy();
    const contentText = (askResult.content as any)[0]?.text;
    expect(contentText).toBeDefined();

    // Call get_p2p_swarm_status over standard OS pipes
    const swarmResult = await client.callTool({
      name: "get_p2p_swarm_status",
      arguments: {}
    });
    expect(swarmResult.isError).toBeFalsy();

    // Clean close process
    await client.close();
  });
});
