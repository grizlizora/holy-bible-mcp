import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.resolve(__dirname, "../mcp-server/build/index.js");

console.log("🚀 Starting local MCP Server test...");
const child = spawn("node", [SERVER_PATH], {
    stdio: ["pipe", "pipe", "inherit"]
});

let responseData = "";

child.stdout.on("data", (chunk) => {
    responseData += chunk.toString();
    try {
        const json = JSON.parse(responseData);
        console.log("\n✅ Received MCP Response from Server:");
        console.log(JSON.stringify(json, null, 2));
        child.kill();
        process.exit(0);
    } catch (e) {
        // Wait for full JSON payload
    }
});

// JSON-RPC Request to initialize and search
const searchRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
        name: "search_keyword",
        arguments: {
            query: "Бог",
            language: "ukr"
        }
    }
};

// Send request to server stdin
child.stdin.write(JSON.stringify(searchRequest) + "\n");
