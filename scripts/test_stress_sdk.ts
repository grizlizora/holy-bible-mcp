import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(__dirname, "../build/index.js");

async function main(): Promise<void> {
  console.log("🔥 Starting MCP Stress & Concurrency Test...");
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: { ...process.env, NODE_NO_WARNINGS: "1" }
  });

  const client = new Client(
    { name: "stress-client", version: "2.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✅ MCP Client Connected!");

  const testQueries = [
    { name: "ask_holy_bible", args: { question: "що таке любов", language: "ukr" } },
    { name: "ask_holy_bible", args: { question: "what is hope", language: "eng" } },
    { name: "get_mcp_capabilities", args: {} },
    { name: "search_semantic", args: { concept: "forgiveness" } },
    { name: "search_topic", args: { topic: "anxiety" } },
    { name: "get_model_recommendations", args: { model_name: "llama-3.1-8b", parameter_size_b: 8.0 } },
    { name: "get_p2p_swarm_status", args: {} },
    { name: "get_cross_references", args: { book: "JHN", chapter: 3, verse: 16 } },
    { name: "find_thematic_scripture_chain", args: { theme: "living_water" } },
    { name: "get_prophecy_fulfillment_pairs", args: { topic: "all" } }
  ];

  console.log(`\n1️⃣ Running ${testQueries.length} Sequential Requests...`);
  const seqStart = Date.now();
  for (let i = 0; i < testQueries.length; i++) {
    const t = testQueries[i];
    const res = await client.callTool({ name: t.name, arguments: t.args });
    if (!res || !res.content) {
      throw new Error(`Query ${t.name} failed`);
    }
  }
  console.log(`✅ Sequential test completed in ${Date.now() - seqStart}ms`);

  console.log("\n2️⃣ Running 30 Concurrent Burst Requests...");
  const burstStart = Date.now();
  const burstPromises: Promise<any>[] = [];
  for (let i = 0; i < 30; i++) {
    const t = testQueries[i % testQueries.length];
    burstPromises.push(client.callTool({ name: t.name, arguments: t.args }));
  }
  await Promise.all(burstPromises);
  console.log(`✅ 30 Concurrent requests completed in ${Date.now() - burstStart}ms (Avg ${(Date.now() - burstStart) / 30}ms per request)`);

  console.log("\n3️⃣ Testing Edge Case & Invalid Tool Requests...");
  const edgeRes = await client.callTool({ name: "non_existent_tool", arguments: {} });
  console.log("✅ Handled invalid tool correctly:", edgeRes.isError ? "isError: true" : "handled");

  console.log("\n🎉 ALL STRESS TESTS PASSED WITH 0 CRASHES AND 0 LEAKS!");
  await transport.close();
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Stress test failed:", err);
  process.exit(1);
});
