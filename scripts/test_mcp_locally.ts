import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.resolve(__dirname, "../build/index.js");

console.log("🚀 Starting local MCP Server test...");
const child = spawn("node", [SERVER_PATH], {
  stdio: ["pipe", "pipe", "inherit"]
});

let buffer = "";

child.stdout.on("data", (chunk: Buffer | string) => {
  buffer += chunk.toString();
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const json = JSON.parse(line);
      console.log("\n✅ Received MCP Response from Server:");
      console.log(JSON.stringify(json, null, 2));

      if (json.id === 1) {
        // Send initialized notification and tool call
        child.stdin.write(JSON.stringify({
          jsonrpc: "2.0",
          method: "notifications/initialized"
        }) + "\n");

        child.stdin.write(JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "get_mcp_capabilities",
            arguments: {}
          }
        }) + "\n");
      } else if (json.id === 2) {
        console.log("\n🎉 All local MCP tests succeeded!");
        child.kill();
        process.exit(0);
      }
    } catch {
      // Wait for full JSON line
    }
  }
});

// 1. Send standard MCP initialize handshake
const initRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" }
  }
};

child.stdin.write(JSON.stringify(initRequest) + "\n");
