import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

const BLOCK_FILES = {
  'Block 1 (MCP Server Core & DB)': [
    'src/hybrid_search_engine.ts',
    'src/scripture_graph_engine.ts',
    'src/directives/repositories/theology_repository.ts',
    'src/directives/directive_store.ts',
    'src/workers/worker_pool.ts',
    'src/workers/piscina_worker_pool.ts',
    'src/services/online_bible_fallback.ts',
    'src/search/minisearch_fallback_engine.ts',
    'src/tools/definitions.ts',
    'src/tools/handlers/ask_holy_bible.handler.ts',
    'src/tools/handlers/commentary.handlers.ts',
    'src/tools/handlers/morphology.handlers.ts',
    'src/tools/handlers/search.handlers.ts',
    'src/tools/handlers/system.handlers.ts',
    'src/tools/handlers/verse.handlers.ts'
  ],
  'Block 2 (Android Native Hardening & i18n)': [
    'client/android/app/src/main/java/com/holy/bible/mcp/vision/ui/CloseButtonView.java',
    'client/android/app/src/main/java/com/holy/bible/mcp/vision/ui/FlipButtonView.java',
    'client/android/app/src/main/java/com/holy/bible/mcp/vision/ui/TorchButtonView.java',
    'client/android/app/src/main/java/com/holy/bible/mcp/vision/ui/HudReticleView.java',
    'client/android/app/src/main/java/com/holy/bible/mcp/vision/ui/ScannerOverlayBuilder.java',
    'client/android/app/src/main/java/com/holy/bible/mcp/vision/CameraXSessionController.java',
    'client/android/app/src/main/java/com/holy/bible/mcp/vision/MlKitBarcodeAnalyzer.java',
    'client/android/app/src/main/java/com/holy/bible/mcp/HolyVisionPlugin.java',
    'client/android/app/src/main/java/com/holy/bible/mcp/HolyDeviceIdentityPlugin.java',
    'client/android/app/src/main/java/com/holy/bible/mcp/identity/KeystoreSecurityManager.java',
    'client/android/app/src/main/java/com/holy/bible/mcp/HolySpeechPlugin.java',
    'client/android/app/src/main/java/com/holy/bible/mcp/speech/AudioFocusManager.java',
    'client/android/app/src/main/java/com/holy/bible/mcp/P2PForegroundService.java',
    'client/android/app/src/main/java/com/holy/bible/mcp/service/P2PMeshWorker.java',
    'client/android/app/src/main/res/values/strings.xml',
    'client/android/app/src/main/res/values-uk/strings.xml',
    'client/android/app/src/main/res/values-ru/strings.xml'
  ],
  'Block 3 (On-Device AI & Hardware Profiler)': [
    'client/src/lib/ai/on-device/storage/storage-quota.service.ts',
    'client/src/lib/ai/on-device/storage/opfs-storage.driver.ts',
    'client/src/lib/ai/on-device/storage/webllm-cache.adapter.ts',
    'client/src/lib/ai/on-device/storage/gguf-validator.ts',
    'client/src/lib/ai/on-device/storage/storage-cleaner.ts',
    'client/src/lib/ai/on-device/storage-manager.ts',
    'client/src/lib/hardware/workers/hardware-profiler.worker.ts',
    'client/src/lib/hardware/mobile-hardware-profiler.ts',
    'client/src/lib/ai/core/pipeline/mcp-context-resolver.ts',
    'client/src/lib/ai/core/pipeline/execution-context-builder.ts',
    'client/src/lib/ai/core/pipeline/stream-execution-pipeline.ts',
    'client/src/lib/ai/core/orchestrator.ts',
    'client/src/lib/ai/dynamic-resolver/hf-api-cached-client.ts',
    'client/src/lib/ai/dynamic-resolver/quantization-shard-picker.ts',
    'client/src/lib/ai/on-device/catalog/dynamic-model-resolver.ts',
    'client/src/lib/ai/chat/jinja-chat-template.service.ts',
    'client/src/lib/hardware/ios-jetsam-guard.ts',
    'client/src/workers/qr-scanner.worker.ts',
    'client/src/lib/ai/on-device/workers/webgpu-engine.worker.ts',
    'client/src/lib/ai/on-device/workers/opfs-downloader.worker.ts',
    'client/src/lib/ai/on-device/workers/wasm-engine.worker.ts',
    'client/src/lib/ai/on-device/on-device-engine.service.ts',
    'client/src/lib/ai/adapters/on-device.adapter.ts',
    'client/src/lib/ai/streaming/executors/on-device-stream-executor.ts'
  ],
  'Block 4 (P2P Mesh Core & Worker Crypto)': [
    'client/src/stores/p2p/slices/identity.slice.ts',
    'client/src/stores/p2p/slices/pairing.slice.ts',
    'client/src/stores/p2p/slices/qr-nonce.slice.ts',
    'client/src/stores/p2p/slices/governor.slice.ts',
    'client/src/stores/p2p/slices/telemetry.slice.ts',
    'client/src/stores/p2p/slices/transport.slice.ts',
    'client/src/stores/p2p/slices/sessions.slice.ts',
    'client/src/stores/p2p/slices/ui.slice.ts',
    'client/src/stores/p2p/services/p2p-signaling.service.ts',
    'client/src/stores/p2p/services/p2p-session.coordinator.ts',
    'client/src/stores/p2p/services/p2p-telemetry.service.ts',
    'client/src/stores/p2p/services/p2p-storage.adapter.ts',
    'client/src/stores/useP2pStore.ts',
    'client/src/lib/p2p/events/p2p-stream-event-bus.ts',
    'client/src/lib/p2p/crypto/pq-hybrid-ratchet.ts',
    'client/src/lib/p2p/crypto/post-quantum-suite.ts',
    'client/src/lib/p2p/crypto/noble-crypto-suite.ts',
    'client/src/lib/p2p/crypto/qr-generator.ts',
    'client/src/lib/p2p/transport/lockfree-ringbuffer.ts',
    'client/src/workers/p2p-transport.worker.ts',
    'client/src/lib/p2p/state/yjs-sync-mesh.ts',
    'client/src/lib/p2p/orchestrator/p2p-remote-provider.adapter.ts',
    'client/src/lib/p2p/transport/mobile-lifecycle-guard.ts',
    'client/src/lib/p2p/transport/nat-traversal-manager.ts'
  ]
};

console.log('=================================================================');
console.log('🔍 FULL PROJECT FILE AUDIT (BLOCKS 1, 2, 3, 4)');
console.log('=================================================================\n');

let totalFiles = 0;
let totalMissing = 0;

for (const [blockName, files] of Object.entries(BLOCK_FILES)) {
  console.log(`📦 ${blockName} (${files.length} files):`);
  let blockMissing = 0;
  for (const relPath of files) {
    totalFiles++;
    const fullPath = path.join(ROOT, relPath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      console.log(`  ✅ [EXISTS] ${relPath} (${stats.size} bytes)`);
    } else {
      console.error(`  ❌ [MISSING] ${relPath}`);
      blockMissing++;
      totalMissing++;
    }
  }
  if (blockMissing === 0) {
    console.log(`  🎉 All ${files.length} files exist and verified!\n`);
  } else {
    console.log(`  ⚠️ ${blockMissing} files missing in this block!\n`);
  }
}

console.log('=================================================================');
console.log(`🏁 AUDIT RESULT: ${totalFiles - totalMissing}/${totalFiles} files verified on disk.`);
console.log('=================================================================');

if (totalMissing > 0) {
  process.exit(1);
}
