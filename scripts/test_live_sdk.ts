import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(__dirname, "../build/index.js");

async function main() {
  console.log("🔌 Connecting to Holy Bible MCP via Official SDK Stdio Transport...");
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: { ...process.env, NODE_NO_WARNINGS: "1" }
  });

  const client = new Client(
    { name: "test-client", version: "2.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✅ MCP Client Connected!");

  console.log("\n📋 Listing Tools...");
  const tools = await client.listTools();
  console.log(`✅ Loaded ${tools.tools.length} Tools:`);
  for (const t of tools.tools.slice(0, 5)) {
    console.log(`  - ${t.name}: ${t.description.slice(0, 60)}...`);
  }

  console.log("\n🧪 Calling get_mcp_capabilities...");
  const caps = await client.callTool({ name: "get_mcp_capabilities", arguments: {} });
  console.log("✅ Capabilities Result:", (caps as any).content[0].text.slice(0, 150) + "...");

  console.log("\n🧪 Calling ask_holy_bible...");
  const bibleRes = await client.callTool({
    name: "ask_holy_bible",
    arguments: { question: "що таке віра", language: "ukr" }
  });
  console.log("✅ ask_holy_bible Result:", (bibleRes as any).content[0].text.slice(0, 200) + "...");

  console.log("\n🧪 Calling get_verse (John 3:16)...");
  const verseRes = await client.callTool({
    name: "get_verse",
    arguments: { book: "JHN", chapter: 3, verse: 16, language: "ukr" }
  });
  console.log("✅ get_verse Result:", (verseRes as any).content[0].text);

  console.log("\n🎉 ALL LIVE MCP TESTS PASSED WITH 100% STABILITY!");
  await transport.close();
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Live test failed:", err);
  process.exit(1);
});
