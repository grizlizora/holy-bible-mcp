import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";
import { DirectiveStore } from "../build/directives/directive_store.js";
import { extractModelParamSizeB, getModelTier } from "../build/capabilities.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(__dirname, "../build/index.js");

async function main(): Promise<void> {
  console.log("=================================================================");
  console.log("🧪 END-TO-END VERIFICATION: MODEL METADATA, TIER CALIBRATION & COT");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, detail?: string): void {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      if (detail) console.error(`     Detail: ${detail}`);
      failed++;
    }
  }

  // 1. DIRECTIVE STORE & CAPABILITIES IN-MEMORY TESTS
  console.log("📦 1. Testing DirectiveStore & Parameter Size Resolution:");
  await DirectiveStore.getInstance().loadDirectives();

  const size4b = extractModelParamSizeB("qwen3.5:4b");
  assert(size4b === 4.0, `extractModelParamSizeB('qwen3.5:4b') returns 4.0 (got ${size4b})`);

  const tier4_7 = getModelTier(4.7);
  assert(tier4_7 === "tier1", `getModelTier(4.7) returns 'tier1' (got ${tier4_7})`);

  const tier14 = getModelTier(14.0);
  assert(tier14 === "tier2", `getModelTier(14.0) returns 'tier2' (got ${tier14})`);

  const tier70 = getModelTier(70.0);
  assert(tier70 === "tier3", `getModelTier(70.0) returns 'tier3' (got ${tier70})`);

  const storeTier4_7 = DirectiveStore.getInstance().resolveTierByParamSize(4.7);
  assert(storeTier4_7.tierId === "tier1", `DirectiveStore.resolveTierByParamSize(4.7) tierId is 'tier1' (got ${storeTier4_7.tierId})`);
  assert(storeTier4_7.supportsCot === false, `DirectiveStore tier1 supportsCot is false (got ${storeTier4_7.supportsCot})`);
  assert(storeTier4_7.nameDisplay === "Tier 1 (Small <=8.5B)", `DirectiveStore tier1 nameDisplay is 'Tier 1 (Small <=8.5B)' (got ${storeTier4_7.nameDisplay})`);

  const storeTier14 = DirectiveStore.getInstance().resolveTierByParamSize(14.0);
  assert(storeTier14.tierId === "tier2", `DirectiveStore.resolveTierByParamSize(14.0) tierId is 'tier2' (got ${storeTier14.tierId})`);
  assert(storeTier14.supportsCot === true, `DirectiveStore tier2 supportsCot is true (got ${storeTier14.supportsCot})`);

  // 2. LIVE STDIO MCP PROTOCOL TESTS
  console.log("\n🔌 2. Connecting to Holy Bible MCP via Live Stdio Transport...");
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: { ...process.env, NODE_NO_WARNINGS: "1" }
  });

  const client = new Client(
    { name: "e2e-test-runner", version: "2.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✅ MCP Client Connected!");

  // TEST CASE A: qwen3.5:4b with parameter_size_b: 4.7
  console.log("\n🧪 3. Testing ask_holy_bible with qwen3.5:4b (parameter_size_b: 4.7)...");
  const res4b: any = await client.callTool({
    name: "ask_holy_bible",
    arguments: {
      question: "що таке любов",
      language: "ukr",
      parameter_size_b: 4.7,
      isSmallModel: true,
      modelMetadata: {
        modelName: "qwen3.5:4b",
        parameterSize: 4.7,
        isSmallModel: true,
        supportsThinking: true
      }
    }
  });

  const data4b = JSON.parse(res4b.content[0].text);
  assert(data4b.modelTier === "tier1", `MCP returns modelTier: 'tier1' for 4.7B (got ${data4b.modelTier})`);
  assert(data4b.modelTierName === "Tier 1 (Small <=8.5B)", `MCP returns modelTierName: 'Tier 1 (Small <=8.5B)' (got ${data4b.modelTierName})`);
  assert(data4b.detectedParamSize === 4.7, `MCP returns detectedParamSize: 4.7 (got ${data4b.detectedParamSize})`);
  assert(data4b.supportsCot === false, `MCP returns supportsCot: false for Tier 1 (got ${data4b.supportsCot})`);
  assert(data4b.maxThinkChars === 0, `MCP returns maxThinkChars: 0 for Tier 1 (got ${data4b.maxThinkChars})`);
  assert(
    data4b.contextText.includes("• Model Tier Calibration: Tier 1 (Small <=8.5B) (Detected: 4.7B parameters)"),
    "Context includes: 'Model Tier Calibration: Tier 1 (Small <=8.5B) (Detected: 4.7B parameters)'"
  );
  assert(
    data4b.contextText.includes("• Output Format: Direct, concise Markdown response."),
    "Context includes: 'Output Format: Direct, concise Markdown response.'"
  );
  assert(
    !data4b.contextText.includes("• Thinking Protocol (CoT): Active"),
    "Context does NOT contain active CoT thinking protocol for Tier 1"
  );

  // TEST CASE B: String parameter size "4.7B"
  console.log("\n🧪 4. Testing ask_holy_bible with string parameter_size_b: '4.7B'...");
  const resStr4b: any = await client.callTool({
    name: "ask_holy_bible",
    arguments: {
      question: "що таке віра",
      language: "ukr",
      parameter_size_b: "4.7B"
    }
  });

  const dataStr4b = JSON.parse(resStr4b.content[0].text);
  assert(dataStr4b.modelTier === "tier1", `String '4.7B' resolves to 'tier1' (got ${dataStr4b.modelTier})`);
  assert(dataStr4b.detectedParamSize === 4.7, `detectedParamSize parsed to 4.7 from '4.7B' (got ${dataStr4b.detectedParamSize})`);
  assert(dataStr4b.supportsCot === false, `supportsCot is false for '4.7B' (got ${dataStr4b.supportsCot})`);

  // TEST CASE C: isSmallModel: true without parameter_size_b
  console.log("\n🧪 5. Testing ask_holy_bible with isSmallModel: true (no explicit size)...");
  const resSmall: any = await client.callTool({
    name: "ask_holy_bible",
    arguments: {
      question: "що таке надія",
      language: "ukr",
      isSmallModel: true
    }
  });

  const dataSmall = JSON.parse(resSmall.content[0].text);
  assert(dataSmall.modelTier === "tier1", `isSmallModel: true resolves to 'tier1' (got ${dataSmall.modelTier})`);
  assert(dataSmall.detectedParamSize === 4.0, `detectedParamSize resolves to 4.0 for isSmallModel (got ${dataSmall.detectedParamSize})`);
  assert(dataSmall.supportsCot === false, `supportsCot is false for isSmallModel (got ${dataSmall.supportsCot})`);

  // TEST CASE D: qwen3.5:14b (Tier 2, 14.0B)
  console.log("\n🧪 6. Testing ask_holy_bible with qwen3.5:14b (parameter_size_b: 14.0)...");
  const res14b: any = await client.callTool({
    name: "ask_holy_bible",
    arguments: {
      question: "що таке любов",
      language: "ukr",
      parameter_size_b: 14.0,
      modelMetadata: {
        modelName: "qwen3.5:14b",
        parameterSize: 14.0,
        supportsThinking: true
      }
    }
  });

  const data14b = JSON.parse(res14b.content[0].text);
  assert(data14b.modelTier === "tier2", `14.0B resolves to 'tier2' (got ${data14b.modelTier})`);
  assert(data14b.modelTierName === "Tier 2 (Medium Standard 10.5-24.9B)", `Tier 2 display name matches (got ${data14b.modelTierName})`);
  assert(data14b.supportsCot === true, `supportsCot is true for Tier 2 (got ${data14b.supportsCot})`);
  assert(data14b.maxThinkChars > 0, `maxThinkChars > 0 for Tier 2 (got ${data14b.maxThinkChars})`);
  assert(
    data14b.contextText.includes("• Thinking Protocol (CoT): Active"),
    "Context includes active CoT thinking protocol for Tier 2"
  );

  // 7. ORCHESTRATOR & STREAM TRANSFORMER COt BLOCKING LOGIC
  console.log("\n⚡ 7. Testing Orchestrator & Transformer CoT Blocking Logic:");
  const mcpAggregatedTier1 = {
    supportsCot: false,
    maxThinkChars: 0,
    modelTier: "tier1",
    modelTierName: "Tier 1 (Small <=8.5B)",
    detectedParamSize: 4.7
  };

  const isReasoningModel = true;
  const nativeSupportsThinking = true;
  const orchestratorFinalSupportsThinking = Boolean(mcpAggregatedTier1.supportsCot && (nativeSupportsThinking || isReasoningModel));
  assert(orchestratorFinalSupportsThinking === false, "Orchestrator finalSupportsThinking evaluates to false when MCP supportsCot=false");

  // Verify stream chunk suppression simulation
  let suppressedOutput = "";
  let isSuppressing = false;
  const simulateProcessChunk = (type: string, content: string, supportsThinking: boolean) => {
    if (type === "think") {
      if (!supportsThinking) return;
      suppressedOutput += `<think>${content}</think>`;
    } else if (type === "text") {
      let text = content;
      if (!supportsThinking) {
        if (isSuppressing) {
          if (text.includes("</think>")) {
            isSuppressing = false;
            text = text.replace(/^[\s\S]*?<\/think>/i, "");
          } else {
            return;
          }
        }
        while (text.includes("<think>")) {
          if (text.includes("</think>")) {
            text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
          } else {
            isSuppressing = true;
            text = text.replace(/<think>[\s\S]*$/i, "");
            break;
          }
        }
        text = text.replace(/<\/?(?:think|thought|reasoning)>/gi, "");
        if (!text) return;
      }
      suppressedOutput += text;
    }
  };

  // Run simulation with supportsThinking = false
  simulateProcessChunk("think", "Reasoning tokens", false);
  simulateProcessChunk("text", "<think>Analyzing theology...", false);
  simulateProcessChunk("text", "Exploring Greek agape vs phileo...", false);
  simulateProcessChunk("text", "Finished analysis.</think>Любов у християнському розумінні — це жертовність.", false);
  simulateProcessChunk("text", " Вона ґрунтується на 1 Кор 13.", false);

  assert(!suppressedOutput.includes("<think>"), "Simulated output does NOT contain <think>");
  assert(!suppressedOutput.includes("</think>"), "Simulated output does NOT contain </think>");
  assert(!suppressedOutput.includes("Analyzing theology"), "Simulated output suppressed internal thinking text");
  assert(suppressedOutput.startsWith("Любов у християнському розумінні"), `Simulated output starts immediately with answer (got: "${suppressedOutput.slice(0, 40)}...")`);

  console.log("\n=================================================================");
  console.log(`🏁 ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  await transport.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("❌ Test suite fatal error:", err);
  process.exit(1);
});
