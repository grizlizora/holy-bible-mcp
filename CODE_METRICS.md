# 📊 Повний реєстр вихідного коду проєкту: рядки (LOC) та розміри файлів

> ℹ️ **Параметри фільтрації:**
> - **Враховано всі мови програмування та розмітки:** `TypeScript`, `TSX`, `Java`, `CSS`, `XML`, `Gradle`, `SQL`, `HTML`, `YAML`, `JavaScript`, `Dockerfile` тощо.
> - **Виключено згідно із завданням:** `.json`, `.md`/`.mb` (документація), `.sh` (шел-скрипти), будь-які файли/папки зі словом `test` у назві.
> - **Виключено службові папки:** `node_modules`, `.next`, `build`, `dist`, `out`, `.gradle`, `.git`, `.idea`.

## 📌 1. Загальне зведення проєкту

| Показник | Значення |
| :--- | :--- |
| **Всього файлів з кодом** | **818** |
| **Загальна кількість рядків (Total LOC)** | **84,867** |
| **Чистий код (SLOC - Non-empty, non-comment)** | **71,150** (83.8%) |
| **Коментарі** | **4,628** (5.5%) |
| **Порожні рядки** | **9,089** (10.7%) |
| **Загальний розмір вихідного коду** | **3.06 MB** (3,205,697 байт) |

## 📈 2. Розподіл за мовами програмування та форматами

| Мова / Формат | Файлів | Рядків (Total) | Чистий код (SLOC) | Частка коду | Розмір (KB) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **TypeScript** | 563 | 57,513 | 46,976 | 67.8% | 2,031.7 KB |
| **TypeScript (React)** | 180 | 22,838 | 20,546 | 26.9% | 937.1 KB |
| **Java** | 23 | 2,118 | 1,760 | 2.5% | 78.6 KB |
| **CSS** | 7 | 1,072 | 731 | 1.3% | 27.4 KB |
| **XML** | 22 | 551 | 514 | 0.6% | 22.8 KB |
| **HTML** | 1 | 343 | 318 | 0.4% | 11.1 KB |
| **Gradle** | 8 | 230 | 175 | 0.3% | 7.5 KB |
| **SQL** | 2 | 52 | 48 | 0.1% | 1.7 KB |
| **Dockerfile** | 1 | 42 | 27 | 0.0% | 1.0 KB |
| **YAML** | 2 | 31 | 25 | 0.0% | 0.5 KB |
| **Java Properties** | 3 | 30 | 10 | 0.0% | 1.3 KB |
| **Proguard Rules** | 1 | 21 | 0 | 0.0% | 0.7 KB |
| **JavaScript (ESM)** | 1 | 18 | 14 | 0.0% | 0.5 KB |
| **JavaScript (CommonJS)** | 1 | 5 | 5 | 0.0% | 0.1 KB |
| **JavaScript** | 3 | 3 | 1 | 0.0% | 8.5 KB |

## 🏗️ 3. Розподіл за підсистемами проєкту

| Підсистема | Файлів | Рядків (Total) | Чистий код (SLOC) | Розмір (KB) |
| :--- | :---: | :---: | :---: | :---: |
| **Client (Next.js / React Web UI)** | 639 | 70,536 | 59,233 | 2,576.4 KB |
| **Server (Holy Bible MCP Engine)** | 108 | 9,453 | 7,837 | 334.0 KB |
| **Android (Native Java/Gradle/XML)** | 60 | 3,293 | 2,777 | 122.0 KB |
| **Core Tooling & Scripts** | 9 | 1,375 | 1,133 | 90.7 KB |
| **Root / Shared** | 2 | 210 | 170 | 7.4 KB |

## 🔝 4. ТОП-25 найбільших файлів проєкту за обсягом коду

| № | Шлях до файлу | Мова | Рядків (LOC) | Чистий код | Розмір (KB) |
| :---: | :--- | :--- | :---: | :---: | :---: |
| 1 | `client/src/app/globals.css` | CSS | **887** | 622 | 23.24 KB |
| 2 | `client/src/components/p2p/P2pClientModal.tsx` | TypeScript (React) | **641** | 573 | 23.88 KB |
| 3 | `client/src/components/p2p/P2pNodeDetailsModal.tsx` | TypeScript (React) | **600** | 543 | 26.13 KB |
| 4 | `client/src/components/settings/providers/LocalProvidersSection.tsx` | TypeScript (React) | **585** | 548 | 30.91 KB |
| 5 | `client/src/components/mcp/McpServerCard.tsx` | TypeScript (React) | **514** | 478 | 23.7 KB |
| 6 | `client/src/components/mcp/McpAddChoiceModal.tsx` | TypeScript (React) | **510** | 472 | 25.97 KB |
| 7 | `client/src/components/settings/DeviceDiagnosticsSection.tsx` | TypeScript (React) | **480** | 444 | 25.17 KB |
| 8 | `client/src/lib/mcp-registry/catalog/seed-data.ts` | TypeScript | **446** | 385 | 65.01 KB |
| 9 | `client/src/components/chat/MessageList.tsx` | TypeScript (React) | **444** | 384 | 16.44 KB |
| 10 | `client/src/stores/useChatStore.ts` | TypeScript | **430** | 383 | 15.25 KB |
| 11 | `client/src/components/chat/ChatHeader.tsx` | TypeScript (React) | **400** | 353 | 18.44 KB |
| 12 | `client/src/components/settings/providers/CloudProvidersSection.tsx` | TypeScript (React) | **386** | 370 | 20.62 KB |
| 13 | `client/src/app/api/mcp/install-code/route.ts` | TypeScript | **375** | 319 | 14.56 KB |
| 14 | `client/src/components/chat/InputDock.tsx` | TypeScript (React) | **375** | 341 | 14.86 KB |
| 15 | `client/src/components/p2p/P2pHostModal.tsx` | TypeScript (React) | **375** | 336 | 14.78 KB |
| 16 | `client/src/components/sidebar/Sidebar.tsx` | TypeScript (React) | **374** | 338 | 13.94 KB |
| 17 | `client/src/components/settings/ProvidersSettingsPanel.tsx` | TypeScript (React) | **366** | 343 | 13.67 KB |
| 18 | `client/src/components/p2p/client/P2pQrScannerView.tsx` | TypeScript (React) | **350** | 326 | 16.33 KB |
| 19 | `client/src/components/mcp/McpServerSettingsModal.tsx` | TypeScript (React) | **347** | 328 | 20.84 KB |
| 20 | `client/src/components/sidebar/SidebarChatItem.tsx` | TypeScript (React) | **346** | 321 | 13.71 KB |
| 21 | `client/android/app/src/main/assets/public/index.html` | HTML | **343** | 318 | 11.09 KB |
| 22 | `client/src/app/api/mcp/download-db/route.ts` | TypeScript | **343** | 295 | 11.97 KB |
| 23 | `src/database/connection/generic_sqlite_pool.ts` | TypeScript | **335** | 257 | 9.21 KB |
| 24 | `client/src/components/mcp/McpDashboard.tsx` | TypeScript (React) | **322** | 289 | 10.67 KB |
| 25 | `client/scripts/real_e2e_cot_diagnostic.ts` | TypeScript | **321** | 266 | 16.66 KB |

## 📁 5. Повний реєстр усіх знайдених файлів коду (818 файлів)

| № | Шлях до файлу | Мова | Підсистема | Рядків (LOC) | Чистий код | Коментарі | Порожні | Розмір |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | `client/src/app/globals.css` | CSS | Client (Next.js / React Web UI) | 887 | 622 | 143 | 122 | 23.24 KB |
| 2 | `client/src/components/p2p/P2pClientModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 641 | 573 | 11 | 57 | 23.88 KB |
| 3 | `client/src/components/p2p/P2pNodeDetailsModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 600 | 543 | 11 | 46 | 26.13 KB |
| 4 | `client/src/components/settings/providers/LocalProvidersSection.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 585 | 548 | 6 | 31 | 30.91 KB |
| 5 | `client/src/components/mcp/McpServerCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 514 | 478 | 5 | 31 | 23.7 KB |
| 6 | `client/src/components/mcp/McpAddChoiceModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 510 | 472 | 2 | 36 | 25.97 KB |
| 7 | `client/src/components/settings/DeviceDiagnosticsSection.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 480 | 444 | 6 | 30 | 25.17 KB |
| 8 | `client/src/lib/mcp-registry/catalog/seed-data.ts` | TypeScript | Client (Next.js / React Web UI) | 446 | 385 | 33 | 28 | 65.01 KB |
| 9 | `client/src/components/chat/MessageList.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 444 | 384 | 10 | 50 | 16.44 KB |
| 10 | `client/src/stores/useChatStore.ts` | TypeScript | Client (Next.js / React Web UI) | 430 | 383 | 2 | 45 | 15.25 KB |
| 11 | `client/src/components/chat/ChatHeader.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 400 | 353 | 2 | 45 | 18.44 KB |
| 12 | `client/src/components/settings/providers/CloudProvidersSection.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 386 | 370 | 0 | 16 | 20.62 KB |
| 13 | `client/src/app/api/mcp/install-code/route.ts` | TypeScript | Client (Next.js / React Web UI) | 375 | 319 | 15 | 41 | 14.56 KB |
| 14 | `client/src/components/chat/InputDock.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 375 | 341 | 0 | 34 | 14.86 KB |
| 15 | `client/src/components/p2p/P2pHostModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 375 | 336 | 4 | 35 | 14.78 KB |
| 16 | `client/src/components/sidebar/Sidebar.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 374 | 338 | 5 | 31 | 13.94 KB |
| 17 | `client/src/components/settings/ProvidersSettingsPanel.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 366 | 343 | 0 | 23 | 13.67 KB |
| 18 | `client/src/components/p2p/client/P2pQrScannerView.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 350 | 326 | 0 | 24 | 16.33 KB |
| 19 | `client/src/components/mcp/McpServerSettingsModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 347 | 328 | 0 | 19 | 20.84 KB |
| 20 | `client/src/components/sidebar/SidebarChatItem.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 346 | 321 | 5 | 20 | 13.71 KB |
| 21 | `client/android/app/src/main/assets/public/index.html` | HTML | Android (Native Java/Gradle/XML) | 343 | 318 | 9 | 16 | 11.09 KB |
| 22 | `client/src/app/api/mcp/download-db/route.ts` | TypeScript | Client (Next.js / React Web UI) | 343 | 295 | 7 | 41 | 11.97 KB |
| 23 | `src/database/connection/generic_sqlite_pool.ts` | TypeScript | Server (Holy Bible MCP Engine) | 335 | 257 | 42 | 36 | 9.21 KB |
| 24 | `client/src/components/mcp/McpDashboard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 322 | 289 | 3 | 30 | 10.67 KB |
| 25 | `client/scripts/real_e2e_cot_diagnostic.ts` | TypeScript | Client (Next.js / React Web UI) | 321 | 266 | 21 | 34 | 16.66 KB |
| 26 | `client/src/lib/ai/on-device/worker-pool/inference-worker-proxy.ts` | TypeScript | Client (Next.js / React Web UI) | 321 | 237 | 41 | 43 | 9.19 KB |
| 27 | `client/src/lib/mcp/routing/UniversalSchemaMapper.ts` | TypeScript | Client (Next.js / React Web UI) | 313 | 254 | 26 | 33 | 11.67 KB |
| 28 | `client/src/lib/p2p/crypto/noble-crypto-suite.ts` | TypeScript | Client (Next.js / React Web UI) | 311 | 201 | 71 | 39 | 9.27 KB |
| 29 | `client/src/lib/storage/indexeddb-chat-adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 311 | 223 | 61 | 27 | 9.73 KB |
| 30 | `client/src/lib/p2p/transport/webrtc-mesh-transport.ts` | TypeScript | Client (Next.js / React Web UI) | 303 | 249 | 11 | 43 | 10.37 KB |
| 31 | `client/src/lib/actions/provider-fetch-models.ts` | TypeScript | Client (Next.js / React Web UI) | 301 | 259 | 5 | 37 | 10.44 KB |
| 32 | `client/src/components/settings/providers/card/LocalProviderPullProgress.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 293 | 265 | 4 | 24 | 12.85 KB |
| 33 | `client/src/hooks/useAudioRecorder.ts` | TypeScript | Client (Next.js / React Web UI) | 288 | 243 | 6 | 39 | 9.49 KB |
| 34 | `client/src/lib/p2p/types.ts` | TypeScript | Client (Next.js / React Web UI) | 286 | 248 | 12 | 26 | 7.03 KB |
| 35 | `client/src/stores/useModelPullStore.ts` | TypeScript | Client (Next.js / React Web UI) | 284 | 254 | 0 | 30 | 9.22 KB |
| 36 | `client/src/components/settings/SettingsModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 283 | 260 | 1 | 22 | 12.72 KB |
| 37 | `client/src/components/chat/message/MessageItem.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 282 | 254 | 2 | 26 | 11.92 KB |
| 38 | `client/src/components/chat/McpActivityIndicator.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 278 | 229 | 23 | 26 | 8.22 KB |
| 39 | `client/src/lib/actions/chat.actions.ts` | TypeScript | Client (Next.js / React Web UI) | 278 | 214 | 22 | 42 | 8.57 KB |
| 40 | `scripts/seed_directives_db.ts` | TypeScript | Core Tooling & Scripts | 272 | 243 | 8 | 21 | 21.7 KB |
| 41 | `client/src/lib/p2p/transports/webrtc-transport.ts` | TypeScript | Client (Next.js / React Web UI) | 270 | 210 | 25 | 35 | 7.82 KB |
| 42 | `client/src/components/chat/AttachmentDock.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 269 | 247 | 1 | 21 | 11.51 KB |
| 43 | `client/src/components/chat/hooks/useChatMessages.ts` | TypeScript | Client (Next.js / React Web UI) | 268 | 223 | 8 | 37 | 10.07 KB |
| 44 | `client/src/stores/useP2pStore.ts` | TypeScript | Client (Next.js / React Web UI) | 268 | 235 | 4 | 29 | 9.37 KB |
| 45 | `src/prompts_repository.ts` | TypeScript | Server (Holy Bible MCP Engine) | 261 | 229 | 2 | 30 | 14.15 KB |
| 46 | `client/src/components/p2p/P2pPairingConfirmModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 260 | 231 | 2 | 27 | 11.79 KB |
| 47 | `client/src/workers/chat-parser.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 260 | 222 | 8 | 30 | 7.79 KB |
| 48 | `client/src/workers/opfs-storage.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 259 | 204 | 18 | 37 | 7.21 KB |
| 49 | `client/src/hooks/useOnDeviceModelManager.ts` | TypeScript | Client (Next.js / React Web UI) | 257 | 229 | 10 | 18 | 7.75 KB |
| 50 | `client/src/components/chat/VoiceAssistantOverlay.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 251 | 214 | 9 | 28 | 9.05 KB |
| 51 | `client/src/components/chat/dock/source/useSourceSelector.ts` | TypeScript | Client (Next.js / React Web UI) | 248 | 218 | 8 | 22 | 9.66 KB |
| 52 | `client/src/workers/p2p-transport.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 246 | 194 | 21 | 31 | 6.67 KB |
| 53 | `client/src/lib/p2p/mesh/gossipsub-mesh-engine.ts` | TypeScript | Client (Next.js / React Web UI) | 244 | 197 | 9 | 38 | 7.15 KB |
| 54 | `client/src/lib/p2p/crypto/mlkem-postquantum-adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 243 | 155 | 47 | 41 | 8.79 KB |
| 55 | `src/database/resilient_downloader.ts` | TypeScript | Server (Holy Bible MCP Engine) | 243 | 193 | 12 | 38 | 8.49 KB |
| 56 | `scripts/verify_full_system.ts` | TypeScript | Core Tooling & Scripts | 238 | 159 | 41 | 38 | 14.82 KB |
| 57 | `src/directives/directives_db_loader.ts` | TypeScript | Server (Holy Bible MCP Engine) | 237 | 210 | 12 | 15 | 8.19 KB |
| 58 | `client/src/components/chat/header/DetailModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 236 | 225 | 0 | 11 | 11.79 KB |
| 59 | `client/src/lib/p2p/mesh/gossipsub-engine.ts` | TypeScript | Client (Next.js / React Web UI) | 233 | 164 | 37 | 32 | 6.47 KB |
| 60 | `client/src/lib/p2p/state/yjs-sync-mesh.ts` | TypeScript | Client (Next.js / React Web UI) | 228 | 164 | 33 | 31 | 6.38 KB |
| 61 | `client/src/lib/parsers/media.parser.ts` | TypeScript | Client (Next.js / React Web UI) | 228 | 180 | 17 | 31 | 7.87 KB |
| 62 | `client/android/app/src/main/java/com/holy/bible/mcp/vision/ui/ScannerOverlayBuilder.java` | Java | Android (Native Java/Gradle/XML) | 226 | 182 | 13 | 31 | 9.17 KB |
| 63 | `client/src/lib/p2p/crypto/ratchet/ratchet-aead-cipher.ts` | TypeScript | Client (Next.js / React Web UI) | 225 | 179 | 19 | 27 | 7.18 KB |
| 64 | `src/token_optimizer/index.ts` | TypeScript | Server (Holy Bible MCP Engine) | 225 | 177 | 21 | 27 | 8.71 KB |
| 65 | `client/src/workers/tensor-quantizer.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 224 | 171 | 21 | 32 | 6.38 KB |
| 66 | `client/src/stores/slices/providerSlice.ts` | TypeScript | Client (Next.js / React Web UI) | 223 | 203 | 0 | 20 | 9.53 KB |
| 67 | `client/src/app/api/verse/route.ts` | TypeScript | Client (Next.js / React Web UI) | 220 | 186 | 8 | 26 | 6.84 KB |
| 68 | `client/src/components/mcp/presets.ts` | TypeScript | Client (Next.js / React Web UI) | 219 | 218 | 0 | 1 | 8.42 KB |
| 69 | `client/src/lib/hardware/fps-meter.ts` | TypeScript | Client (Next.js / React Web UI) | 219 | 155 | 33 | 31 | 7.04 KB |
| 70 | `client/src/lib/mcp/client-storage.ts` | TypeScript | Client (Next.js / React Web UI) | 219 | 179 | 18 | 22 | 7.07 KB |
| 71 | `client/src/workers/hybrid-rag.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 217 | 169 | 15 | 33 | 6.18 KB |
| 72 | `client/android/app/src/main/java/com/holy/bible/mcp/HolyTelemetryPlugin.java` | Java | Android (Native Java/Gradle/XML) | 216 | 190 | 4 | 22 | 10.3 KB |
| 73 | `client/src/lib/diagnostics/inspectors/macos-inspector.ts` | TypeScript | Client (Next.js / React Web UI) | 214 | 180 | 11 | 23 | 9.22 KB |
| 74 | `client/src/lib/ai/on-device/storage/storage-quota.service.ts` | TypeScript | Client (Next.js / React Web UI) | 212 | 183 | 3 | 26 | 7.3 KB |
| 75 | `src/tools/schemas/tool_schemas.ts` | TypeScript | Server (Holy Bible MCP Engine) | 211 | 180 | 0 | 31 | 6.84 KB |
| 76 | `client/src/components/chat/CitationCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 209 | 183 | 1 | 25 | 7.61 KB |
| 77 | `client/src/components/mcp/McpServerEditModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 208 | 192 | 0 | 16 | 8.96 KB |
| 78 | `client/src/components/p2p/host/P2pHostGovernor.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 208 | 197 | 0 | 11 | 10.37 KB |
| 79 | `client/src/lib/mcp/cache/LruTtlCache.ts` | TypeScript | Client (Next.js / React Web UI) | 208 | 174 | 11 | 23 | 5.21 KB |
| 80 | `client/src/lib/diagnostics/inspectors/linux-inspector.ts` | TypeScript | Client (Next.js / React Web UI) | 207 | 174 | 9 | 24 | 7.53 KB |
| 81 | `scripts/migrate_sqlite_directives.ts` | TypeScript | Core Tooling & Scripts | 207 | 176 | 8 | 23 | 22.69 KB |
| 82 | `client/src/components/chat/header/hooks/useHeaderMcpData.ts` | TypeScript | Client (Next.js / React Web UI) | 206 | 183 | 0 | 23 | 8.82 KB |
| 83 | `client/src/components/chat/ChatView.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 204 | 181 | 0 | 23 | 7.92 KB |
| 84 | `src/graph/theological_graphology_engine.ts` | TypeScript | Server (Holy Bible MCP Engine) | 204 | 183 | 2 | 19 | 6.7 KB |
| 85 | `client/src/components/chat/renderer/segment-parser.ts` | TypeScript | Client (Next.js / React Web UI) | 203 | 170 | 8 | 25 | 6.87 KB |
| 86 | `client/src/components/settings/providers/CloudProviderModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 203 | 189 | 0 | 14 | 8.52 KB |
| 87 | `client/src/lib/mcp/disk-analyzer.ts` | TypeScript | Client (Next.js / React Web UI) | 201 | 155 | 15 | 31 | 5.77 KB |
| 88 | `client/src/lib/p2p/mesh/kademlia-dht.ts` | TypeScript | Client (Next.js / React Web UI) | 201 | 143 | 33 | 25 | 6.01 KB |
| 89 | `client/android/app/src/main/java/com/holy/bible/mcp/HolyVisionPlugin.java` | Java | Android (Native Java/Gradle/XML) | 199 | 170 | 6 | 23 | 6.57 KB |
| 90 | `client/src/lib/mcp-registry/catalog/productivity.ts` | TypeScript | Client (Next.js / React Web UI) | 199 | 198 | 0 | 1 | 6.02 KB |
| 91 | `client/android/app/src/main/java/com/holy/bible/mcp/HolySpeechPlugin.java` | Java | Android (Native Java/Gradle/XML) | 198 | 170 | 5 | 23 | 6.84 KB |
| 92 | `setup.ts` | TypeScript | Root / Shared | 198 | 162 | 11 | 25 | 7.18 KB |
| 93 | `client/src/lib/ai/on-device/workers/opfs-downloader.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 197 | 168 | 1 | 28 | 6.59 KB |
| 94 | `client/src/workers/opfs-downloader.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 197 | 161 | 7 | 29 | 5.91 KB |
| 95 | `src/directives/directive_store.ts` | TypeScript | Server (Holy Bible MCP Engine) | 195 | 160 | 2 | 33 | 6.39 KB |
| 96 | `client/src/lib/ai/on-device/catalog/catalog-matcher.ts` | TypeScript | Client (Next.js / React Web UI) | 194 | 137 | 30 | 27 | 6.31 KB |
| 97 | `client/src/lib/mcp/mcp-manager.ts` | TypeScript | Client (Next.js / React Web UI) | 194 | 171 | 0 | 23 | 6.22 KB |
| 98 | `client/src/lib/models/metadata-fetcher.ts` | TypeScript | Client (Next.js / React Web UI) | 194 | 168 | 3 | 23 | 6.63 KB |
| 99 | `client/src/components/chat/dock/SourceSelectorModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 191 | 177 | 0 | 14 | 7.81 KB |
| 100 | `client/src/lib/ai/streaming/executors/remote-http-stream-executor.ts` | TypeScript | Client (Next.js / React Web UI) | 191 | 170 | 3 | 18 | 6.43 KB |
| 101 | `client/src/components/chat/MetricsCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 190 | 165 | 1 | 24 | 7.71 KB |
| 102 | `client/src/components/chat/dock/source/SourceProviderRow.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 190 | 180 | 2 | 8 | 9.07 KB |
| 103 | `src/resources_repository.ts` | TypeScript | Server (Holy Bible MCP Engine) | 189 | 155 | 20 | 14 | 7.24 KB |
| 104 | `client/src/lib/mcp/lifecycle/heartbeat-monitor.ts` | TypeScript | Client (Next.js / React Web UI) | 188 | 154 | 8 | 26 | 5.62 KB |
| 105 | `src/capabilities/adaptive_budget_engine.ts` | TypeScript | Server (Holy Bible MCP Engine) | 188 | 150 | 14 | 24 | 7.6 KB |
| 106 | `client/src/lib/ai/on-device/workers/webgpu-engine.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 187 | 168 | 1 | 18 | 5.2 KB |
| 107 | `client/src/components/settings/providers/LocalProviderModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 186 | 172 | 0 | 14 | 7.72 KB |
| 108 | `client/src/lib/p2p/sync/yjs-crdt-sync-provider.ts` | TypeScript | Client (Next.js / React Web UI) | 186 | 148 | 13 | 25 | 5.01 KB |
| 109 | `client/src/lib/p2p/telemetry/resource-governor.ts` | TypeScript | Client (Next.js / React Web UI) | 186 | 137 | 23 | 26 | 6.82 KB |
| 110 | `src/tools/handlers/system.handlers.ts` | TypeScript | Server (Holy Bible MCP Engine) | 186 | 174 | 0 | 12 | 6.58 KB |
| 111 | `client/src/lib/mcp/storage/browser-stream-downloader.ts` | TypeScript | Client (Next.js / React Web UI) | 185 | 147 | 10 | 28 | 6.54 KB |
| 112 | `client/src/lib/p2p/transport/host-priority/host-priority-fsm.ts` | TypeScript | Client (Next.js / React Web UI) | 185 | 149 | 19 | 17 | 5.77 KB |
| 113 | `client/src/stores/default-providers.ts` | TypeScript | Client (Next.js / React Web UI) | 185 | 182 | 0 | 3 | 7.05 KB |
| 114 | `client/src/components/p2p/details/NodeTelemetryGrid.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 184 | 174 | 0 | 10 | 7.82 KB |
| 115 | `client/src/lib/hardware/optical/adaptive-optical-engine.ts` | TypeScript | Client (Next.js / React Web UI) | 184 | 141 | 27 | 16 | 5.54 KB |
| 116 | `client/src/components/chat/background/useFluidCanvasRenderer.ts` | TypeScript | Client (Next.js / React Web UI) | 183 | 153 | 1 | 29 | 5.85 KB |
| 117 | `client/src/components/mcp/cards/ServerActionButtons.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 182 | 170 | 0 | 12 | 8.16 KB |
| 118 | `client/src/lib/crypto/encryption.ts` | TypeScript | Client (Next.js / React Web UI) | 182 | 132 | 21 | 29 | 6.22 KB |
| 119 | `client/src/lib/p2p/transport/p2p-worker-bridge.ts` | TypeScript | Client (Next.js / React Web UI) | 181 | 129 | 26 | 26 | 5.05 KB |
| 120 | `client/src/app/api/mcp/delete-code/route.ts` | TypeScript | Client (Next.js / React Web UI) | 180 | 158 | 5 | 17 | 6.56 KB |
| 121 | `client/src/lib/hardware/optical/optical-handoff.service.ts` | TypeScript | Client (Next.js / React Web UI) | 180 | 135 | 27 | 18 | 5.18 KB |
| 122 | `client/src/components/mcp/McpCustomServerTab.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 179 | 159 | 5 | 15 | 6.22 KB |
| 123 | `client/src/hooks/useFileUpload.ts` | TypeScript | Client (Next.js / React Web UI) | 179 | 157 | 2 | 20 | 5.58 KB |
| 124 | `client/src/lib/hardware/client-detector.ts` | TypeScript | Client (Next.js / React Web UI) | 179 | 154 | 9 | 16 | 6.04 KB |
| 125 | `client/src/lib/ai/adapters/ollama.adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 178 | 156 | 3 | 19 | 6.68 KB |
| 126 | `client/src/lib/hardware/network-speed-benchmark.ts` | TypeScript | Client (Next.js / React Web UI) | 178 | 139 | 18 | 21 | 6.46 KB |
| 127 | `client/src/lib/ai/on-device/workers/wasm-engine.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 177 | 151 | 4 | 22 | 5.48 KB |
| 128 | `client/src/lib/p2p/telemetry/host-hardware-collector.ts` | TypeScript | Client (Next.js / React Web UI) | 177 | 154 | 10 | 13 | 6.86 KB |
| 129 | `src/tools/handlers/verse.handlers.ts` | TypeScript | Server (Holy Bible MCP Engine) | 176 | 153 | 3 | 20 | 6.53 KB |
| 130 | `client/src/components/chat/dock/source/SourceModelFilterBar.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 175 | 168 | 0 | 7 | 6.99 KB |
| 131 | `client/src/components/p2p/details/NodePerformanceStats.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 175 | 161 | 1 | 13 | 7.78 KB |
| 132 | `client/src/lib/mcp/lifecycle/capability-inspector.ts` | TypeScript | Client (Next.js / React Web UI) | 175 | 140 | 12 | 23 | 7.58 KB |
| 133 | `client/src/components/providers/ExtensionShield.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 174 | 151 | 4 | 19 | 5.56 KB |
| 134 | `client/src/lib/mcp/process-manager.ts` | TypeScript | Client (Next.js / React Web UI) | 174 | 149 | 2 | 23 | 6.54 KB |
| 135 | `client/src/lib/mcp/routing/NamespacedToolRegistry.ts` | TypeScript | Client (Next.js / React Web UI) | 174 | 135 | 15 | 24 | 5.64 KB |
| 136 | `client/src/lib/mcp-registry/catalog/databases.ts` | TypeScript | Client (Next.js / React Web UI) | 173 | 172 | 0 | 1 | 5.29 KB |
| 137 | `client/src/lib/ai/adapters/anthropic.adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 171 | 149 | 1 | 21 | 5.83 KB |
| 138 | `client/src/lib/mcp-registry/db.ts` | TypeScript | Client (Next.js / React Web UI) | 171 | 141 | 19 | 11 | 5.21 KB |
| 139 | `client/src/lib/mcp/vector-context.ts` | TypeScript | Client (Next.js / React Web UI) | 171 | 127 | 17 | 27 | 5.19 KB |
| 140 | `scripts/audit_blocks_1_to_5.ts` | TypeScript | Core Tooling & Scripts | 171 | 165 | 0 | 6 | 8.53 KB |
| 141 | `client/android/app/src/main/res/drawable/ic_launcher_background.xml` | XML | Android (Native Java/Gradle/XML) | 170 | 170 | 0 | 0 | 5.47 KB |
| 142 | `client/src/components/chat/header/WarmthModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 170 | 158 | 0 | 12 | 6.87 KB |
| 143 | `client/src/components/chat/renderer/markdown-components.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 169 | 162 | 0 | 7 | 8.06 KB |
| 144 | `client/src/lib/p2p/files/opfs-blob-streamer.ts` | TypeScript | Client (Next.js / React Web UI) | 169 | 126 | 21 | 22 | 4.8 KB |
| 145 | `src/scripture_graph_engine.ts` | TypeScript | Server (Holy Bible MCP Engine) | 169 | 135 | 15 | 19 | 6.53 KB |
| 146 | `client/src/app/api/models/pull/route.ts` | TypeScript | Client (Next.js / React Web UI) | 168 | 138 | 9 | 21 | 5.23 KB |
| 147 | `client/src/lib/ai/on-device/catalog/catalog-data.ts` | TypeScript | Client (Next.js / React Web UI) | 168 | 163 | 4 | 1 | 5.35 KB |
| 148 | `client/src/components/audio/AudioMessagePlayer.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 167 | 139 | 9 | 19 | 4.75 KB |
| 149 | `client/src/lib/ai/on-device/storage/opfs-storage.driver.ts` | TypeScript | Client (Next.js / React Web UI) | 167 | 141 | 10 | 16 | 4.52 KB |
| 150 | `client/src/lib/mcp/remote-size-resolver.ts` | TypeScript | Client (Next.js / React Web UI) | 167 | 137 | 17 | 13 | 6.73 KB |
| 151 | `src/database/bible_repository.ts` | TypeScript | Server (Holy Bible MCP Engine) | 167 | 134 | 24 | 9 | 4.69 KB |
| 152 | `client/src/components/chat/dock/PowerSourceSwitcher.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 166 | 155 | 1 | 10 | 7.13 KB |
| 153 | `client/src/lib/ai/adapters/openai-compatible.adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 166 | 145 | 2 | 19 | 6.4 KB |
| 154 | `client/src/stores/p2p/signaling-client.ts` | TypeScript | Client (Next.js / React Web UI) | 165 | 133 | 17 | 15 | 5.02 KB |
| 155 | `client/src/lib/bible/rag/shared-vector-memory.ts` | TypeScript | Client (Next.js / React Web UI) | 164 | 114 | 23 | 27 | 4.95 KB |
| 156 | `client/src/lib/models/model-profiler.ts` | TypeScript | Client (Next.js / React Web UI) | 164 | 139 | 0 | 25 | 5.84 KB |
| 157 | `src/hybrid_search_engine.ts` | TypeScript | Server (Holy Bible MCP Engine) | 164 | 138 | 9 | 17 | 5.27 KB |
| 158 | `client/src/components/settings/profile/AvatarEditor.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 162 | 146 | 0 | 16 | 5.86 KB |
| 159 | `client/src/components/chat/message/MessageTagsHeader.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 161 | 148 | 0 | 13 | 7.23 KB |
| 160 | `client/src/lib/mcp-registry/catalog/devtools.ts` | TypeScript | Client (Next.js / React Web UI) | 160 | 159 | 0 | 1 | 4.86 KB |
| 161 | `client/src/lib/p2p/mesh/failover-manager.ts` | TypeScript | Client (Next.js / React Web UI) | 160 | 116 | 22 | 22 | 4.92 KB |
| 162 | `client/src/components/settings/providers/card/LocalProviderModelList.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 159 | 152 | 1 | 6 | 6.74 KB |
| 163 | `client/src/stores/p2p/services/SignalingEnvelopeDispatcher.ts` | TypeScript | Client (Next.js / React Web UI) | 159 | 140 | 3 | 16 | 5.67 KB |
| 164 | `client/public/wllama/messages.d.ts` | TypeScript | Client (Next.js / React Web UI) | 158 | 158 | 0 | 0 | 4.87 KB |
| 165 | `client/src/lib/ai/on-device/opfs-resilient-downloader.ts` | TypeScript | Client (Next.js / React Web UI) | 158 | 124 | 13 | 21 | 4.96 KB |
| 166 | `client/src/types/settings.ts` | TypeScript | Client (Next.js / React Web UI) | 158 | 126 | 11 | 21 | 6.79 KB |
| 167 | `client/android/app/src/main/java/com/holy/bible/mcp/vision/CameraXSessionController.java` | Java | Android (Native Java/Gradle/XML) | 157 | 134 | 4 | 19 | 6.16 KB |
| 168 | `client/src/lib/p2p/search/hybrid-search-engine.ts` | TypeScript | Client (Next.js / React Web UI) | 157 | 120 | 15 | 22 | 5.37 KB |
| 169 | `client/src/lib/mcp/client-pool/mcp-client-pool.ts` | TypeScript | Client (Next.js / React Web UI) | 156 | 125 | 10 | 21 | 4.23 KB |
| 170 | `client/src/lib/mcp/downloader/chunk-streamer.ts` | TypeScript | Client (Next.js / React Web UI) | 156 | 130 | 7 | 19 | 4.32 KB |
| 171 | `client/src/lib/p2p/crypto/payload-compressor.ts` | TypeScript | Client (Next.js / React Web UI) | 156 | 115 | 24 | 17 | 4.8 KB |
| 172 | `src/morphology/robinson_parser.ts` | TypeScript | Server (Holy Bible MCP Engine) | 156 | 132 | 11 | 13 | 5.55 KB |
| 173 | `src/parallel_corpus_engine.ts` | TypeScript | Server (Holy Bible MCP Engine) | 156 | 120 | 17 | 19 | 5.79 KB |
| 174 | `src/services/online_bible_fallback.ts` | TypeScript | Server (Holy Bible MCP Engine) | 156 | 131 | 7 | 18 | 5.45 KB |
| 175 | `client/src/lib/mcp/extractors/intent-extractor.ts` | TypeScript | Client (Next.js / React Web UI) | 155 | 139 | 5 | 11 | 5.84 KB |
| 176 | `src/database/connection/sqlite_connection_pool.ts` | TypeScript | Server (Holy Bible MCP Engine) | 155 | 120 | 19 | 16 | 5.07 KB |
| 177 | `client/src/lib/models/modality-detector.ts` | TypeScript | Client (Next.js / React Web UI) | 154 | 98 | 27 | 29 | 7.45 KB |
| 178 | `client/src/lib/models/param-size-parser.ts` | TypeScript | Client (Next.js / React Web UI) | 154 | 121 | 14 | 19 | 5.85 KB |
| 179 | `client/src/lib/p2p/mesh/p2p-worker-bridge.ts` | TypeScript | Client (Next.js / React Web UI) | 154 | 127 | 7 | 20 | 3.89 KB |
| 180 | `src/transport/http_health_server.ts` | TypeScript | Server (Holy Bible MCP Engine) | 154 | 130 | 5 | 19 | 5.54 KB |
| 181 | `client/src/components/ui/RadixModalWrapper.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 152 | 123 | 13 | 16 | 4.6 KB |
| 182 | `client/src/lib/hardware/mobile-hardware-profiler.ts` | TypeScript | Client (Next.js / React Web UI) | 152 | 134 | 0 | 18 | 5.17 KB |
| 183 | `client/src/lib/models/budget-calculator.ts` | TypeScript | Client (Next.js / React Web UI) | 152 | 137 | 0 | 15 | 4.74 KB |
| 184 | `client/src/lib/p2p/crypto/traffic-chaffing-scheduler.ts` | TypeScript | Client (Next.js / React Web UI) | 152 | 104 | 24 | 24 | 4.53 KB |
| 185 | `client/src/lib/p2p/orchestrator/p2p-mcp-router.ts` | TypeScript | Client (Next.js / React Web UI) | 152 | 133 | 4 | 15 | 5.14 KB |
| 186 | `src/database/database_downloader.ts` | TypeScript | Server (Holy Bible MCP Engine) | 152 | 122 | 6 | 24 | 5.4 KB |
| 187 | `src/services/language_resolver.ts` | TypeScript | Server (Holy Bible MCP Engine) | 152 | 128 | 5 | 19 | 6.3 KB |
| 188 | `client/scripts/master_e2e_stress_suite.ts` | TypeScript | Client (Next.js / React Web UI) | 151 | 112 | 17 | 22 | 7.36 KB |
| 189 | `client/src/components/p2p/DeviceIdentityCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 149 | 127 | 7 | 15 | 5.74 KB |
| 190 | `client/src/lib/p2p/crypto/qr-decoder/image-filters.ts` | TypeScript | Client (Next.js / React Web UI) | 149 | 117 | 7 | 25 | 4.25 KB |
| 191 | `client/src/lib/mcp/code-detector.ts` | TypeScript | Client (Next.js / React Web UI) | 146 | 119 | 6 | 21 | 6.65 KB |
| 192 | `client/src/components/settings/LocalModelCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 145 | 138 | 0 | 7 | 5.91 KB |
| 193 | `client/src/components/settings/providers/LocalProviderCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 145 | 132 | 1 | 12 | 4.98 KB |
| 194 | `client/src/lib/p2p/transport/host-priority-mutex.ts` | TypeScript | Client (Next.js / React Web UI) | 145 | 92 | 33 | 20 | 4.58 KB |
| 195 | `client/src/lib/p2p/transport/webrtc/IceSessionLifecycle.ts` | TypeScript | Client (Next.js / React Web UI) | 145 | 117 | 6 | 22 | 4.9 KB |
| 196 | `client/src/lib/p2p/transports/ohttp-gateway.ts` | TypeScript | Client (Next.js / React Web UI) | 145 | 102 | 21 | 22 | 4.34 KB |
| 197 | `client/src/components/mcp/McpPredefinedCatalogTab.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 144 | 126 | 6 | 12 | 5.1 KB |
| 198 | `client/src/lib/actions/provider-inspect-model.ts` | TypeScript | Client (Next.js / React Web UI) | 144 | 124 | 10 | 10 | 5.84 KB |
| 199 | `client/src/lib/actions/provider-ping.ts` | TypeScript | Client (Next.js / React Web UI) | 144 | 125 | 4 | 15 | 4.35 KB |
| 200 | `client/src/lib/p2p/crypto/pq-hybrid-ratchet.ts` | TypeScript | Client (Next.js / React Web UI) | 143 | 102 | 20 | 21 | 5.27 KB |
| 201 | `client/src/lib/ai/streaming/chat-stream-client.ts` | TypeScript | Client (Next.js / React Web UI) | 142 | 117 | 11 | 14 | 4.4 KB |
| 202 | `client/src/workers/qr-scanner.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 142 | 104 | 22 | 16 | 4.04 KB |
| 203 | `client/src/components/p2p/P2pJoinModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 141 | 122 | 6 | 13 | 5.73 KB |
| 204 | `client/src/lib/mcp-registry/npm-search.ts` | TypeScript | Client (Next.js / React Web UI) | 141 | 115 | 8 | 18 | 6.73 KB |
| 205 | `client/src/components/chat/RichTextRenderer.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 140 | 121 | 1 | 18 | 5.34 KB |
| 206 | `client/src/components/chat/export/ExportChatModal.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 140 | 129 | 0 | 11 | 6.32 KB |
| 207 | `client/src/lib/ai/on-device/on-device-engine.service.ts` | TypeScript | Client (Next.js / React Web UI) | 140 | 111 | 7 | 22 | 4.14 KB |
| 208 | `client/src/lib/mcp/lifecycle/security-sandbox.ts` | TypeScript | Client (Next.js / React Web UI) | 140 | 102 | 22 | 16 | 4.5 KB |
| 209 | `client/src/components/chat/EmptyState.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 139 | 124 | 0 | 15 | 7.1 KB |
| 210 | `client/src/components/settings/providers/OnDeviceStorageQuota.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 139 | 125 | 0 | 14 | 5.87 KB |
| 211 | `client/src/lib/ai/streaming/unified-transient-stream-store.ts` | TypeScript | Client (Next.js / React Web UI) | 139 | 113 | 9 | 17 | 4.18 KB |
| 212 | `client/src/workers/camera-optical.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 139 | 110 | 15 | 14 | 4.13 KB |
| 213 | `client/src/components/chat/header/warmth/WarmthSliderControl.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 138 | 129 | 0 | 9 | 6.08 KB |
| 214 | `client/src/lib/ai/adapters/gemini.adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 138 | 120 | 0 | 18 | 5.12 KB |
| 215 | `client/src/lib/ai/on-device/catalog/dynamic-model-resolver.ts` | TypeScript | Client (Next.js / React Web UI) | 138 | 122 | 3 | 13 | 5.36 KB |
| 216 | `client/src/lib/mcp/routing/SmartIntentRouter.ts` | TypeScript | Client (Next.js / React Web UI) | 138 | 110 | 12 | 16 | 5.17 KB |
| 217 | `client/src/lib/p2p/crypto/qr-decoder/decoder-pipeline.ts` | TypeScript | Client (Next.js / React Web UI) | 138 | 106 | 13 | 19 | 5.72 KB |
| 218 | `client/src/lib/p2p/transports/confer-transport.ts` | TypeScript | Client (Next.js / React Web UI) | 138 | 114 | 9 | 15 | 3.98 KB |
| 219 | `client/src/stores/slices/provider/cloudProviderSlice.ts` | TypeScript | Client (Next.js / React Web UI) | 138 | 123 | 0 | 15 | 5.46 KB |
| 220 | `client/src/app/api/mcp/route.ts` | TypeScript | Client (Next.js / React Web UI) | 137 | 119 | 5 | 13 | 4.95 KB |
| 221 | `client/src/lib/mcp/dynamic-mcp-inspector.ts` | TypeScript | Client (Next.js / React Web UI) | 137 | 109 | 16 | 12 | 4.37 KB |
| 222 | `client/src/lib/mcp/mcp-cli-parser.ts` | TypeScript | Client (Next.js / React Web UI) | 137 | 112 | 11 | 14 | 4.84 KB |
| 223 | `client/src/stores/useTransientStreamStore.ts` | TypeScript | Client (Next.js / React Web UI) | 137 | 119 | 6 | 12 | 3.4 KB |
| 224 | `client/src/stores/p2p/slices/identity.slice.ts` | TypeScript | Client (Next.js / React Web UI) | 136 | 114 | 0 | 22 | 4.26 KB |
| 225 | `client/src/lib/mcp-registry/catalog/search.ts` | TypeScript | Client (Next.js / React Web UI) | 134 | 133 | 0 | 1 | 4.05 KB |
| 226 | `client/src/lib/p2p/protocol-standards.ts` | TypeScript | Client (Next.js / React Web UI) | 134 | 104 | 19 | 11 | 4.81 KB |
| 227 | `client/src/lib/ai/stream/stream-transformer.ts` | TypeScript | Client (Next.js / React Web UI) | 133 | 114 | 0 | 19 | 4.63 KB |
| 228 | `client/src/lib/mcp/routing/MultiTurnToolOrchestrator.ts` | TypeScript | Client (Next.js / React Web UI) | 133 | 105 | 11 | 17 | 4.51 KB |
| 229 | `client/src/lib/p2p/inference/tensor-quantizer.ts` | TypeScript | Client (Next.js / React Web UI) | 133 | 99 | 14 | 20 | 4.17 KB |
| 230 | `client/src/lib/parsers/image.parser.ts` | TypeScript | Client (Next.js / React Web UI) | 133 | 108 | 8 | 17 | 4.4 KB |
| 231 | `client/src/lib/ai/on-device/webgpu-engine.service.ts` | TypeScript | Client (Next.js / React Web UI) | 132 | 101 | 10 | 21 | 3.78 KB |
| 232 | `scripts/audit_blocks_1_to_4.ts` | TypeScript | Core Tooling & Scripts | 132 | 125 | 0 | 7 | 6.38 KB |
| 233 | `src/tools/handlers/search.handlers.ts` | TypeScript | Server (Holy Bible MCP Engine) | 132 | 117 | 0 | 15 | 4.54 KB |
| 234 | `client/src/components/p2p/client/P2pPairedNodesList.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 131 | 123 | 0 | 8 | 6.23 KB |
| 235 | `client/src/lib/mcp/registry-store.ts` | TypeScript | Client (Next.js / React Web UI) | 131 | 111 | 0 | 20 | 4.26 KB |
| 236 | `src/database/integrity_checker.ts` | TypeScript | Server (Holy Bible MCP Engine) | 131 | 106 | 9 | 16 | 4.38 KB |
| 237 | `client/src/lib/utils/CrossPlatformPath.ts` | TypeScript | Client (Next.js / React Web UI) | 130 | 86 | 32 | 12 | 4.16 KB |
| 238 | `scripts/verify_v2.ts` | TypeScript | Core Tooling & Scripts | 130 | 96 | 6 | 28 | 7.11 KB |
| 239 | `client/src/components/mcp/hooks/useMcpRuntimeEnvironment.ts` | TypeScript | Client (Next.js / React Web UI) | 129 | 110 | 1 | 18 | 4.34 KB |
| 240 | `client/src/components/sidebar/SidebarUserCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 129 | 116 | 2 | 11 | 4.85 KB |
| 241 | `client/src/stores/p2p/device-detector.ts` | TypeScript | Client (Next.js / React Web UI) | 129 | 114 | 3 | 12 | 5.02 KB |
| 242 | `src/workers/integrity_worker.ts` | TypeScript | Server (Holy Bible MCP Engine) | 129 | 118 | 0 | 11 | 4.33 KB |
| 243 | `client/src/components/p2p/WebGpuTelemetryHud.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 128 | 103 | 3 | 22 | 3.93 KB |
| 244 | `client/src/lib/p2p/identity/device-identity.ts` | TypeScript | Client (Next.js / React Web UI) | 128 | 82 | 32 | 14 | 4.55 KB |
| 245 | `client/src/components/p2p/P2pMeshTelemetryHud.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 127 | 107 | 6 | 14 | 5.93 KB |
| 246 | `client/src/lib/p2p/engines/universal-engine-manager.ts` | TypeScript | Client (Next.js / React Web UI) | 127 | 89 | 17 | 21 | 3.66 KB |
| 247 | `client/src/lib/p2p/files/p2p-blob-streamer.ts` | TypeScript | Client (Next.js / React Web UI) | 127 | 100 | 11 | 16 | 3.99 KB |
| 248 | `client/src/lib/p2p/mesh/qos-router.ts` | TypeScript | Client (Next.js / React Web UI) | 127 | 84 | 21 | 22 | 4.53 KB |
| 249 | `client/src/lib/p2p/transport/p2p-transport.service.ts` | TypeScript | Client (Next.js / React Web UI) | 127 | 103 | 5 | 19 | 3.39 KB |
| 250 | `client/src/lib/fps-governor.ts` | TypeScript | Client (Next.js / React Web UI) | 126 | 103 | 5 | 18 | 3.9 KB |
| 251 | `client/src/lib/mcp/engine/aggregation-engine.ts` | TypeScript | Client (Next.js / React Web UI) | 126 | 111 | 0 | 15 | 5.13 KB |
| 252 | `client/src/stores/chat/useTransientStreamStore.ts` | TypeScript | Client (Next.js / React Web UI) | 126 | 112 | 0 | 14 | 3.26 KB |
| 253 | `client/src/lib/mcp/context-aggregator.ts` | TypeScript | Client (Next.js / React Web UI) | 125 | 113 | 4 | 8 | 4.69 KB |
| 254 | `client/src/lib/mcp/verse-sanitizer.ts` | TypeScript | Client (Next.js / React Web UI) | 125 | 108 | 1 | 16 | 3.88 KB |
| 255 | `client/src/components/p2p/host/P2pConnectedGuestsList.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 124 | 118 | 0 | 6 | 5.96 KB |
| 256 | `client/src/hooks/useOptimisticMcpToggle.ts` | TypeScript | Client (Next.js / React Web UI) | 124 | 93 | 16 | 15 | 4.19 KB |
| 257 | `client/src/lib/ai/on-device/hooks/useWebGpuChatEngine.ts` | TypeScript | Client (Next.js / React Web UI) | 124 | 103 | 10 | 11 | 3.57 KB |
| 258 | `client/src/lib/p2p/transport/binary-framing.ts` | TypeScript | Client (Next.js / React Web UI) | 124 | 83 | 27 | 14 | 3.88 KB |
| 259 | `client/src/components/ui/icon-registry.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 123 | 121 | 0 | 2 | 1.52 KB |
| 260 | `client/src/lib/ai/on-device/streaming-thought-fsm.ts` | TypeScript | Client (Next.js / React Web UI) | 123 | 94 | 15 | 14 | 3.22 KB |
| 261 | `client/src/components/sidebar/NavItem.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 122 | 115 | 0 | 7 | 4.94 KB |
| 262 | `src/vector_context/markdown_semantic_splitter.ts` | TypeScript | Server (Holy Bible MCP Engine) | 122 | 90 | 15 | 17 | 3.63 KB |
| 263 | `client/src/app/api/p2p/signal/route.ts` | TypeScript | Client (Next.js / React Web UI) | 121 | 101 | 4 | 16 | 3.2 KB |
| 264 | `client/src/components/chat/dock/source/ModelCardItem.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 121 | 116 | 0 | 5 | 5.39 KB |
| 265 | `client/src/components/settings/providers/card/LocalProviderHeader.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 121 | 116 | 0 | 5 | 5.01 KB |
| 266 | `client/src/lib/ai/core/pipeline/stream-execution-pipeline.ts` | TypeScript | Client (Next.js / React Web UI) | 121 | 110 | 0 | 11 | 3.71 KB |
| 267 | `client/src/lib/ai/on-device/types.ts` | TypeScript | Client (Next.js / React Web UI) | 121 | 106 | 7 | 8 | 3.94 KB |
| 268 | `src/morphology/interlinear_builder.ts` | TypeScript | Server (Holy Bible MCP Engine) | 121 | 103 | 7 | 11 | 4.93 KB |
| 269 | `client/src/app/api/mcp/registry/route.ts` | TypeScript | Client (Next.js / React Web UI) | 120 | 101 | 7 | 12 | 3.44 KB |
| 270 | `client/src/components/chat/dock/useAutoDiscovery.ts` | TypeScript | Client (Next.js / React Web UI) | 120 | 106 | 2 | 12 | 5.19 KB |
| 271 | `client/src/lib/models/budget-governor.ts` | TypeScript | Client (Next.js / React Web UI) | 119 | 92 | 15 | 12 | 3.14 KB |
| 272 | `src/capabilities/model_param_extractor.ts` | TypeScript | Server (Holy Bible MCP Engine) | 119 | 93 | 12 | 14 | 4.56 KB |
| 273 | `client/src/components/chat/dock/source/SourceModelCardGrid.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 118 | 110 | 1 | 7 | 4.77 KB |
| 274 | `client/src/lib/p2p/orchestrator/p2p-remote-provider.adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 118 | 100 | 5 | 13 | 4.06 KB |
| 275 | `client/src/db/statements.ts` | TypeScript | Client (Next.js / React Web UI) | 117 | 92 | 9 | 16 | 3.63 KB |
| 276 | `client/src/lib/chat/export-chat.ts` | TypeScript | Client (Next.js / React Web UI) | 117 | 100 | 0 | 17 | 3.93 KB |
| 277 | `client/src/lib/hardware/telemetry/BatteryTelemetryCollector.ts` | TypeScript | Client (Next.js / React Web UI) | 117 | 103 | 4 | 10 | 4.03 KB |
| 278 | `client/src/app/api/mcp/open-folder/route.ts` | TypeScript | Client (Next.js / React Web UI) | 116 | 93 | 8 | 15 | 4.43 KB |
| 279 | `client/src/components/chat/dock/source/SourceP2PBanner.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 116 | 106 | 0 | 10 | 5.68 KB |
| 280 | `src/tools/handlers/ask_holy_bible.handler.ts` | TypeScript | Server (Holy Bible MCP Engine) | 116 | 95 | 2 | 19 | 5.11 KB |
| 281 | `client/src/components/chat/renderer/rehype-safe-html.ts` | TypeScript | Client (Next.js / React Web UI) | 115 | 84 | 14 | 17 | 3.43 KB |
| 282 | `client/src/lib/ai/stream/reasoning-tag-fsm.ts` | TypeScript | Client (Next.js / React Web UI) | 115 | 92 | 10 | 13 | 3.96 KB |
| 283 | `client/src/lib/p2p/crypto/key-exchange.ts` | TypeScript | Client (Next.js / React Web UI) | 115 | 80 | 21 | 14 | 3.59 KB |
| 284 | `client/src/lib/p2p/transport/lockfree-ringbuffer.ts` | TypeScript | Client (Next.js / React Web UI) | 115 | 75 | 21 | 19 | 4.23 KB |
| 285 | `src/tools/index.ts` | TypeScript | Server (Holy Bible MCP Engine) | 115 | 101 | 6 | 8 | 4.02 KB |
| 286 | `client/src/lib/ai/core/error-guidance.ts` | TypeScript | Client (Next.js / React Web UI) | 114 | 91 | 1 | 22 | 11.85 KB |
| 287 | `client/src/lib/ai/core/orchestrator.ts` | TypeScript | Client (Next.js / React Web UI) | 114 | 101 | 0 | 13 | 4.63 KB |
| 288 | `client/src/stores/p2p/services/p2p-telemetry.service.ts` | TypeScript | Client (Next.js / React Web UI) | 114 | 99 | 1 | 14 | 4.28 KB |
| 289 | `src/morphology/hebrew_parser.ts` | TypeScript | Server (Holy Bible MCP Engine) | 114 | 91 | 6 | 17 | 4.3 KB |
| 290 | `client/src/components/settings/UserProfileSection.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 113 | 98 | 0 | 15 | 3.93 KB |
| 291 | `client/src/stores/slices/mcpSlice.ts` | TypeScript | Client (Next.js / React Web UI) | 113 | 97 | 3 | 13 | 4.01 KB |
| 292 | `client/src/db/index.ts` | TypeScript | Client (Next.js / React Web UI) | 112 | 93 | 5 | 14 | 4.5 KB |
| 293 | `client/src/lib/p2p/storage/orama-vector-db.ts` | TypeScript | Client (Next.js / React Web UI) | 112 | 80 | 14 | 18 | 2.95 KB |
| 294 | `client/src/stores/slices/provider/localProviderSlice.ts` | TypeScript | Client (Next.js / React Web UI) | 112 | 100 | 0 | 12 | 4.36 KB |
| 295 | `client/src/lib/ai/on-device/storage-manager.ts` | TypeScript | Client (Next.js / React Web UI) | 111 | 87 | 7 | 17 | 3.82 KB |
| 296 | `client/src/lib/models/pull/ModelPullEngine.ts` | TypeScript | Client (Next.js / React Web UI) | 111 | 98 | 0 | 13 | 3.83 KB |
| 297 | `client/src/lib/p2p/engines/model-metadata-normalizer.ts` | TypeScript | Client (Next.js / React Web UI) | 111 | 88 | 13 | 10 | 4.01 KB |
| 298 | `client/src/lib/models/adaptive-controller.ts` | TypeScript | Client (Next.js / React Web UI) | 110 | 91 | 0 | 19 | 3.95 KB |
| 299 | `client/src/lib/models/prompt-complexity-estimator.ts` | TypeScript | Client (Next.js / React Web UI) | 110 | 74 | 23 | 13 | 4.97 KB |
| 300 | `client/src/components/audio/AudioWaveformCanvas.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 108 | 84 | 8 | 16 | 3.08 KB |
| 301 | `client/src/lib/ai/on-device/polyfills/cache-storage.polyfill.ts` | TypeScript | Client (Next.js / React Web UI) | 107 | 83 | 9 | 15 | 3.18 KB |
| 302 | `client/src/lib/p2p/mobile/spatial-handoff-bus.ts` | TypeScript | Client (Next.js / React Web UI) | 107 | 84 | 10 | 13 | 3.21 KB |
| 303 | `client/src/components/mcp/cards/ServerStatusBadge.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 106 | 93 | 5 | 8 | 5.14 KB |
| 304 | `client/src/lib/ai/streaming/chat-stream-orchestrator.ts` | TypeScript | Client (Next.js / React Web UI) | 106 | 97 | 0 | 9 | 3.78 KB |
| 305 | `client/src/lib/p2p/inference/speculative-decoding-engine.ts` | TypeScript | Client (Next.js / React Web UI) | 106 | 73 | 18 | 15 | 3.82 KB |
| 306 | `client/src/components/settings/local-providers/LocalHardwareMonitor.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 105 | 87 | 6 | 12 | 3.12 KB |
| 307 | `client/src/lib/mcp/resolvers/runtime-resolver.ts` | TypeScript | Client (Next.js / React Web UI) | 105 | 88 | 4 | 13 | 3.89 KB |
| 308 | `src/cli/progress_bar.ts` | TypeScript | Server (Holy Bible MCP Engine) | 105 | 90 | 0 | 15 | 3.46 KB |
| 309 | `client/src/lib/mcp-registry/index.ts` | TypeScript | Client (Next.js / React Web UI) | 104 | 77 | 12 | 15 | 3.76 KB |
| 310 | `client/src/lib/media.ts` | TypeScript | Client (Next.js / React Web UI) | 104 | 68 | 21 | 15 | 3.58 KB |
| 311 | `client/android/app/src/main/java/com/holy/bible/mcp/P2PForegroundService.java` | Java | Android (Native Java/Gradle/XML) | 103 | 85 | 3 | 15 | 3.72 KB |
| 312 | `client/src/components/chat/ScrollToBottomPill.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 103 | 93 | 1 | 9 | 4.26 KB |
| 313 | `client/src/lib/ai/chat/jinja-chat-template.service.ts` | TypeScript | Client (Next.js / React Web UI) | 103 | 89 | 4 | 10 | 3.25 KB |
| 314 | `client/src/lib/hardware/speech/speech-synthesis.service.ts` | TypeScript | Client (Next.js / React Web UI) | 103 | 75 | 14 | 14 | 3.01 KB |
| 315 | `client/src/lib/p2p/state/hlc-clock.ts` | TypeScript | Client (Next.js / React Web UI) | 102 | 68 | 21 | 13 | 2.77 KB |
| 316 | `src/formatting.ts` | TypeScript | Server (Holy Bible MCP Engine) | 102 | 64 | 27 | 11 | 3.48 KB |
| 317 | `client/src/components/mcp/dashboard/McpToolCatalog.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 101 | 92 | 0 | 9 | 3.81 KB |
| 318 | `client/src/lib/diagnostics/diagnostics-service.ts` | TypeScript | Client (Next.js / React Web UI) | 101 | 91 | 0 | 10 | 3.91 KB |
| 319 | `src/utils/cross_platform_path.ts` | TypeScript | Server (Holy Bible MCP Engine) | 101 | 64 | 24 | 13 | 3.05 KB |
| 320 | `src/workers/piscina_worker_pool.ts` | TypeScript | Server (Holy Bible MCP Engine) | 101 | 91 | 2 | 8 | 3.02 KB |
| 321 | `client/src/components/sidebar/SidebarChatActionMenu.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 100 | 89 | 5 | 6 | 3.97 KB |
| 322 | `client/src/lib/p2p/crypto/post-quantum-suite.ts` | TypeScript | Client (Next.js / React Web UI) | 100 | 66 | 21 | 13 | 3.08 KB |
| 323 | `client/src/lib/p2p/crypto/primitives/aes-gcm.ts` | TypeScript | Client (Next.js / React Web UI) | 100 | 91 | 4 | 5 | 3.29 KB |
| 324 | `client/src/lib/p2p/transport/mobile-lifecycle-guard.ts` | TypeScript | Client (Next.js / React Web UI) | 100 | 69 | 13 | 18 | 2.95 KB |
| 325 | `client/src/lib/p2p/workers/crypto-pipeline.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 100 | 84 | 5 | 11 | 2.62 KB |
| 326 | `client/src/stores/sqlite-sync-adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 100 | 88 | 4 | 8 | 3.3 KB |
| 327 | `src/directives/repositories/theology_repository.ts` | TypeScript | Server (Holy Bible MCP Engine) | 100 | 89 | 0 | 11 | 2.91 KB |
| 328 | `client/scripts/verify_i18n.ts` | TypeScript | Client (Next.js / React Web UI) | 99 | 82 | 1 | 16 | 3.64 KB |
| 329 | `client/src/components/settings/providers/ProvidersHeaderFilter.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 99 | 93 | 0 | 6 | 4.14 KB |
| 330 | `client/src/lib/mcp/lifecycle/orphan-sweeper.ts` | TypeScript | Client (Next.js / React Web UI) | 99 | 80 | 9 | 10 | 2.93 KB |
| 331 | `src/cli/index.ts` | TypeScript | Server (Holy Bible MCP Engine) | 99 | 78 | 6 | 15 | 3.11 KB |
| 332 | `client/src/components/chat/ChatMessagesContainer.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 98 | 82 | 6 | 10 | 3.05 KB |
| 333 | `client/src/components/sidebar/MobileSidebarDrawer.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 98 | 87 | 2 | 9 | 3.16 KB |
| 334 | `client/src/lib/bible/osis-map.ts` | TypeScript | Client (Next.js / React Web UI) | 98 | 80 | 2 | 16 | 3.41 KB |
| 335 | `client/src/lib/p2p/mesh/backpressure-controller.ts` | TypeScript | Client (Next.js / React Web UI) | 98 | 70 | 15 | 13 | 2.7 KB |
| 336 | `client/src/stores/chat/chat-message.store.ts` | TypeScript | Client (Next.js / React Web UI) | 98 | 77 | 7 | 14 | 3.12 KB |
| 337 | `client/src/lib/ai/core/mcp-context-bridge.ts` | TypeScript | Client (Next.js / React Web UI) | 97 | 84 | 0 | 13 | 4.34 KB |
| 338 | `src/tools/handlers/ask_holy_bible/prompt_context_composer.ts` | TypeScript | Server (Holy Bible MCP Engine) | 96 | 84 | 0 | 12 | 3.78 KB |
| 339 | `client/src/components/mcp/dashboard/McpConfigDrawer.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 95 | 86 | 0 | 9 | 3.52 KB |
| 340 | `client/src/components/settings/local-providers/LocalModelPicker.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 95 | 83 | 6 | 6 | 3.76 KB |
| 341 | `client/src/components/sidebar/SidebarSearchResults.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 95 | 89 | 0 | 6 | 3.86 KB |
| 342 | `client/src/lib/ai/providers/anthropic-ai-adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 95 | 79 | 5 | 11 | 2.49 KB |
| 343 | `client/src/lib/mcp/resolvers/runtime/NpxRuntimeResolver.ts` | TypeScript | Client (Next.js / React Web UI) | 95 | 85 | 0 | 10 | 3.39 KB |
| 344 | `client/src/lib/mcp/routing/McpArchitectureV2Integration.ts` | TypeScript | Client (Next.js / React Web UI) | 95 | 67 | 12 | 16 | 3.04 KB |
| 345 | `client/src/app/api/chats/route.ts` | TypeScript | Client (Next.js / React Web UI) | 94 | 83 | 2 | 9 | 2.88 KB |
| 346 | `client/src/components/chat/dock/source/SourceChannelTabs.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 94 | 87 | 0 | 7 | 3.94 KB |
| 347 | `client/src/components/sidebar/SidebarSearchInput.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 94 | 87 | 0 | 7 | 4.34 KB |
| 348 | `client/src/lib/ai/on-device/prompt/prompt-formatters.ts` | TypeScript | Client (Next.js / React Web UI) | 94 | 72 | 15 | 7 | 2.66 KB |
| 349 | `client/src/components/settings/providers/local/P2pMeshStatusBanner.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 93 | 85 | 0 | 8 | 4.61 KB |
| 350 | `client/src/components/sidebar/SidebarVirtualChatList.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 93 | 82 | 5 | 6 | 3.21 KB |
| 351 | `client/src/lib/ai/on-device/gpu-recovery-handler.ts` | TypeScript | Client (Next.js / React Web UI) | 93 | 65 | 13 | 15 | 2.7 KB |
| 352 | `client/src/lib/ai/on-device/universal-on-device-engine.ts` | TypeScript | Client (Next.js / React Web UI) | 93 | 68 | 10 | 15 | 2.82 KB |
| 353 | `client/src/lib/hardware-engine.ts` | TypeScript | Client (Next.js / React Web UI) | 93 | 69 | 11 | 13 | 3.76 KB |
| 354 | `client/src/lib/mcp/types.ts` | TypeScript | Client (Next.js / React Web UI) | 93 | 87 | 0 | 6 | 2.14 KB |
| 355 | `client/src/lib/p2p/transport/host-priority/lease-expiry-coordinator.ts` | TypeScript | Client (Next.js / React Web UI) | 93 | 74 | 6 | 13 | 2.82 KB |
| 356 | `client/src/components/chat/renderer/ThinkingWidget.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 92 | 84 | 0 | 8 | 3.77 KB |
| 357 | `client/src/components/p2p/details/NodeSecurityCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 92 | 86 | 0 | 6 | 4.61 KB |
| 358 | `client/src/lib/ai/on-device/storage/storage-cleaner.ts` | TypeScript | Client (Next.js / React Web UI) | 92 | 76 | 7 | 9 | 3.14 KB |
| 359 | `client/src/lib/hardware/telemetry/NetworkTelemetryCollector.ts` | TypeScript | Client (Next.js / React Web UI) | 92 | 83 | 0 | 9 | 2.8 KB |
| 360 | `client/src/lib/p2p/identity/SessionTicketManager.ts` | TypeScript | Client (Next.js / React Web UI) | 92 | 81 | 0 | 11 | 2.58 KB |
| 361 | `client/android/app/src/main/java/com/holy/bible/mcp/vision/ui/FlipButtonView.java` | Java | Android (Native Java/Gradle/XML) | 91 | 69 | 7 | 15 | 3.26 KB |
| 362 | `client/src/components/p2p/host/P2pHostQrCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 91 | 84 | 0 | 7 | 3.62 KB |
| 363 | `client/src/lib/hardware/tab-lifecycle-governor.ts` | TypeScript | Client (Next.js / React Web UI) | 91 | 67 | 13 | 11 | 3.72 KB |
| 364 | `client/src/lib/p2p/privacy/surrogate-anonymizer.ts` | TypeScript | Client (Next.js / React Web UI) | 91 | 59 | 20 | 12 | 3.05 KB |
| 365 | `client/android/app/src/main/java/com/holy/bible/mcp/HolyDeviceIdentityPlugin.java` | Java | Android (Native Java/Gradle/XML) | 90 | 75 | 3 | 12 | 3.15 KB |
| 366 | `client/src/components/p2p/client/P2pManualConnect.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 90 | 83 | 0 | 7 | 3.42 KB |
| 367 | `client/src/components/settings/providers/local/PairedPeersListCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 90 | 83 | 0 | 7 | 3.83 KB |
| 368 | `client/src/components/sidebar/sidebar-utils.ts` | TypeScript | Client (Next.js / React Web UI) | 90 | 77 | 4 | 9 | 2.83 KB |
| 369 | `client/src/lib/ai/core/prompt-composer.ts` | TypeScript | Client (Next.js / React Web UI) | 90 | 67 | 11 | 12 | 3.57 KB |
| 370 | `client/src/lib/diagnostics/inspectors/windows-inspector.ts` | TypeScript | Client (Next.js / React Web UI) | 90 | 78 | 2 | 10 | 3.48 KB |
| 371 | `client/src/lib/native/barcode-scanner.service.ts` | TypeScript | Client (Next.js / React Web UI) | 90 | 61 | 18 | 11 | 2.59 KB |
| 372 | `client/src/lib/p2p/crypto/qr-decoder/pyramid-scaler.ts` | TypeScript | Client (Next.js / React Web UI) | 90 | 69 | 8 | 13 | 2.98 KB |
| 373 | `client/android/app/src/main/java/com/holy/bible/mcp/vision/ui/HudReticleView.java` | Java | Android (Native Java/Gradle/XML) | 89 | 71 | 7 | 11 | 2.91 KB |
| 374 | `client/src/lib/mcp/wasm-loader.ts` | TypeScript | Client (Next.js / React Web UI) | 89 | 73 | 7 | 9 | 3.23 KB |
| 375 | `src/search/minisearch_fallback_engine.ts` | TypeScript | Server (Holy Bible MCP Engine) | 89 | 80 | 0 | 9 | 4.15 KB |
| 376 | `client/src/components/mcp/McpServerListGrid.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 88 | 84 | 0 | 4 | 3.21 KB |
| 377 | `client/src/components/mcp/dashboard/McpServerGrid.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 88 | 84 | 0 | 4 | 3.19 KB |
| 378 | `client/src/components/sidebar/SidebarHeader.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 88 | 75 | 7 | 6 | 3.37 KB |
| 379 | `client/src/lib/mcp/lifecycle/server-cleaner.ts` | TypeScript | Client (Next.js / React Web UI) | 88 | 80 | 0 | 8 | 3.04 KB |
| 380 | `client/src/lib/p2p/crypto/qr-generator.ts` | TypeScript | Client (Next.js / React Web UI) | 88 | 60 | 16 | 12 | 2.73 KB |
| 381 | `client/src/components/chat/dock/InputDockActionButtons.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 87 | 80 | 0 | 7 | 2.71 KB |
| 382 | `client/src/lib/actions/settings.actions.ts` | TypeScript | Client (Next.js / React Web UI) | 87 | 66 | 8 | 13 | 2.83 KB |
| 383 | `client/src/lib/ai/providers/openai-ai-adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 87 | 72 | 5 | 10 | 2.19 KB |
| 384 | `src/morphology/strongs_etymology_service.ts` | TypeScript | Server (Holy Bible MCP Engine) | 87 | 67 | 8 | 12 | 3.8 KB |
| 385 | `client/src/components/chat/message/StreamingMessageSlot.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 86 | 74 | 2 | 10 | 3.27 KB |
| 386 | `client/src/lib/models/hardware-calibrator.ts` | TypeScript | Client (Next.js / React Web UI) | 86 | 73 | 0 | 13 | 2.68 KB |
| 387 | `client/src/lib/p2p/crypto/kdf-engine.ts` | TypeScript | Client (Next.js / React Web UI) | 86 | 67 | 9 | 10 | 2.94 KB |
| 388 | `client/src/lib/p2p/mobile/web-push-manager.ts` | TypeScript | Client (Next.js / React Web UI) | 86 | 65 | 11 | 10 | 2.76 KB |
| 389 | `client/src/stores/useSettingsStore.ts` | TypeScript | Client (Next.js / React Web UI) | 86 | 77 | 0 | 9 | 3.46 KB |
| 390 | `client/src/lib/hardware/workers/hardware-profiler.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 85 | 71 | 7 | 7 | 2.62 KB |
| 391 | `client/src/lib/p2p/orchestrator/hybrid-mcp-resolver.ts` | TypeScript | Client (Next.js / React Web UI) | 85 | 61 | 11 | 13 | 2.9 KB |
| 392 | `client/src/lib/parsers/whisper.daemon.ts` | TypeScript | Client (Next.js / React Web UI) | 85 | 61 | 16 | 8 | 2.61 KB |
| 393 | `client/android/app/src/main/java/com/holy/bible/mcp/vision/ui/TorchButtonView.java` | Java | Android (Native Java/Gradle/XML) | 84 | 69 | 3 | 12 | 2.69 KB |
| 394 | `client/src/app/[locale]/page.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 84 | 69 | 5 | 10 | 3.15 KB |
| 395 | `client/src/components/audio/VoiceRecordingOverlay.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 84 | 66 | 9 | 9 | 2.73 KB |
| 396 | `client/src/components/mcp/McpHeaderToolbar.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 84 | 78 | 0 | 6 | 3.05 KB |
| 397 | `client/src/components/settings/SegmentedControl.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 84 | 79 | 0 | 5 | 3.22 KB |
| 398 | `client/src/lib/ai/core/pipeline/mcp-context-resolver.ts` | TypeScript | Client (Next.js / React Web UI) | 84 | 74 | 0 | 10 | 3.09 KB |
| 399 | `client/src/lib/hardware/detectors/WebGpuDetector.ts` | TypeScript | Client (Next.js / React Web UI) | 84 | 77 | 0 | 7 | 2.49 KB |
| 400 | `client/src/lib/hardware/types.ts` | TypeScript | Client (Next.js / React Web UI) | 84 | 79 | 0 | 5 | 2.54 KB |
| 401 | `src/index.ts` | TypeScript | Server (Holy Bible MCP Engine) | 84 | 67 | 4 | 13 | 2.68 KB |
| 402 | `client/src/lib/ai/streaming/executors/on-device-stream-executor.ts` | TypeScript | Client (Next.js / React Web UI) | 83 | 66 | 7 | 10 | 2.53 KB |
| 403 | `client/src/lib/clipboard/unified-clipboard.ts` | TypeScript | Client (Next.js / React Web UI) | 83 | 59 | 13 | 11 | 2.77 KB |
| 404 | `client/src/app/api/system-diagnostics/route.ts` | TypeScript | Client (Next.js / React Web UI) | 82 | 64 | 6 | 12 | 3.23 KB |
| 405 | `client/src/components/p2p/P2pWaveformCanvas.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 82 | 65 | 4 | 13 | 2.34 KB |
| 406 | `client/src/components/settings/providers/card/LocalProviderInputDock.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 82 | 76 | 0 | 6 | 2.84 KB |
| 407 | `client/src/components/ui/tabs.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 82 | 70 | 0 | 12 | 2.31 KB |
| 408 | `client/src/lib/ai/on-device/range-chunk-fetcher.ts` | TypeScript | Client (Next.js / React Web UI) | 82 | 63 | 10 | 9 | 2.5 KB |
| 409 | `client/src/lib/mcp-registry/catalog/ai-memory.ts` | TypeScript | Client (Next.js / React Web UI) | 82 | 81 | 0 | 1 | 2.55 KB |
| 410 | `client/src/lib/p2p/mesh/types.ts` | TypeScript | Client (Next.js / React Web UI) | 82 | 70 | 3 | 9 | 1.94 KB |
| 411 | `client/src/app/[locale]/layout.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 81 | 74 | 0 | 7 | 4.01 KB |
| 412 | `src/tools/catalogs/system.tools.ts` | TypeScript | Server (Holy Bible MCP Engine) | 81 | 80 | 0 | 1 | 2.8 KB |
| 413 | `client/src/app/api/settings/route.ts` | TypeScript | Client (Next.js / React Web UI) | 80 | 65 | 3 | 12 | 2.74 KB |
| 414 | `client/src/components/chat/dock/InputDockSourceHeader.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 80 | 75 | 0 | 5 | 3.16 KB |
| 415 | `client/src/components/chat/dock/VoiceRecorderDock.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 80 | 76 | 0 | 4 | 3.46 KB |
| 416 | `client/src/components/layout/DesktopFrame.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 80 | 66 | 4 | 10 | 3.12 KB |
| 417 | `client/src/stores/useMcpDownloadStore.ts` | TypeScript | Client (Next.js / React Web UI) | 80 | 70 | 2 | 8 | 2.83 KB |
| 418 | `client/src/components/chat/hooks/useAsyncMessageParser.ts` | TypeScript | Client (Next.js / React Web UI) | 79 | 65 | 2 | 12 | 2.28 KB |
| 419 | `client/src/lib/ai/rag/shared-vector-memory.ts` | TypeScript | Client (Next.js / React Web UI) | 79 | 58 | 9 | 12 | 2.73 KB |
| 420 | `client/src/lib/mcp/database-detector.ts` | TypeScript | Client (Next.js / React Web UI) | 79 | 67 | 1 | 11 | 2.87 KB |
| 421 | `client/src/lib/models/latency-tracker.ts` | TypeScript | Client (Next.js / React Web UI) | 79 | 68 | 0 | 11 | 2.77 KB |
| 422 | `client/src/stores/p2p/slices/qr-nonce.slice.ts` | TypeScript | Client (Next.js / React Web UI) | 79 | 62 | 3 | 14 | 2.36 KB |
| 423 | `src/database/better_sqlite_pool.ts` | TypeScript | Server (Holy Bible MCP Engine) | 79 | 62 | 3 | 14 | 2.28 KB |
| 424 | `client/src/components/p2p/details/NodeHardwareGpuSpecs.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 78 | 67 | 5 | 6 | 2.69 KB |
| 425 | `client/src/components/ui/glass.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 78 | 61 | 9 | 8 | 3.16 KB |
| 426 | `client/src/lib/ai/adapters/streams/SseParserTransformStream.ts` | TypeScript | Client (Next.js / React Web UI) | 78 | 73 | 0 | 5 | 2.33 KB |
| 427 | `client/src/lib/mcp/lifecycle/exit-handler.ts` | TypeScript | Client (Next.js / React Web UI) | 78 | 68 | 1 | 9 | 2.62 KB |
| 428 | `scripts/verify_all_blocks_master.ts` | TypeScript | Core Tooling & Scripts | 78 | 58 | 8 | 12 | 3.88 KB |
| 429 | `client/android/app/build.gradle` | Gradle | Android (Native Java/Gradle/XML) | 77 | 57 | 8 | 12 | 2.94 KB |
| 430 | `client/android/app/src/main/AndroidManifest.xml` | XML | Android (Native Java/Gradle/XML) | 77 | 63 | 4 | 10 | 3.76 KB |
| 431 | `client/android/app/src/main/java/com/holy/bible/mcp/vision/MlKitBarcodeAnalyzer.java` | Java | Android (Native Java/Gradle/XML) | 76 | 64 | 5 | 7 | 2.92 KB |
| 432 | `client/src/components/settings/providers/local/LocalP2pMeshCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 76 | 73 | 0 | 3 | 2.79 KB |
| 433 | `client/src/components/ui/dialog.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 76 | 65 | 0 | 11 | 2.39 KB |
| 434 | `client/src/lib/ai/providers/ollama-ai-adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 76 | 62 | 5 | 9 | 1.93 KB |
| 435 | `client/src/lib/hardware/gpu-chipset-parser.ts` | TypeScript | Client (Next.js / React Web UI) | 76 | 57 | 10 | 9 | 3.64 KB |
| 436 | `client/src/lib/mcp/biblical-intelligence.ts` | TypeScript | Client (Next.js / React Web UI) | 76 | 58 | 10 | 8 | 2.72 KB |
| 437 | `client/src/components/mcp/dashboard/McpMetricsHeader.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 75 | 68 | 0 | 7 | 3.12 KB |
| 438 | `client/src/components/sidebar/useSidebarChatList.ts` | TypeScript | Client (Next.js / React Web UI) | 75 | 58 | 6 | 11 | 1.87 KB |
| 439 | `client/src/lib/mcp/lifecycle/process-tree-killer.ts` | TypeScript | Client (Next.js / React Web UI) | 75 | 48 | 16 | 11 | 2.03 KB |
| 440 | `client/src/lib/mcp/lifecycle/stdio-transport.ts` | TypeScript | Client (Next.js / React Web UI) | 75 | 62 | 4 | 9 | 2.42 KB |
| 441 | `client/src/lib/mcp/resolvers/self-healing-interceptor.ts` | TypeScript | Client (Next.js / React Web UI) | 75 | 57 | 11 | 7 | 2.34 KB |
| 442 | `client/src/lib/hardware/telemetry/native-telemetry.bridge.ts` | TypeScript | Client (Next.js / React Web UI) | 74 | 55 | 11 | 8 | 2.02 KB |
| 443 | `client/src/lib/p2p/crypto/primitives/sha256.ts` | TypeScript | Client (Next.js / React Web UI) | 74 | 61 | 3 | 10 | 2.92 KB |
| 444 | `scripts/verify_concurrency_stress.ts` | TypeScript | Core Tooling & Scripts | 74 | 54 | 4 | 16 | 3.16 KB |
| 445 | `src/directives/theological_tables.ts` | TypeScript | Server (Holy Bible MCP Engine) | 74 | 68 | 0 | 6 | 2.21 KB |
| 446 | `client/src/lib/ai/dynamic-resolver/quantization-shard-picker.ts` | TypeScript | Client (Next.js / React Web UI) | 73 | 62 | 3 | 8 | 2.63 KB |
| 447 | `client/src/lib/ai/on-device/workers/webgpu-tab-broker.ts` | TypeScript | Client (Next.js / React Web UI) | 73 | 63 | 1 | 9 | 2.12 KB |
| 448 | `client/src/lib/mcp/engine/pipelines/ResponseTransformer.ts` | TypeScript | Client (Next.js / React Web UI) | 73 | 70 | 0 | 3 | 3.54 KB |
| 449 | `client/src/lib/mcp/evaluators/accuracy-evaluator.ts` | TypeScript | Client (Next.js / React Web UI) | 73 | 60 | 4 | 9 | 2.15 KB |
| 450 | `client/src/lib/validations/provider.schema.ts` | TypeScript | Client (Next.js / React Web UI) | 73 | 63 | 3 | 7 | 2.54 KB |
| 451 | `scripts/migrate_osis_to_sqlite.ts` | TypeScript | Core Tooling & Scripts | 73 | 57 | 1 | 15 | 2.46 KB |
| 452 | `src/workers/integrity_tasks.ts` | TypeScript | Server (Holy Bible MCP Engine) | 73 | 59 | 5 | 9 | 2.26 KB |
| 453 | `client/src/components/sidebar/SidebarChatTitleEditor.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 72 | 60 | 5 | 7 | 2.14 KB |
| 454 | `client/src/contracts/api.contract.ts` | TypeScript | Client (Next.js / React Web UI) | 72 | 55 | 10 | 7 | 2.1 KB |
| 455 | `client/src/lib/mcp/resolvers/runtime/NodeRuntimeResolver.ts` | TypeScript | Client (Next.js / React Web UI) | 72 | 67 | 0 | 5 | 2.62 KB |
| 456 | `src/cli/commands/delete_db.ts` | TypeScript | Server (Holy Bible MCP Engine) | 72 | 63 | 0 | 9 | 2.13 KB |
| 457 | `src/tools/handlers/ask_holy_bible/verse_context_retriever.ts` | TypeScript | Server (Holy Bible MCP Engine) | 72 | 64 | 3 | 5 | 2.14 KB |
| 458 | `client/src/components/p2p/client/hooks/useQrCameraStream.ts` | TypeScript | Client (Next.js / React Web UI) | 71 | 65 | 0 | 6 | 2.3 KB |
| 459 | `client/src/lib/models/pull/modelPullParsers.ts` | TypeScript | Client (Next.js / React Web UI) | 71 | 65 | 0 | 6 | 2.68 KB |
| 460 | `client/src/stores/p2p/p2p-types.ts` | TypeScript | Client (Next.js / React Web UI) | 71 | 67 | 0 | 4 | 1.95 KB |
| 461 | `client/src/components/mcp/modals/McpPresetCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 70 | 64 | 0 | 6 | 2.43 KB |
| 462 | `client/src/components/ui/ErrorBoundary.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 70 | 61 | 0 | 9 | 2.3 KB |
| 463 | `client/src/lib/p2p/workers/stream-codec.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 70 | 55 | 5 | 10 | 1.45 KB |
| 464 | `client/src/lib/workers/mcp-task-worker.ts` | TypeScript | Client (Next.js / React Web UI) | 70 | 57 | 4 | 9 | 1.6 KB |
| 465 | `src/database/auxiliary/aux_database_manager.ts` | TypeScript | Server (Holy Bible MCP Engine) | 70 | 60 | 3 | 7 | 5.18 KB |
| 466 | `src/morphology/types.ts` | TypeScript | Server (Holy Bible MCP Engine) | 70 | 67 | 0 | 3 | 1.4 KB |
| 467 | `src/tools/catalogs/verse.tools.ts` | TypeScript | Server (Holy Bible MCP Engine) | 70 | 69 | 0 | 1 | 2.87 KB |
| 468 | `client/src/app/api/upload/route.ts` | TypeScript | Client (Next.js / React Web UI) | 69 | 56 | 5 | 8 | 2.56 KB |
| 469 | `client/src/components/chat/dock/ModelBadges.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 69 | 65 | 0 | 4 | 3.49 KB |
| 470 | `client/src/components/ui/sheet.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 69 | 61 | 0 | 8 | 2.06 KB |
| 471 | `client/src/db/schema.ts` | TypeScript | Client (Next.js / React Web UI) | 69 | 62 | 0 | 7 | 2.89 KB |
| 472 | `client/src/lib/ai/adapters/on-device.adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 69 | 57 | 6 | 6 | 2.32 KB |
| 473 | `src/directives/types.ts` | TypeScript | Server (Holy Bible MCP Engine) | 69 | 64 | 0 | 5 | 1.62 KB |
| 474 | `src/resources/resource_uri_parser.ts` | TypeScript | Server (Holy Bible MCP Engine) | 69 | 52 | 9 | 8 | 1.95 KB |
| 475 | `client/src/components/chat/header/ChatActionMenu.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 68 | 57 | 5 | 6 | 1.96 KB |
| 476 | `client/src/contracts/native-bridge.contract.ts` | TypeScript | Client (Next.js / React Web UI) | 68 | 51 | 11 | 6 | 2.21 KB |
| 477 | `client/src/lib/ai/on-device/storage/webllm-cache.adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 68 | 59 | 4 | 5 | 2.11 KB |
| 478 | `client/src/lib/p2p/files/multimodal-packager.ts` | TypeScript | Client (Next.js / React Web UI) | 68 | 49 | 10 | 9 | 2.01 KB |
| 479 | `client/src/lib/p2p/orchestrator/McpRequestDispatcher.ts` | TypeScript | Client (Next.js / React Web UI) | 68 | 55 | 3 | 10 | 2.0 KB |
| 480 | `src/tools/catalogs/search.tools.ts` | TypeScript | Server (Holy Bible MCP Engine) | 68 | 67 | 0 | 1 | 2.48 KB |
| 481 | `client/src/components/chat/renderer/parser/markdown-normalizer.ts` | TypeScript | Client (Next.js / React Web UI) | 67 | 59 | 3 | 5 | 4.34 KB |
| 482 | `client/src/components/p2p/client/P2pPairingStateProgress.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 67 | 55 | 5 | 7 | 2.13 KB |
| 483 | `client/src/components/theme-provider.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 67 | 59 | 0 | 8 | 1.79 KB |
| 484 | `client/src/lib/p2p/crypto/qr/qr-version-specs.ts` | TypeScript | Client (Next.js / React Web UI) | 67 | 60 | 3 | 4 | 4.67 KB |
| 485 | `client/src/stores/chat/useChatMetadataStore.ts` | TypeScript | Client (Next.js / React Web UI) | 67 | 60 | 3 | 4 | 2.35 KB |
| 486 | `src/tools/tool_definition_factory.ts` | TypeScript | Server (Holy Bible MCP Engine) | 67 | 49 | 12 | 6 | 1.61 KB |
| 487 | `src/transport/sse_session_manager.ts` | TypeScript | Server (Holy Bible MCP Engine) | 67 | 58 | 0 | 9 | 1.95 KB |
| 488 | `client/android/app/src/main/java/com/holy/bible/mcp/service/WakeLockGuard.java` | Java | Android (Native Java/Gradle/XML) | 66 | 56 | 3 | 7 | 2.37 KB |
| 489 | `client/src/db/fts-setup.ts` | TypeScript | Client (Next.js / React Web UI) | 66 | 48 | 8 | 10 | 2.28 KB |
| 490 | `client/src/stores/p2p/services/p2p-session.coordinator.ts` | TypeScript | Client (Next.js / React Web UI) | 66 | 54 | 3 | 9 | 2.07 KB |
| 491 | `src/data/osis_dictionary.ts` | TypeScript | Server (Holy Bible MCP Engine) | 66 | 54 | 1 | 11 | 2.3 KB |
| 492 | `client/src/components/chat/indicator/StatusIcon.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 65 | 57 | 0 | 8 | 2.68 KB |
| 493 | `client/src/components/p2p/client/P2pPinInputView.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 65 | 51 | 5 | 9 | 1.93 KB |
| 494 | `client/src/lib/diagnostics/types.ts` | TypeScript | Client (Next.js / React Web UI) | 65 | 63 | 0 | 2 | 1.59 KB |
| 495 | `client/android/app/src/main/java/com/holy/bible/mcp/identity/KeystoreSecurityManager.java` | Java | Android (Native Java/Gradle/XML) | 64 | 47 | 4 | 13 | 2.17 KB |
| 496 | `client/src/components/chat/AiThinkingIndicator.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 64 | 55 | 0 | 9 | 2.29 KB |
| 497 | `client/src/lib/mcp/downloader/manifest-resolver.ts` | TypeScript | Client (Next.js / React Web UI) | 64 | 56 | 0 | 8 | 2.17 KB |
| 498 | `client/src/stores/chat/transient-stream-reactor.ts` | TypeScript | Client (Next.js / React Web UI) | 64 | 46 | 7 | 11 | 1.8 KB |
| 499 | `client/src/stores/p2p/services/p2p-storage.adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 64 | 57 | 0 | 7 | 2.1 KB |
| 500 | `src/directives/schema/drizzle_schema.ts` | TypeScript | Server (Holy Bible MCP Engine) | 64 | 52 | 5 | 7 | 1.34 KB |
| 501 | `client/src/components/chat/header/HeaderModeTrigger.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 63 | 58 | 0 | 5 | 2.66 KB |
| 502 | `client/src/components/chat/header/warmth/WarmthServerSelector.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 63 | 60 | 0 | 3 | 2.95 KB |
| 503 | `client/src/lib/mcp/server-list.ts` | TypeScript | Client (Next.js / React Web UI) | 63 | 53 | 2 | 8 | 2.29 KB |
| 504 | `src/search/diff/translation_word_diff.ts` | TypeScript | Server (Holy Bible MCP Engine) | 63 | 52 | 1 | 10 | 1.59 KB |
| 505 | `client/android/app/src/main/java/com/holy/bible/mcp/HolyVisionFeedback.java` | Java | Android (Native Java/Gradle/XML) | 62 | 57 | 0 | 5 | 2.21 KB |
| 506 | `client/src/components/mcp/modals/McpManualImportOptions.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 62 | 56 | 0 | 6 | 2.96 KB |
| 507 | `client/src/components/p2p/details/NodePingHistoryChart.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 62 | 44 | 5 | 13 | 1.81 KB |
| 508 | `client/src/components/sidebar/SidebarNewChatButton.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 62 | 57 | 0 | 5 | 2.39 KB |
| 509 | `client/src/lib/p2p/transport/host-priority/circular-token-buffer.ts` | TypeScript | Client (Next.js / React Web UI) | 62 | 39 | 16 | 7 | 1.52 KB |
| 510 | `client/src/lib/p2p/transport/webrtc/DataChannelMultiplexer.ts` | TypeScript | Client (Next.js / React Web UI) | 62 | 54 | 0 | 8 | 1.62 KB |
| 511 | `src/graph/prophecy_fulfillment_matcher.ts` | TypeScript | Server (Holy Bible MCP Engine) | 62 | 49 | 6 | 7 | 2.26 KB |
| 512 | `src/tools/handlers/commentary.handlers.ts` | TypeScript | Server (Holy Bible MCP Engine) | 62 | 53 | 0 | 9 | 2.33 KB |
| 513 | `src/search/morphology/ukrainian_morphology_engine.ts` | TypeScript | Server (Holy Bible MCP Engine) | 61 | 49 | 0 | 12 | 2.85 KB |
| 514 | `client/src/components/mcp/cards/ServerStatusHeader.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 60 | 50 | 5 | 5 | 1.82 KB |
| 515 | `client/src/hooks/useDecoupledAudioLevel.ts` | TypeScript | Client (Next.js / React Web UI) | 60 | 44 | 6 | 10 | 1.7 KB |
| 516 | `client/android/capacitor-cordova-android-plugins/build.gradle` | Gradle | Android (Native Java/Gradle/XML) | 59 | 47 | 4 | 8 | 1.63 KB |
| 517 | `client/src/components/p2p/client/feedback-effects.ts` | TypeScript | Client (Next.js / React Web UI) | 59 | 46 | 3 | 10 | 1.59 KB |
| 518 | `client/src/lib/mcp/resolvers/runtime/ExecutableFinder.ts` | TypeScript | Client (Next.js / React Web UI) | 59 | 53 | 0 | 6 | 1.96 KB |
| 519 | `client/src/lib/parsers/document.parser.ts` | TypeScript | Client (Next.js / React Web UI) | 59 | 50 | 1 | 8 | 2.3 KB |
| 520 | `src/vector_context.ts` | TypeScript | Server (Holy Bible MCP Engine) | 59 | 38 | 9 | 12 | 2.05 KB |
| 521 | `client/src/components/p2p/details/NodeQuotaGovernorSlider.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 58 | 47 | 5 | 6 | 1.95 KB |
| 522 | `client/src/components/ui/button.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 58 | 54 | 0 | 4 | 3.16 KB |
| 523 | `client/src/lib/p2p/crypto/sas-engine.ts` | TypeScript | Client (Next.js / React Web UI) | 58 | 42 | 10 | 6 | 2.23 KB |
| 524 | `client/src/lib/p2p/transport/native-lifecycle.bridge.ts` | TypeScript | Client (Next.js / React Web UI) | 58 | 40 | 11 | 7 | 1.82 KB |
| 525 | `client/android/app/src/main/java/com/holy/bible/mcp/service/P2PMeshNotificationChannel.java` | Java | Android (Native Java/Gradle/XML) | 56 | 47 | 3 | 6 | 2.21 KB |
| 526 | `client/src/components/ui/focus-trap.ts` | TypeScript | Client (Next.js / React Web UI) | 56 | 41 | 4 | 11 | 1.6 KB |
| 527 | `client/src/lib/mcp/logger.ts` | TypeScript | Client (Next.js / React Web UI) | 56 | 48 | 0 | 8 | 1.94 KB |
| 528 | `client/android/app/src/main/java/com/holy/bible/mcp/vision/ui/CloseButtonView.java` | Java | Android (Native Java/Gradle/XML) | 55 | 43 | 3 | 9 | 1.82 KB |
| 529 | `client/src/components/mcp/hooks/useMcpPolling.ts` | TypeScript | Client (Next.js / React Web UI) | 55 | 48 | 0 | 7 | 1.87 KB |
| 530 | `client/src/lib/mcp/storage/opfs-storage-driver.ts` | TypeScript | Client (Next.js / React Web UI) | 55 | 46 | 3 | 6 | 1.8 KB |
| 531 | `client/src/lib/native/hardware-telemetry.service.ts` | TypeScript | Client (Next.js / React Web UI) | 55 | 37 | 12 | 6 | 1.59 KB |
| 532 | `client/src/components/settings/profile/LanguageSelector.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 54 | 43 | 3 | 8 | 1.85 KB |
| 533 | `src/directives/theological_knowledge_store.ts` | TypeScript | Server (Holy Bible MCP Engine) | 54 | 44 | 3 | 7 | 1.73 KB |
| 534 | `src/tools/catalogs/theology.tools.ts` | TypeScript | Server (Holy Bible MCP Engine) | 54 | 53 | 0 | 1 | 2.22 KB |
| 535 | `client/src/components/mcp/cards/ServerToolsList.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 53 | 48 | 0 | 5 | 1.84 KB |
| 536 | `client/src/lib/ai/stream/loop-breaker.ts` | TypeScript | Client (Next.js / React Web UI) | 53 | 36 | 6 | 11 | 1.35 KB |
| 537 | `client/src/lib/mcp/cas-engine.ts` | TypeScript | Client (Next.js / React Web UI) | 53 | 39 | 10 | 4 | 1.68 KB |
| 538 | `client/src/lib/mcp/downloader/download-state-manager.ts` | TypeScript | Client (Next.js / React Web UI) | 53 | 48 | 0 | 5 | 1.39 KB |
| 539 | `client/src/lib/mcp/heuristics/prompt-complexity.ts` | TypeScript | Client (Next.js / React Web UI) | 53 | 42 | 4 | 7 | 3.64 KB |
| 540 | `client/src/stores/slices/uiSlice.ts` | TypeScript | Client (Next.js / React Web UI) | 53 | 49 | 0 | 4 | 1.81 KB |
| 541 | `src/directives/repositories/tier_repository.ts` | TypeScript | Server (Holy Bible MCP Engine) | 53 | 47 | 0 | 6 | 1.58 KB |
| 542 | `client/src/components/settings/diagnostics/BatteryDiagnosticsCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 52 | 45 | 0 | 7 | 2.26 KB |
| 543 | `client/src/lib/ai/stream/StreamCheckpointManager.ts` | TypeScript | Client (Next.js / React Web UI) | 52 | 43 | 3 | 6 | 1.37 KB |
| 544 | `client/src/lib/mcp-registry/types.ts` | TypeScript | Client (Next.js / React Web UI) | 52 | 49 | 0 | 3 | 0.93 KB |
| 545 | `client/src/lib/p2p/crypto/primitives/hmac-hkdf.ts` | TypeScript | Client (Next.js / React Web UI) | 52 | 39 | 3 | 10 | 1.38 KB |
| 546 | `client/src/lib/p2p/transport/webrtc/channel-multiplexer.ts` | TypeScript | Client (Next.js / React Web UI) | 52 | 46 | 0 | 6 | 1.73 KB |
| 547 | `client/src/stores/p2p/slices/pairing.slice.ts` | TypeScript | Client (Next.js / React Web UI) | 52 | 42 | 3 | 7 | 1.48 KB |
| 548 | `src/database/sqlite_connection.ts` | TypeScript | Server (Holy Bible MCP Engine) | 52 | 46 | 0 | 6 | 1.49 KB |
| 549 | `src/transport/stdio_transport_adapter.ts` | TypeScript | Server (Holy Bible MCP Engine) | 52 | 44 | 1 | 7 | 1.68 KB |
| 550 | `src/vector_context/in_memory_bm25_index.ts` | TypeScript | Server (Holy Bible MCP Engine) | 52 | 37 | 9 | 6 | 1.54 KB |
| 551 | `client/android/app/src/main/java/com/holy/bible/mcp/MainActivity.java` | Java | Android (Native Java/Gradle/XML) | 51 | 45 | 0 | 6 | 1.86 KB |
| 552 | `client/android/app/src/main/res/layout/dialog_holy_vision_scanner.xml` | XML | Android (Native Java/Gradle/XML) | 51 | 43 | 2 | 6 | 1.82 KB |
| 553 | `client/src/components/mcp/modals/ValidationStatusView.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 51 | 39 | 5 | 7 | 1.76 KB |
| 554 | `client/src/components/mcp/types.ts` | TypeScript | Client (Next.js / React Web UI) | 51 | 49 | 0 | 2 | 1.53 KB |
| 555 | `client/src/components/providers/ClientIntlProvider.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 51 | 41 | 2 | 8 | 1.59 KB |
| 556 | `client/src/components/ui/popover.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 51 | 44 | 0 | 7 | 1.4 KB |
| 557 | `client/src/lib/logger.ts` | TypeScript | Client (Next.js / React Web UI) | 51 | 38 | 4 | 9 | 2.1 KB |
| 558 | `client/src/stores/useLocaleStore.ts` | TypeScript | Client (Next.js / React Web UI) | 51 | 47 | 0 | 4 | 1.48 KB |
| 559 | `src/cli/commands/status_db.ts` | TypeScript | Server (Holy Bible MCP Engine) | 51 | 44 | 0 | 7 | 2.32 KB |
| 560 | `src/resources/handlers/chapter_resource_handler.ts` | TypeScript | Server (Holy Bible MCP Engine) | 51 | 41 | 3 | 7 | 1.61 KB |
| 561 | `src/tools/catalogs/morphology.tools.ts` | TypeScript | Server (Holy Bible MCP Engine) | 51 | 50 | 0 | 1 | 1.9 KB |
| 562 | `client/next.config.ts` | TypeScript | Client (Next.js / React Web UI) | 50 | 45 | 0 | 5 | 1.27 KB |
| 563 | `client/src/lib/shared/fs-async-utils.ts` | TypeScript | Client (Next.js / React Web UI) | 50 | 41 | 4 | 5 | 1.18 KB |
| 564 | `client/src/components/p2p/details/NodeBlacklistActions.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 49 | 39 | 5 | 5 | 1.55 KB |
| 565 | `client/src/hooks/useLocalModelPull.ts` | TypeScript | Client (Next.js / React Web UI) | 49 | 41 | 0 | 8 | 1.4 KB |
| 566 | `client/src/lib/mcp/evaluator.ts` | TypeScript | Client (Next.js / React Web UI) | 49 | 46 | 0 | 3 | 1.88 KB |
| 567 | `client/src/stores/p2p/slices/sessions.slice.ts` | TypeScript | Client (Next.js / React Web UI) | 49 | 41 | 0 | 8 | 1.29 KB |
| 568 | `client/src/workers/traffic-chaffing.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 49 | 41 | 4 | 4 | 1.54 KB |
| 569 | `src/database/connection/sqlite_connection_factory.ts` | TypeScript | Server (Holy Bible MCP Engine) | 49 | 41 | 3 | 5 | 1.58 KB |
| 570 | `client/src/app/api/ping/route.ts` | TypeScript | Client (Next.js / React Web UI) | 48 | 38 | 2 | 8 | 1.35 KB |
| 571 | `client/src/app/styles/theme.css` | CSS | Client (Next.js / React Web UI) | 48 | 4 | 42 | 2 | 1.08 KB |
| 572 | `client/src/components/chat/dock/source/types.ts` | TypeScript | Client (Next.js / React Web UI) | 48 | 43 | 1 | 4 | 1.54 KB |
| 573 | `client/src/lib/models/capabilities.ts` | TypeScript | Client (Next.js / React Web UI) | 48 | 39 | 0 | 9 | 0.86 KB |
| 574 | `src/directives/warmth_resolver.ts` | TypeScript | Server (Holy Bible MCP Engine) | 48 | 39 | 3 | 6 | 1.53 KB |
| 575 | `src/tools/catalogs/ask.tools.ts` | TypeScript | Server (Holy Bible MCP Engine) | 48 | 47 | 0 | 1 | 2.42 KB |
| 576 | `client/android/app/src/main/java/com/holy/bible/mcp/identity/LegacyIdentityMigrator.java` | Java | Android (Native Java/Gradle/XML) | 47 | 39 | 3 | 5 | 2.06 KB |
| 577 | `client/src/components/chat/renderer/parser/verse-citation-parser.ts` | TypeScript | Client (Next.js / React Web UI) | 47 | 37 | 3 | 7 | 1.02 KB |
| 578 | `client/src/components/p2p/client/hooks/useOpticalDecoder.ts` | TypeScript | Client (Next.js / React Web UI) | 47 | 41 | 0 | 6 | 1.45 KB |
| 579 | `client/src/components/p2p/details/NodeHeaderCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 47 | 45 | 0 | 2 | 1.63 KB |
| 580 | `client/src/lib/p2p/telemetry/thermal-battery-guard.ts` | TypeScript | Client (Next.js / React Web UI) | 47 | 29 | 9 | 9 | 1.59 KB |
| 581 | `src/transport_manager.ts` | TypeScript | Server (Holy Bible MCP Engine) | 47 | 40 | 0 | 7 | 1.5 KB |
| 582 | `client/android/app/src/main/java/com/holy/bible/mcp/speech/AudioFocusManager.java` | Java | Android (Native Java/Gradle/XML) | 46 | 35 | 4 | 7 | 1.73 KB |
| 583 | `client/android/app/src/main/res/values/styles.xml` | XML | Android (Native Java/Gradle/XML) | 46 | 37 | 4 | 5 | 2.19 KB |
| 584 | `client/src/app/api/chats/[id]/messages/route.ts` | TypeScript | Client (Next.js / React Web UI) | 46 | 37 | 2 | 7 | 1.48 KB |
| 585 | `client/src/lib/ai/core/types.ts` | TypeScript | Client (Next.js / React Web UI) | 46 | 43 | 0 | 3 | 1.38 KB |
| 586 | `client/src/lib/ai/stream/stream-render-batcher.ts` | TypeScript | Client (Next.js / React Web UI) | 46 | 36 | 4 | 6 | 1.21 KB |
| 587 | `client/src/lib/hardware/classifiers/TierRecommender.ts` | TypeScript | Client (Next.js / React Web UI) | 46 | 43 | 0 | 3 | 1.51 KB |
| 588 | `src/directives/tier_resolver.ts` | TypeScript | Server (Holy Bible MCP Engine) | 46 | 39 | 3 | 4 | 1.29 KB |
| 589 | `src/morphology/transliteration_engine.ts` | TypeScript | Server (Holy Bible MCP Engine) | 46 | 33 | 8 | 5 | 1.87 KB |
| 590 | `src/resources/handlers/strongs_resource_handler.ts` | TypeScript | Server (Holy Bible MCP Engine) | 46 | 38 | 3 | 5 | 1.18 KB |
| 591 | `client/src/components/chat/dock/source/SourceApiKeyWarning.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 45 | 41 | 0 | 4 | 1.74 KB |
| 592 | `client/src/components/chat/message/MessageAttachments.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 45 | 41 | 0 | 4 | 1.94 KB |
| 593 | `client/src/components/p2p/client/P2pClientConnectionSummary.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 45 | 35 | 5 | 5 | 1.4 KB |
| 594 | `client/src/components/settings/diagnostics/NetworkBenchmarkCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 45 | 39 | 0 | 6 | 2.11 KB |
| 595 | `client/src/lib/hardware/ios-jetsam-guard.ts` | TypeScript | Client (Next.js / React Web UI) | 45 | 36 | 4 | 5 | 1.55 KB |
| 596 | `client/src/lib/mcp/engine/stages/ToolInvocationPlanner.ts` | TypeScript | Client (Next.js / React Web UI) | 45 | 40 | 0 | 5 | 1.54 KB |
| 597 | `client/src/lib/p2p/crypto/pq/kdf-chain-ratchet.ts` | TypeScript | Client (Next.js / React Web UI) | 45 | 31 | 7 | 7 | 1.56 KB |
| 598 | `client/src/lib/p2p/files/StreamReassemblyBuffer.ts` | TypeScript | Client (Next.js / React Web UI) | 45 | 38 | 0 | 7 | 1.23 KB |
| 599 | `src/database/path_resolver.ts` | TypeScript | Server (Holy Bible MCP Engine) | 45 | 37 | 0 | 8 | 1.57 KB |
| 600 | `client/src/lib/ai/streaming/executors/p2p-stream-executor.ts` | TypeScript | Client (Next.js / React Web UI) | 44 | 37 | 3 | 4 | 1.32 KB |
| 601 | `client/src/lib/p2p/transport/webrtc/rtt-pinger.ts` | TypeScript | Client (Next.js / React Web UI) | 44 | 38 | 0 | 6 | 1.07 KB |
| 602 | `src/archetypes.ts` | TypeScript | Server (Holy Bible MCP Engine) | 44 | 31 | 9 | 4 | 1.74 KB |
| 603 | `client/src/lib/mcp-registry/catalog/browser.ts` | TypeScript | Client (Next.js / React Web UI) | 43 | 42 | 0 | 1 | 1.43 KB |
| 604 | `src/directives/repositories/warmth_repository.ts` | TypeScript | Server (Holy Bible MCP Engine) | 43 | 36 | 0 | 7 | 1.38 KB |
| 605 | `client/Dockerfile` | Dockerfile | Client (Next.js / React Web UI) | 42 | 27 | 5 | 10 | 1.04 KB |
| 606 | `client/src/components/p2p/pairing/SasSecurityBadge.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 42 | 37 | 0 | 5 | 1.89 KB |
| 607 | `client/src/lib/p2p/transport/nat-traversal-manager.ts` | TypeScript | Client (Next.js / React Web UI) | 42 | 28 | 11 | 3 | 1.22 KB |
| 608 | `src/graph/thematic_chain_tracer.ts` | TypeScript | Server (Holy Bible MCP Engine) | 42 | 32 | 5 | 5 | 2.47 KB |
| 609 | `src/workers/worker_pool.ts` | TypeScript | Server (Holy Bible MCP Engine) | 42 | 29 | 6 | 7 | 1.22 KB |
| 610 | `client/android/app/src/main/java/com/holy/bible/mcp/HolyP2PBridgePlugin.java` | Java | Android (Native Java/Gradle/XML) | 41 | 35 | 0 | 6 | 1.36 KB |
| 611 | `client/src/components/settings/diagnostics/HardwareCpuGpuCard.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 41 | 37 | 0 | 4 | 1.81 KB |
| 612 | `client/src/lib/ai/on-device/rpc.types.ts` | TypeScript | Client (Next.js / React Web UI) | 41 | 33 | 3 | 5 | 1.67 KB |
| 613 | `client/src/lib/p2p/events/p2p-stream-event-bus.ts` | TypeScript | Client (Next.js / React Web UI) | 41 | 30 | 4 | 7 | 1.01 KB |
| 614 | `client/src/stores/p2p/slices/telemetry.slice.ts` | TypeScript | Client (Next.js / React Web UI) | 41 | 35 | 0 | 6 | 1.03 KB |
| 615 | `src/tools/handlers/ask_holy_bible/telemetry_calculator.ts` | TypeScript | Server (Holy Bible MCP Engine) | 41 | 38 | 0 | 3 | 1.43 KB |
| 616 | `client/capacitor.config.ts` | TypeScript | Client (Next.js / React Web UI) | 40 | 38 | 0 | 2 | 0.85 KB |
| 617 | `client/src/components/mcp/modals/DockerContainerTab.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 40 | 30 | 5 | 5 | 1.33 KB |
| 618 | `client/src/lib/p2p/files/BlobChunker.ts` | TypeScript | Client (Next.js / React Web UI) | 40 | 31 | 3 | 6 | 0.93 KB |
| 619 | `client/src/lib/p2p/orchestrator/NodeCapabilityRegistry.ts` | TypeScript | Client (Next.js / React Web UI) | 40 | 30 | 3 | 7 | 0.91 KB |
| 620 | `client/src/stores/chat/chat-store.types.ts` | TypeScript | Client (Next.js / React Web UI) | 40 | 37 | 0 | 3 | 1.62 KB |
| 621 | `client/src/components/chat/header/HeaderTitleBar.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 39 | 35 | 0 | 4 | 1.32 KB |
| 622 | `client/src/components/ui/badge.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 39 | 35 | 0 | 4 | 1.29 KB |
| 623 | `client/src/lib/ai/core/FailoverPolicyEngine.ts` | TypeScript | Client (Next.js / React Web UI) | 39 | 29 | 5 | 5 | 0.88 KB |
| 624 | `client/src/lib/p2p/inference/types.ts` | TypeScript | Client (Next.js / React Web UI) | 39 | 32 | 3 | 4 | 1.01 KB |
| 625 | `client/src/lib/useContentBlur.ts` | TypeScript | Client (Next.js / React Web UI) | 39 | 22 | 13 | 4 | 1.11 KB |
| 626 | `client/src/stores/p2p/services/SasPairingHandshakeHandler.ts` | TypeScript | Client (Next.js / React Web UI) | 39 | 36 | 0 | 3 | 1.19 KB |
| 627 | `client/src/stores/p2p/slices/transport.slice.ts` | TypeScript | Client (Next.js / React Web UI) | 39 | 30 | 3 | 6 | 1.16 KB |
| 628 | `src/directives/repositories/mode_repository.ts` | TypeScript | Server (Holy Bible MCP Engine) | 39 | 32 | 0 | 7 | 1.19 KB |
| 629 | `src/workers/morphology_worker.ts` | TypeScript | Server (Holy Bible MCP Engine) | 39 | 26 | 6 | 7 | 1.47 KB |
| 630 | `client/android/app/src/main/java/com/holy/bible/mcp/identity/DeviceFingerprintGenerator.java` | Java | Android (Native Java/Gradle/XML) | 38 | 32 | 3 | 3 | 1.46 KB |
| 631 | `client/src/components/ui/slider.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 38 | 35 | 0 | 3 | 0.78 KB |
| 632 | `client/src/lib/mcp/engine/stages/ToolOutputEvaluator.ts` | TypeScript | Client (Next.js / React Web UI) | 38 | 34 | 0 | 4 | 1.3 KB |
| 633 | `client/src/lib/p2p/crypto/ratchet/replay-sliding-window.ts` | TypeScript | Client (Next.js / React Web UI) | 38 | 28 | 4 | 6 | 0.88 KB |
| 634 | `client/src/stores/p2p/slices/governor.slice.ts` | TypeScript | Client (Next.js / React Web UI) | 38 | 33 | 0 | 5 | 1.04 KB |
| 635 | `client/src/stores/p2p/slices/ui.slice.ts` | TypeScript | Client (Next.js / React Web UI) | 38 | 33 | 0 | 5 | 1.25 KB |
| 636 | `client/src/lib/ai/on-device/on-device-engine.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 37 | 25 | 8 | 4 | 1.0 KB |
| 637 | `client/src/lib/chat/markdown-ast-cache.ts` | TypeScript | Client (Next.js / React Web UI) | 37 | 25 | 6 | 6 | 0.92 KB |
| 638 | `client/src/lib/mcp/resolvers/runtime/PythonRuntimeResolver.ts` | TypeScript | Client (Next.js / React Web UI) | 37 | 34 | 0 | 3 | 1.39 KB |
| 639 | `src/capabilities/types.ts` | TypeScript | Server (Holy Bible MCP Engine) | 37 | 33 | 0 | 4 | 0.89 KB |
| 640 | `src/resources/handlers/interlinear_resource_handler.ts` | TypeScript | Server (Holy Bible MCP Engine) | 37 | 29 | 3 | 5 | 1.2 KB |
| 641 | `client/drizzle/0000_loose_king_cobra.sql` | SQL | Client (Next.js / React Web UI) | 36 | 33 | 3 | 0 | 1.05 KB |
| 642 | `client/src/app/styles/animations.css` | CSS | Client (Next.js / React Web UI) | 36 | 28 | 3 | 5 | 0.61 KB |
| 643 | `client/src/components/chat/dock/source/SourceModalHeader.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 36 | 32 | 0 | 4 | 1.19 KB |
| 644 | `client/src/components/ui/tooltip.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 36 | 32 | 0 | 4 | 0.98 KB |
| 645 | `client/src/lib/actions/provider.actions.ts` | TypeScript | Client (Next.js / React Web UI) | 36 | 31 | 0 | 5 | 1.23 KB |
| 646 | `src/osis_engine.ts` | TypeScript | Server (Holy Bible MCP Engine) | 36 | 30 | 0 | 6 | 1.32 KB |
| 647 | `src/search/rrf_calculator.ts` | TypeScript | Server (Holy Bible MCP Engine) | 36 | 32 | 0 | 4 | 1.21 KB |
| 648 | `client/android/app/src/main/java/com/holy/bible/mcp/speech/AudioBufferManager.java` | Java | Android (Native Java/Gradle/XML) | 35 | 26 | 3 | 6 | 0.91 KB |
| 649 | `client/src/hooks/useStatusHysteresis.ts` | TypeScript | Client (Next.js / React Web UI) | 35 | 23 | 8 | 4 | 1.2 KB |
| 650 | `client/src/lib/diagnostics/exec-helper.ts` | TypeScript | Client (Next.js / React Web UI) | 35 | 29 | 3 | 3 | 0.87 KB |
| 651 | `client/src/lib/mcp/sanitizers/context-sanitizer.ts` | TypeScript | Client (Next.js / React Web UI) | 35 | 26 | 3 | 6 | 1.24 KB |
| 652 | `src/workers/scripture_graph_worker.ts` | TypeScript | Server (Holy Bible MCP Engine) | 35 | 24 | 7 | 4 | 0.89 KB |
| 653 | `client/android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml` | XML | Android (Native Java/Gradle/XML) | 34 | 34 | 0 | 0 | 1.84 KB |
| 654 | `client/src/app/api/mcp/context/route.ts` | TypeScript | Client (Next.js / React Web UI) | 34 | 30 | 0 | 4 | 1.26 KB |
| 655 | `client/src/lib/ai/dynamic-resolver/hf-api-cached-client.ts` | TypeScript | Client (Next.js / React Web UI) | 34 | 28 | 4 | 2 | 1.03 KB |
| 656 | `client/src/lib/hardware/benchmark.ts` | TypeScript | Client (Next.js / React Web UI) | 34 | 27 | 4 | 3 | 1.03 KB |
| 657 | `client/src/lib/mcp/streams/stream-guard.ts` | TypeScript | Client (Next.js / React Web UI) | 34 | 20 | 9 | 5 | 1.03 KB |
| 658 | `client/src/lib/p2p/transport/webrtc/ZeroCopyFrameCodec.ts` | TypeScript | Client (Next.js / React Web UI) | 34 | 31 | 0 | 3 | 0.8 KB |
| 659 | `client/src/stores/p2p/services/QrNonceValidator.ts` | TypeScript | Client (Next.js / React Web UI) | 34 | 25 | 3 | 6 | 1.0 KB |
| 660 | `src/i18n/mcp_locales.ts` | TypeScript | Server (Holy Bible MCP Engine) | 34 | 23 | 9 | 2 | 2.23 KB |
| 661 | `src/resources/handlers/crossref_resource_handler.ts` | TypeScript | Server (Holy Bible MCP Engine) | 34 | 27 | 3 | 4 | 1.02 KB |
| 662 | `client/src/app/styles/glassmorphism.css` | CSS | Client (Next.js / React Web UI) | 33 | 26 | 3 | 4 | 0.87 KB |
| 663 | `client/src/lib/ai/stream/thinking-budget-limiter.ts` | TypeScript | Client (Next.js / React Web UI) | 33 | 24 | 3 | 6 | 0.86 KB |
| 664 | `client/src/lib/diagnostics/inspectors/windows/cim_batch_runner.ts` | TypeScript | Client (Next.js / React Web UI) | 33 | 30 | 0 | 3 | 1.24 KB |
| 665 | `client/src/lib/mcp/engine/stages/PromptComplexityClassifier.ts` | TypeScript | Client (Next.js / React Web UI) | 33 | 26 | 3 | 4 | 1.16 KB |
| 666 | `client/src/lib/p2p/crypto/primitives/curve25519.ts` | TypeScript | Client (Next.js / React Web UI) | 33 | 24 | 4 | 5 | 1.16 KB |
| 667 | `client/src/lib/p2p/transport/webrtc/metrics-tracker.ts` | TypeScript | Client (Next.js / React Web UI) | 33 | 25 | 3 | 5 | 0.97 KB |
| 668 | `src/tools/handlers/morphology.handlers.ts` | TypeScript | Server (Holy Bible MCP Engine) | 33 | 29 | 0 | 4 | 1.37 KB |
| 669 | `client/src/components/chat/AmbientFluidBackground.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 32 | 28 | 0 | 4 | 1.33 KB |
| 670 | `client/src/lib/ai/adapters/openrouter.adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 32 | 26 | 0 | 6 | 1.16 KB |
| 671 | `client/src/components/chat/dock/FileDropZone.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 31 | 28 | 0 | 3 | 1.24 KB |
| 672 | `client/src/components/chat/header/HeaderWarmthTrigger.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 31 | 27 | 0 | 4 | 1.13 KB |
| 673 | `client/src/lib/mcp/downloader/database-verifier.ts` | TypeScript | Client (Next.js / React Web UI) | 31 | 27 | 0 | 4 | 1.07 KB |
| 674 | `client/src/lib/p2p/crypto/primitives/csprng.ts` | TypeScript | Client (Next.js / React Web UI) | 31 | 20 | 7 | 4 | 1.16 KB |
| 675 | `client/src/lib/p2p/transport/webrtc/backpressure-controller.ts` | TypeScript | Client (Next.js / React Web UI) | 31 | 26 | 0 | 5 | 1.21 KB |
| 676 | `src/cli/commands/verify_db.ts` | TypeScript | Server (Holy Bible MCP Engine) | 31 | 27 | 0 | 4 | 1.18 KB |
| 677 | `client/src/components/settings/profile/ThemeSelector.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 30 | 27 | 0 | 3 | 1.07 KB |
| 678 | `client/src/lib/ai/on-device/prompt/throttled-token-streamer.ts` | TypeScript | Client (Next.js / React Web UI) | 30 | 23 | 3 | 4 | 0.81 KB |
| 679 | `client/src/lib/ai/stream/SseChunkParser.ts` | TypeScript | Client (Next.js / React Web UI) | 30 | 27 | 0 | 3 | 0.72 KB |
| 680 | `client/src/lib/mcp/downloader/ApfsCloneEngine.ts` | TypeScript | Client (Next.js / React Web UI) | 30 | 28 | 0 | 2 | 1.13 KB |
| 681 | `client/src/lib/mcp/mcp-client.ts` | TypeScript | Client (Next.js / React Web UI) | 30 | 18 | 7 | 5 | 0.99 KB |
| 682 | `client/src/lib/p2p/orchestrator/McpTierPolicyEngine.ts` | TypeScript | Client (Next.js / React Web UI) | 30 | 25 | 3 | 2 | 0.73 KB |
| 683 | `client/src/lib/p2p/transport/webrtc/ice-connection-manager.ts` | TypeScript | Client (Next.js / React Web UI) | 30 | 28 | 0 | 2 | 0.96 KB |
| 684 | `client/src/stores/chat/useStreamTransientStore.ts` | TypeScript | Client (Next.js / React Web UI) | 30 | 18 | 7 | 5 | 0.9 KB |
| 685 | `src/cli/commands/download_db.ts` | TypeScript | Server (Holy Bible MCP Engine) | 30 | 25 | 0 | 5 | 1.01 KB |
| 686 | `client/android/build.gradle` | Gradle | Android (Native Java/Gradle/XML) | 29 | 20 | 3 | 6 | 0.62 KB |
| 687 | `client/src/lib/ai/core/ProviderDispatcher.ts` | TypeScript | Client (Next.js / React Web UI) | 29 | 23 | 3 | 3 | 1.24 KB |
| 688 | `client/src/lib/p2p/crypto/ratchet/traffic-padding.ts` | TypeScript | Client (Next.js / React Web UI) | 29 | 23 | 4 | 2 | 1.18 KB |
| 689 | `src/directives/directive_path_resolver.ts` | TypeScript | Server (Holy Bible MCP Engine) | 29 | 25 | 0 | 4 | 1.34 KB |
| 690 | `client/android/app/src/main/java/com/holy/bible/mcp/service/P2PMeshWorker.java` | Java | Android (Native Java/Gradle/XML) | 28 | 19 | 5 | 4 | 0.76 KB |
| 691 | `client/src/components/p2p/pairing/DeviceTypeBadge.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 28 | 24 | 0 | 4 | 1.37 KB |
| 692 | `client/src/lib/ai/core/pipeline/execution-context-builder.ts` | TypeScript | Client (Next.js / React Web UI) | 28 | 26 | 0 | 2 | 1.3 KB |
| 693 | `client/src/lib/mcp/downloader/BackpressuredStreamWriter.ts` | TypeScript | Client (Next.js / React Web UI) | 28 | 26 | 0 | 2 | 1.01 KB |
| 694 | `client/src/lib/mcp/engine/pipelines/ComplexityPipeline.ts` | TypeScript | Client (Next.js / React Web UI) | 28 | 26 | 0 | 2 | 0.83 KB |
| 695 | `client/src/lib/p2p/transport/webrtc/types.ts` | TypeScript | Client (Next.js / React Web UI) | 28 | 26 | 0 | 2 | 0.98 KB |
| 696 | `client/src/lib/shared/atomic-file-writer.ts` | TypeScript | Client (Next.js / React Web UI) | 28 | 21 | 4 | 3 | 0.9 KB |
| 697 | `client/src/stores/p2p/services/p2p-signaling.service.ts` | TypeScript | Client (Next.js / React Web UI) | 28 | 25 | 0 | 3 | 0.87 KB |
| 698 | `src/database/connection/statement_compiler.ts` | TypeScript | Server (Holy Bible MCP Engine) | 28 | 21 | 3 | 4 | 0.79 KB |
| 699 | `src/database/connection/wal_checkpoint_manager.ts` | TypeScript | Server (Holy Bible MCP Engine) | 28 | 21 | 3 | 4 | 0.76 KB |
| 700 | `client/src/lib/ai/stream/token-sanitizer.ts` | TypeScript | Client (Next.js / React Web UI) | 27 | 18 | 6 | 3 | 1.28 KB |
| 701 | `client/src/lib/mcp/storage/storage-types.ts` | TypeScript | Client (Next.js / React Web UI) | 27 | 24 | 0 | 3 | 0.64 KB |
| 702 | `src/workers/types.ts` | TypeScript | Server (Holy Bible MCP Engine) | 27 | 25 | 0 | 2 | 0.53 KB |
| 703 | `client/src/app/styles/markdown-prose.css` | CSS | Client (Next.js / React Web UI) | 26 | 20 | 3 | 3 | 0.55 KB |
| 704 | `client/src/components/mcp/cards/ServerPingLatencyBadge.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 26 | 16 | 5 | 5 | 0.81 KB |
| 705 | `client/src/lib/mcp-registry/catalog/index.ts` | TypeScript | Client (Next.js / React Web UI) | 26 | 23 | 0 | 3 | 0.9 KB |
| 706 | `client/src/lib/p2p/crypto/pq/pq-types.ts` | TypeScript | Client (Next.js / React Web UI) | 26 | 21 | 3 | 2 | 0.67 KB |
| 707 | `client/src/lib/ai/stream/BackpressureController.ts` | TypeScript | Client (Next.js / React Web UI) | 25 | 18 | 3 | 4 | 0.59 KB |
| 708 | `client/src/lib/models/pull-formatters.ts` | TypeScript | Client (Next.js / React Web UI) | 25 | 20 | 3 | 2 | 1.09 KB |
| 709 | `client/src/lib/p2p/crypto/qr-decoder/jsqr-loader.ts` | TypeScript | Client (Next.js / React Web UI) | 25 | 19 | 3 | 3 | 0.78 KB |
| 710 | `client/src/workers/pow-miner.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 25 | 22 | 0 | 3 | 0.84 KB |
| 711 | `src/morphology_engine.ts` | TypeScript | Server (Holy Bible MCP Engine) | 25 | 17 | 5 | 3 | 1.06 KB |
| 712 | `src/tools/definitions.ts` | TypeScript | Server (Holy Bible MCP Engine) | 25 | 23 | 0 | 2 | 0.67 KB |
| 713 | `client/src/app/styles/mcp.css` | CSS | Client (Next.js / React Web UI) | 24 | 21 | 1 | 2 | 0.54 KB |
| 714 | `client/src/lib/p2p/orchestrator/McpRpcProtocol.ts` | TypeScript | Client (Next.js / React Web UI) | 24 | 19 | 3 | 2 | 0.46 KB |
| 715 | `src/search/pastoral_counsel_matcher.ts` | TypeScript | Server (Holy Bible MCP Engine) | 24 | 22 | 0 | 2 | 1.71 KB |
| 716 | `client/src/lib/mcp/registry/config-path-resolver.ts` | TypeScript | Client (Next.js / React Web UI) | 23 | 18 | 3 | 2 | 0.64 KB |
| 717 | `client/src/lib/p2p/files/DataChannelFlowController.ts` | TypeScript | Client (Next.js / React Web UI) | 23 | 17 | 3 | 3 | 0.7 KB |
| 718 | `client/android/app/capacitor.build.gradle` | Gradle | Android (Native Java/Gradle/XML) | 22 | 16 | 1 | 5 | 0.57 KB |
| 719 | `client/android/gradle.properties` | Java Properties | Android (Native Java/Gradle/XML) | 22 | 2 | 15 | 5 | 0.96 KB |
| 720 | `client/public/wllama/glue.d.ts` | TypeScript | Client (Next.js / React Web UI) | 22 | 16 | 6 | 0 | 0.72 KB |
| 721 | `client/src/components/chat/dock/useTextareaAutoHeight.ts` | TypeScript | Client (Next.js / React Web UI) | 22 | 16 | 4 | 2 | 0.63 KB |
| 722 | `client/src/components/chat/indicator/status-resolver.ts` | TypeScript | Client (Next.js / React Web UI) | 22 | 18 | 3 | 1 | 1.35 KB |
| 723 | `client/src/lib/hardware/useContentBlur.ts` | TypeScript | Client (Next.js / React Web UI) | 22 | 16 | 3 | 3 | 0.61 KB |
| 724 | `client/src/lib/p2p/crypto/qr-decoder.ts` | TypeScript | Client (Next.js / React Web UI) | 22 | 14 | 4 | 4 | 0.47 KB |
| 725 | `client/android/app/proguard-rules.pro` | Proguard Rules | Android (Native Java/Gradle/XML) | 21 | 0 | 18 | 3 | 0.73 KB |
| 726 | `client/src/components/chat/header/palette-utils.ts` | TypeScript | Client (Next.js / React Web UI) | 21 | 18 | 0 | 3 | 2.65 KB |
| 727 | `client/src/hooks/useDebounce.ts` | TypeScript | Client (Next.js / React Web UI) | 21 | 13 | 4 | 4 | 0.54 KB |
| 728 | `client/src/i18n/request.ts` | TypeScript | Client (Next.js / React Web UI) | 21 | 16 | 0 | 5 | 0.54 KB |
| 729 | `client/src/lib/ai/core/token-allocator.ts` | TypeScript | Client (Next.js / React Web UI) | 21 | 16 | 4 | 1 | 1.01 KB |
| 730 | `client/src/lib/p2p/crypto/pq/pq-frame-codec.ts` | TypeScript | Client (Next.js / React Web UI) | 21 | 17 | 3 | 1 | 0.68 KB |
| 731 | `client/src/lib/ai/adapters/base.adapter.ts` | TypeScript | Client (Next.js / React Web UI) | 20 | 15 | 1 | 4 | 0.71 KB |
| 732 | `client/src/lib/ai/streaming/executors/types.ts` | TypeScript | Client (Next.js / React Web UI) | 20 | 19 | 0 | 1 | 0.56 KB |
| 733 | `client/src/lib/mcp/registry/config-normalizer.ts` | TypeScript | Client (Next.js / React Web UI) | 20 | 15 | 3 | 2 | 0.95 KB |
| 734 | `client/docker-compose.yml` | YAML | Client (Next.js / React Web UI) | 19 | 17 | 0 | 2 | 0.3 KB |
| 735 | `client/src/components/p2p/P2pClientSheet.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 19 | 10 | 5 | 4 | 0.46 KB |
| 736 | `client/src/components/p2p/P2pHostSheet.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 19 | 10 | 5 | 4 | 0.44 KB |
| 737 | `client/eslint.config.mjs` | JavaScript (ESM) | Client (Next.js / React Web UI) | 18 | 14 | 2 | 2 | 0.45 KB |
| 738 | `client/src/app/styles/mobile.css` | CSS | Client (Next.js / React Web UI) | 18 | 10 | 5 | 3 | 0.55 KB |
| 739 | `client/src/components/p2p/client/P2pDecodeProgressBanner.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 18 | 16 | 0 | 2 | 0.51 KB |
| 740 | `client/src/lib/mcp-registry/catalog/biblical.ts` | TypeScript | Client (Next.js / React Web UI) | 18 | 17 | 0 | 1 | 0.66 KB |
| 741 | `src/capabilities.ts` | TypeScript | Server (Holy Bible MCP Engine) | 18 | 9 | 8 | 1 | 0.55 KB |
| 742 | `src/capabilities/model_tier_matrix.ts` | TypeScript | Server (Holy Bible MCP Engine) | 18 | 7 | 9 | 2 | 0.58 KB |
| 743 | `client/src/lib/p2p/crypto/pure-crypto-fallback.ts` | TypeScript | Client (Next.js / React Web UI) | 17 | 6 | 10 | 1 | 0.66 KB |
| 744 | `client/src/workers/blob-streamer.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 17 | 16 | 0 | 1 | 0.65 KB |
| 745 | `client/android/app/src/main/res/anim/camera_fade_in.xml` | XML | Android (Native Java/Gradle/XML) | 16 | 16 | 0 | 0 | 0.5 KB |
| 746 | `client/android/app/src/main/res/anim/camera_fade_out.xml` | XML | Android (Native Java/Gradle/XML) | 16 | 16 | 0 | 0 | 0.5 KB |
| 747 | `client/android/app/src/main/res/values-ru/strings.xml` | XML | Android (Native Java/Gradle/XML) | 16 | 16 | 0 | 0 | 1.1 KB |
| 748 | `client/android/app/src/main/res/values-uk/strings.xml` | XML | Android (Native Java/Gradle/XML) | 16 | 16 | 0 | 0 | 1.09 KB |
| 749 | `client/android/app/src/main/res/values/strings.xml` | XML | Android (Native Java/Gradle/XML) | 16 | 16 | 0 | 0 | 0.9 KB |
| 750 | `client/android/variables.gradle` | Gradle | Android (Native Java/Gradle/XML) | 16 | 16 | 0 | 0 | 0.49 KB |
| 751 | `client/drizzle/0001_ambitious_nightcrawler.sql` | SQL | Client (Next.js / React Web UI) | 16 | 15 | 1 | 0 | 0.65 KB |
| 752 | `client/src/lib/p2p/crypto/primitives/crypto-worker-types.ts` | TypeScript | Client (Next.js / React Web UI) | 16 | 11 | 3 | 2 | 1.07 KB |
| 753 | `client/android/capacitor.settings.gradle` | Gradle | Android (Native Java/Gradle/XML) | 15 | 10 | 1 | 4 | 0.76 KB |
| 754 | `client/src/i18n/routing.ts` | TypeScript | Client (Next.js / React Web UI) | 15 | 8 | 4 | 3 | 0.48 KB |
| 755 | `client/src/lib/ai/on-device/storage/gguf-validator.ts` | TypeScript | Client (Next.js / React Web UI) | 15 | 11 | 4 | 0 | 0.53 KB |
| 756 | `client/src/lib/workers/parser.worker.ts` | TypeScript | Client (Next.js / React Web UI) | 15 | 13 | 0 | 2 | 0.62 KB |
| 757 | `client/src/lib/p2p/crypto/ratchet-cipher.ts` | TypeScript | Client (Next.js / React Web UI) | 14 | 7 | 4 | 3 | 0.56 KB |
| 758 | `client/src/lib/utils.ts` | TypeScript | Client (Next.js / React Web UI) | 14 | 12 | 0 | 2 | 0.41 KB |
| 759 | `client/src/lib/mcp/engine/stages/ContextSynthesisPipeline.ts` | TypeScript | Client (Next.js / React Web UI) | 13 | 12 | 0 | 1 | 0.44 KB |
| 760 | `client/src/stores/p2p/services/PeerRevocationCoordinator.ts` | TypeScript | Client (Next.js / React Web UI) | 13 | 13 | 0 | 0 | 0.41 KB |
| 761 | `client/android/app/src/main/res/drawable/ic_scanner_reticle_hud.xml` | XML | Android (Native Java/Gradle/XML) | 12 | 11 | 1 | 0 | 0.47 KB |
| 762 | `client/android/app/src/main/res/layout/activity_main.xml` | XML | Android (Native Java/Gradle/XML) | 12 | 11 | 0 | 1 | 0.52 KB |
| 763 | `client/src/lib/ai/on-device/models-catalog.ts` | TypeScript | Client (Next.js / React Web UI) | 12 | 5 | 4 | 3 | 0.38 KB |
| 764 | `client/src/lib/p2p/files/ChunkChecksumEngine.ts` | TypeScript | Client (Next.js / React Web UI) | 12 | 11 | 0 | 1 | 0.56 KB |
| 765 | `smithery.yaml` | YAML | Root / Shared | 12 | 8 | 2 | 2 | 0.21 KB |
| 766 | `src/database.ts` | TypeScript | Server (Holy Bible MCP Engine) | 11 | 11 | 0 | 0 | 0.33 KB |
| 767 | `client/drizzle.config.ts` | TypeScript | Client (Next.js / React Web UI) | 10 | 9 | 0 | 1 | 0.2 KB |
| 768 | `client/src/app/api/chat/route.ts` | TypeScript | Client (Next.js / React Web UI) | 10 | 7 | 0 | 3 | 0.35 KB |
| 769 | `client/src/components/p2p/client/P2pCameraScannerView.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 10 | 3 | 5 | 2 | 0.27 KB |
| 770 | `client/src/lib/ai/index.ts` | TypeScript | Client (Next.js / React Web UI) | 10 | 10 | 0 | 0 | 0.42 KB |
| 771 | `client/android/app/src/main/res/drawable/ic_scanner_close.xml` | XML | Android (Native Java/Gradle/XML) | 9 | 9 | 0 | 0 | 0.36 KB |
| 772 | `client/android/app/src/main/res/drawable/ic_scanner_flip.xml` | XML | Android (Native Java/Gradle/XML) | 9 | 9 | 0 | 0 | 0.42 KB |
| 773 | `client/android/app/src/main/res/drawable/ic_scanner_torch_selector.xml` | XML | Android (Native Java/Gradle/XML) | 9 | 9 | 0 | 0 | 0.28 KB |
| 774 | `client/android/app/src/main/res/xml/network_security_config.xml` | XML | Android (Native Java/Gradle/XML) | 9 | 9 | 0 | 0 | 0.29 KB |
| 775 | `client/src/components/chat/dock/source/index.ts` | TypeScript | Client (Next.js / React Web UI) | 9 | 9 | 0 | 0 | 0.32 KB |
| 776 | `client/src/components/mcp/cards/ServerConfigMenu.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 9 | 2 | 5 | 2 | 0.25 KB |
| 777 | `client/src/components/mcp/cards/ServerToolsAccordion.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 9 | 2 | 5 | 2 | 0.23 KB |
| 778 | `client/src/components/mcp/modals/CustomCommandTab.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 9 | 2 | 5 | 2 | 0.24 KB |
| 779 | `client/src/components/mcp/modals/NpmSearchTab.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 9 | 2 | 5 | 2 | 0.24 KB |
| 780 | `client/src/components/p2p/host/HostConnectedGuestsTable.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 9 | 2 | 5 | 2 | 0.26 KB |
| 781 | `client/src/components/p2p/host/HostQrTokenGenerator.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 9 | 2 | 5 | 2 | 0.24 KB |
| 782 | `client/src/components/p2p/host/HostResourceQuotaControls.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 9 | 2 | 5 | 2 | 0.25 KB |
| 783 | `client/src/lib/actions/provider-url-utils.ts` | TypeScript | Client (Next.js / React Web UI) | 9 | 6 | 3 | 0 | 0.31 KB |
| 784 | `client/src/lib/models/token-estimator.ts` | TypeScript | Client (Next.js / React Web UI) | 9 | 6 | 3 | 0 | 0.33 KB |
| 785 | `client/src/proxy.ts` | TypeScript | Client (Next.js / React Web UI) | 9 | 6 | 1 | 2 | 0.24 KB |
| 786 | `client/android/capacitor-cordova-android-plugins/src/main/AndroidManifest.xml` | XML | Android (Native Java/Gradle/XML) | 8 | 6 | 0 | 2 | 0.24 KB |
| 787 | `client/global.d.ts` | TypeScript | Client (Next.js / React Web UI) | 8 | 5 | 1 | 2 | 0.17 KB |
| 788 | `client/android/capacitor-cordova-android-plugins/cordova.variables.gradle` | Gradle | Android (Native Java/Gradle/XML) | 7 | 5 | 2 | 0 | 0.3 KB |
| 789 | `client/android/gradle/wrapper/gradle-wrapper.properties` | Java Properties | Android (Native Java/Gradle/XML) | 7 | 7 | 0 | 0 | 0.25 KB |
| 790 | `client/next-env.d.ts` | TypeScript | Client (Next.js / React Web UI) | 7 | 2 | 4 | 1 | 0.29 KB |
| 791 | `client/src/app/api/mcp/configs/route.ts` | TypeScript | Client (Next.js / React Web UI) | 7 | 6 | 0 | 1 | 0.21 KB |
| 792 | `client/android/app/src/main/res/xml/config.xml` | XML | Android (Native Java/Gradle/XML) | 6 | 4 | 0 | 2 | 0.18 KB |
| 793 | `client/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` | XML | Android (Native Java/Gradle/XML) | 5 | 5 | 0 | 0 | 0.26 KB |
| 794 | `client/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` | XML | Android (Native Java/Gradle/XML) | 5 | 5 | 0 | 0 | 0.26 KB |
| 795 | `client/android/app/src/main/res/xml/file_paths.xml` | XML | Android (Native Java/Gradle/XML) | 5 | 5 | 0 | 0 | 0.21 KB |
| 796 | `client/android/settings.gradle` | Gradle | Android (Native Java/Gradle/XML) | 5 | 4 | 0 | 1 | 0.2 KB |
| 797 | `client/postcss.config.cjs` | JavaScript (CommonJS) | Client (Next.js / React Web UI) | 5 | 5 | 0 | 0 | 0.07 KB |
| 798 | `src/database/sqlite_connection_pool.ts` | TypeScript | Server (Holy Bible MCP Engine) | 5 | 1 | 3 | 1 | 0.12 KB |
| 799 | `src/tools_registry.ts` | TypeScript | Server (Holy Bible MCP Engine) | 5 | 4 | 0 | 1 | 0.29 KB |
| 800 | `client/android/app/src/main/res/values/ic_launcher_background.xml` | XML | Android (Native Java/Gradle/XML) | 4 | 4 | 0 | 0 | 0.12 KB |
| 801 | `client/public/capacitor.js` | JavaScript | Client (Next.js / React Web UI) | 3 | 1 | 2 | 0 | 8.51 KB |
| 802 | `client/src/components/p2p/details/NodeOverviewTab.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 2 | 2 | 0 | 0 | 0.12 KB |
| 803 | `client/src/components/p2p/details/NodeSecurityTab.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 2 | 2 | 0 | 0 | 0.11 KB |
| 804 | `client/src/components/p2p/details/NodeTelemetryTab.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 2 | 2 | 0 | 0 | 0.11 KB |
| 805 | `client/src/components/p2p/tabs/P2pManualConnectTab.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 2 | 2 | 0 | 0 | 0.13 KB |
| 806 | `client/src/components/p2p/tabs/P2pPairedNodesTab.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 2 | 2 | 0 | 0 | 0.13 KB |
| 807 | `client/src/components/p2p/tabs/P2pScannerTab.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 2 | 2 | 0 | 0 | 0.12 KB |
| 808 | `client/src/components/settings/providers/LocalProviderPullProgress.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 2 | 2 | 0 | 0 | 0.12 KB |
| 809 | `client/android/local.properties` | Java Properties | Android (Native Java/Gradle/XML) | 1 | 1 | 0 | 0 | 0.04 KB |
| 810 | `client/public/wllama/source-map.d.ts` | TypeScript | Client (Next.js / React Web UI) | 1 | 1 | 0 | 0 | 0.06 KB |
| 811 | `client/src/components/chat/renderer/markdown-ast-cache.ts` | TypeScript | Client (Next.js / React Web UI) | 1 | 1 | 0 | 0 | 0.05 KB |
| 812 | `client/src/components/mcp/McpConfigDrawer.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 1 | 1 | 0 | 0 | 0.04 KB |
| 813 | `client/src/components/mcp/McpMetricsHeader.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 1 | 1 | 0 | 0 | 0.04 KB |
| 814 | `client/src/components/mcp/McpServerGrid.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 1 | 1 | 0 | 0 | 0.04 KB |
| 815 | `client/src/components/mcp/McpToolCatalog.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 1 | 1 | 0 | 0 | 0.04 KB |
| 816 | `client/src/lib/icons/icon-registry.tsx` | TypeScript (React) | Client (Next.js / React Web UI) | 1 | 1 | 0 | 0 | 0.05 KB |
| 817 | `client/android/app/src/main/assets/public/cordova.js` | JavaScript | Android (Native Java/Gradle/XML) | 0 | 0 | 0 | 0 | 0.0 KB |
| 818 | `client/android/app/src/main/assets/public/cordova_plugins.js` | JavaScript | Android (Native Java/Gradle/XML) | 0 | 0 | 0 | 0 | 0.0 KB |