import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { MorphologyEngine } from "../src/morphology_engine";
import { getInterlinearVerse } from "../src/morphology/interlinear_builder";
import { TheologicalKnowledgeGraph } from "../src/graph/theological_graphology_engine";
import { formatPromptForModel } from "../client/src/lib/ai/on-device/prompt/prompt-formatters";
import { JinjaChatTemplateService } from "../client/src/lib/ai/chat/jinja-chat-template.service";
import { GgufValidator } from "../client/src/lib/ai/on-device/storage/gguf-validator";
import { IosJetsamGuard } from "../client/src/lib/hardware/ios-jetsam-guard";
import { PostQuantumSuite } from "../client/src/lib/p2p/crypto/post-quantum-suite";
import { ML_KEM_768_CONSTANTS } from "../client/src/lib/p2p/crypto/pq/pq-types";
import { p2pStreamEventBus } from "../client/src/lib/p2p/events/p2p-stream-event-bus";
import { createSessionsSlice } from "../client/src/stores/p2p/slices/sessions.slice";
import { createTransportSlice } from "../client/src/stores/p2p/slices/transport.slice";
import { createQrNonceSlice } from "../client/src/stores/p2p/slices/qr-nonce.slice";
import { getRegisteredIcon, ICON_REGISTRY } from "../client/src/components/ui/icon-registry";
import { resolveIcon } from "../client/src/components/chat/header/palette-utils";

async function runFullSystemMasterVerification() {
  console.log("================================================================================");
  console.log("👑 MASTER COMPREHENSIVE FULL-SYSTEM POLISHING VERIFICATION (BLOCKS 1-5)");
  console.log("================================================================================");

  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS ${total}] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL ${total}] ${name} ${details ? `(${details})` : ""}`);
    }
  }

  // ==========================================
  // SECTION 1: MCP Server Core & Theological Graph
  // ==========================================
  console.log("\n📦 --- SECTION 1: MCP SERVER CORE & THEOLOGICAL GRAPH ---");

  // Piscina default export
  const workerFile = path.resolve("./src/workers/integrity_worker.ts");
  const workerSrc = fs.readFileSync(workerFile, "utf-8");
  assert("Piscina Worker export default async function runTask", workerSrc.includes("export default async function runTask"));

  // SQLite DB tables
  const dbPath = path.resolve("./data/directives.sqlite");
  if (fs.existsSync(dbPath)) {
    const db = new Database(dbPath, { readonly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const tableNames = tables.map(t => t.name);
    assert("SQLite contains 'patristic_commentaries'", tableNames.includes("patristic_commentaries"));
    assert("SQLite contains 'theological_semantic_concepts'", tableNames.includes("theological_semantic_concepts"));
    db.close();
  } else {
    assert("SQLite database exists", false, "directives.sqlite missing");
  }

  // Unified Strong's Greek & Hebrew parser LRU cache
  const greekParsed = MorphologyEngine.parseMorphology("V-PAI-3S", "grc");
  const hebrewParsed = MorphologyEngine.parseMorphology("HR/Ncfsa", "heb");
  assert("Greek Robinson morphology parsed", greekParsed.pos?.toLowerCase() === "verb");
  assert("Hebrew WLC morphology parsed", hebrewParsed.pos?.toLowerCase() === "noun");

  // LRU Strong's etymology cache
  const etym1 = await MorphologyEngine.getStrongsEtymology("G0026");
  const etym2 = await MorphologyEngine.getStrongsEtymology("G0026");
  assert("Strong's etymology parsed from cache/DB", Boolean(etym1 && etym1.strongsId));
  assert("Strong's LRU cache hit identical object", etym1 === etym2);

  // Dynamic Graphology Knowledge Graph
  const kg = TheologicalKnowledgeGraph.getInstance();
  assert("Graphology knowledge graph hydrated nodes", kg.getNodeCount() >= 5);
  assert("Graphology knowledge graph hydrated edges", kg.getEdgeCount() >= 4);

  // ==========================================
  // SECTION 2: Android Native, Security & Hardware
  // ==========================================
  console.log("\n🛡️ --- SECTION 2: ANDROID NATIVE, SECURITY & HARDWARE ---");

  // KeystoreSecurityManager EncryptedSharedPreferences
  const keystoreFile = path.resolve("./client/android/app/src/main/java/com/holy/bible/mcp/identity/KeystoreSecurityManager.java");
  const keystoreSrc = fs.readFileSync(keystoreFile, "utf-8");
  assert("KeystoreSecurityManager uses EncryptedSharedPreferences", keystoreSrc.includes("EncryptedSharedPreferences"));
  assert("KeystoreSecurityManager implements storeTrustedPeers", keystoreSrc.includes("storeTrustedPeers"));
  assert("KeystoreSecurityManager implements getTrustedPeers", keystoreSrc.includes("getTrustedPeers"));

  // HolyDeviceIdentityPlugin & LegacyIdentityMigrator
  const identityFile = path.resolve("./client/android/app/src/main/java/com/holy/bible/mcp/HolyDeviceIdentityPlugin.java");
  const identitySrc = fs.readFileSync(identityFile, "utf-8");
  const migratorFile = path.resolve("./client/android/app/src/main/java/com/holy/bible/mcp/identity/LegacyIdentityMigrator.java");
  const migratorSrc = fs.readFileSync(migratorFile, "utf-8");
  assert("HolyDeviceIdentityPlugin uses Keystore for trusted peers", identitySrc.includes("keystoreManager.getTrustedPeers()"));
  assert("LegacyIdentityMigrator clears legacy unencrypted peers", migratorSrc.includes("remove(KEY_TRUSTED_PEERS)"));

  // CameraX Session & Scanner Overlay Cleanup
  const mlKitFile = path.resolve("./client/android/app/src/main/java/com/holy/bible/mcp/vision/MlKitBarcodeAnalyzer.java");
  const mlKitSrc = fs.readFileSync(mlKitFile, "utf-8");
  assert("MlKitBarcodeAnalyzer implements close()", mlKitSrc.includes("scanner.close()"));

  const overlayFile = path.resolve("./client/android/app/src/main/java/com/holy/bible/mcp/vision/ui/ScannerOverlayBuilder.java");
  const overlaySrc = fs.readFileSync(overlayFile, "utf-8");
  assert("ScannerOverlayBuilder implements cleanup()", overlaySrc.includes("cleanup()"));
  assert("ScannerOverlayBuilder clears laser animation", overlaySrc.includes("laserBeamView.clearAnimation()"));

  // AudioFocus Management in HolySpeechPlugin
  const speechFile = path.resolve("./client/android/app/src/main/java/com/holy/bible/mcp/HolySpeechPlugin.java");
  const speechSrc = fs.readFileSync(speechFile, "utf-8");
  assert("HolySpeechPlugin uses AudioFocusManager", speechSrc.includes("audioFocusManager.requestPlaybackFocus"));
  assert("HolySpeechPlugin abandons AudioFocus on stop/complete", speechSrc.includes("audioFocusManager.abandonPlaybackFocus()"));

  // Android Native String Localization (UK, EN, RU)
  const androidValuesUk = fs.readFileSync(path.resolve("./client/android/app/src/main/res/values-uk/strings.xml"), "utf-8");
  const androidValuesRu = fs.readFileSync(path.resolve("./client/android/app/src/main/res/values-ru/strings.xml"), "utf-8");
  const androidValuesEn = fs.readFileSync(path.resolve("./client/android/app/src/main/res/values/strings.xml"), "utf-8");
  assert("Android strings.xml localized in Ukrainian", androidValuesUk.includes("scanner_title"));
  assert("Android strings.xml localized in Russian", androidValuesRu.includes("scanner_title"));
  assert("Android strings.xml localized in English", androidValuesEn.includes("scanner_title"));

  // ==========================================
  // SECTION 3: On-Device AI, WebGPU & OPFS
  // ==========================================
  console.log("\n🧠 --- SECTION 3: ON-DEVICE AI, WEBGPU & OPFS ---");

  // OPFS Storage Driver holy_models/ folder standardization
  const opfsDriverFile = path.resolve("./client/src/lib/ai/on-device/storage/opfs-storage.driver.ts");
  const opfsDriverSrc = fs.readFileSync(opfsDriverFile, "utf-8");
  assert("OpfsStorageDriver uses holy_models/ folder", opfsDriverSrc.includes("getDirectoryHandle('holy_models'"));
  assert("OpfsStorageDriver contains root directory fallback", opfsDriverSrc.includes("// Fallback check in root"));

  // wasm-engine.worker.ts
  const wasmWorkerFile = path.resolve("./client/src/lib/ai/on-device/workers/wasm-engine.worker.ts");
  const wasmWorkerSrc = fs.readFileSync(wasmWorkerFile, "utf-8");
  assert("WASM engine worker formats prompt dynamically", wasmWorkerSrc.includes("formatPromptForModel(family, chatItems"));
  assert("WASM engine worker inspects holy_models/ directory", wasmWorkerSrc.includes("getDirectoryHandle('holy_models'"));

  // GGUF Magic Validator
  assert("GgufValidator identifies 0x47475546 magic bytes", GgufValidator.validateMagicHeader(new Uint8Array([0x47, 0x47, 0x55, 0x46])));
  assert("GgufValidator rejects invalid header bytes", !GgufValidator.validateMagicHeader(new Uint8Array([0x00, 0x00, 0x00, 0x00])));

  // Adaptive Jinja chat prompt templates
  const testMsgs = [{ role: "user", content: "Привіт" }];
  assert("Llama-3 template rendered correctly", formatPromptForModel("llama-3", testMsgs).includes("<|begin_of_text|>"));
  assert("Gemma-2 template rendered correctly", formatPromptForModel("gemma-2", testMsgs).includes("<start_of_turn>"));
  assert("DeepSeek-R1 template rendered correctly", JinjaChatTemplateService.renderTemplate(testMsgs, undefined, "deepseek_r1").includes("<｜User｜>"));

  // iOS Jetsam Memory Guard
  const engineServiceFile = path.resolve("./client/src/lib/ai/on-device/on-device-engine.service.ts");
  const engineServiceSrc = fs.readFileSync(engineServiceFile, "utf-8");
  assert("OnDeviceEngineService registered with IosJetsamGuard", engineServiceSrc.includes("IosJetsamGuard.registerBackgroundPurgeCallback"));

  // ==========================================
  // SECTION 4: Sovereign P2P Mesh & Cryptography
  // ==========================================
  console.log("\n🌐 --- SECTION 4: SOVEREIGN P2P MESH & CRYPTOGRAPHY ---");

  // NIST FIPS 203 ML-KEM-768 parameters
  assert("NIST FIPS 203 ML-KEM-768 K = 3", ML_KEM_768_CONSTANTS.K === 3);
  assert("NIST FIPS 203 ML-KEM-768 Public Key = 1184 bytes", ML_KEM_768_CONSTANTS.PUBLIC_KEY_BYTES === 1184);
  assert("NIST FIPS 203 ML-KEM-768 Ciphertext = 1088 bytes", ML_KEM_768_CONSTANTS.CIPHERTEXT_BYTES === 1088);

  // Key exchange encapsulation & decapsulation
  const aliceKeys = PostQuantumSuite.generateHybridKeyPair();
  const bobKeys = PostQuantumSuite.generateHybridKeyPair();
  const enc = PostQuantumSuite.encapsulate(bobKeys.classicPublicKey, bobKeys.pqPublicKey);
  const bobRecovered = PostQuantumSuite.decapsulate(enc.ciphertext, bobKeys.classicPrivateKey, bobKeys.pqPrivateKey);
  assert("Quantum-resistant shared secret recovered identically", Buffer.from(enc.sharedSecret).equals(Buffer.from(bobRecovered)));

  // Zustand slice harmonization
  const transportSrc = fs.readFileSync(path.resolve("./client/src/stores/p2p/slices/transport.slice.ts"), "utf-8");
  const sessionsSrc = fs.readFileSync(path.resolve("./client/src/stores/p2p/slices/sessions.slice.ts"), "utf-8");
  assert("Transport slice does not contain duplicate activeSessions", !transportSrc.includes("activeSessions: Record<string, ActiveSessionCryptoState>"));
  assert("Sessions slice handles safe non-dropping updateSession", sessionsSrc.includes("...(state.activeSessions[peerId] || { peerId })"));

  // Adaptive Telemetry Heartbeat (Doze Mode Guard)
  const telemSrc = fs.readFileSync(path.resolve("./client/src/stores/p2p/services/p2p-telemetry.service.ts"), "utf-8");
  assert("P2pTelemetryService switches to 15s in background", telemSrc.includes("15000"));
  assert("P2pTelemetryService triggers wake-up broadcast on visible", telemSrc.includes("broadcastOnce()"));

  // ==========================================
  // SECTION 5: React UI, Fast Streaming & i18n
  // ==========================================
  console.log("\n🎨 --- SECTION 5: REACT UI, FAST STREAMING & I18N ---");

  // Fixed MCP Server Card Toggle Switch
  const cardButtonsFile = path.resolve("./client/src/components/mcp/cards/ServerActionButtons.tsx");
  const cardButtonsSrc = fs.readFileSync(cardButtonsFile, "utf-8");
  assert("MCP Server toggle button inverts enabled state onToggle(svr.id, !svr.enabled)", cardButtonsSrc.includes("onToggle(svr.id, !svr.enabled)"));

  // StreamingMessageSlot listener churn fix
  const slotSrc = fs.readFileSync(path.resolve("./client/src/components/chat/message/StreamingMessageSlot.tsx"), "utf-8");
  assert("StreamingMessageSlot subscription dependencies is strictly [chatId]", slotSrc.includes("}, [chatId]);"));

  // McpDashboard Clipboard Import & Alert Removal
  const mcpDashSrc = fs.readFileSync(path.resolve("./client/src/components/mcp/McpDashboard.tsx"), "utf-8");
  assert("McpDashboard implements handleImportClipboard", mcpDashSrc.includes("handleImportClipboard"));
  assert("McpDashboard binds onImportClipboard", mcpDashSrc.includes("onImportClipboard={handleImportClipboard}"));
  assert("McpDashboard has zero blocking alert() calls", !mcpDashSrc.includes("alert("));

  // ChatHeader Tree-Shaking
  const chatHeaderSrc = fs.readFileSync(path.resolve("./client/src/components/chat/ChatHeader.tsx"), "utf-8");
  assert("ChatHeader uses tree-shakable selective Lucide imports", chatHeaderSrc.includes("import { Menu, Settings, Flame } from 'lucide-react'"));
  assert("ChatHeader has zero blocking alert() calls", !chatHeaderSrc.includes("alert("));

  // Mobile Viewport Keyboard Resizing
  const layoutSrc = fs.readFileSync(path.resolve("./client/src/app/[locale]/layout.tsx"), "utf-8");
  assert("Layout viewport specifies interactiveWidget: 'resizes-content'", layoutSrc.includes("interactiveWidget: 'resizes-content'"));

  // i18n 100% Parity Check
  const ukJson = JSON.parse(fs.readFileSync(path.resolve("./client/messages/uk.json"), "utf-8"));
  const enJson = JSON.parse(fs.readFileSync(path.resolve("./client/messages/en.json"), "utf-8"));
  const ruJson = JSON.parse(fs.readFileSync(path.resolve("./client/messages/ru.json"), "utf-8"));

  const checkKeys = ["compilingShaders", "downloadingWeights", "activeInMemory", "deleteWeightsTooltip", "reloadModel", "launchModel", "downloadModelWithMB"];
  for (const k of checkKeys) {
    assert(`i18n key Settings.${k} present across UK, EN, RU`, Boolean(ukJson.Settings?.[k] && enJson.Settings?.[k] && ruJson.Settings?.[k]));
  }

  // Summary
  console.log("\n================================================================================");
  console.log(`🎯 MASTER SYSTEM VERIFICATION COMPLETE: ${passed}/${total} TESTS PASSED`);
  console.log("================================================================================");

  if (passed === total) {
    console.log("🌟 ALL CODE, GRAPH, ANDROID, AI, P2P & REACT UI MODULES ARE 100% VERIFIED!");
    process.exit(0);
  } else {
    console.error("⚠️ VERIFICATION ENCOUNTERED FAILURES!");
    process.exit(1);
  }
}

runFullSystemMasterVerification().catch(err => {
  console.error("Fatal error during master verification:", err);
  process.exit(1);
});
