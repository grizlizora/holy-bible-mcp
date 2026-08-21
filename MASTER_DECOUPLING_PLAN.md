# 🏛️ ПОВНИЙ МОНОЛІТНИЙ ЗВІТ ПОФАЙЛОВОГО АУДИТУ ТА ГЕНЕРАЛЬНИЙ ПЛАН ДЕРЕСИФІКАЦІЇ

> **Роль:** Головний системний архітектор та Lead-розробник (Головна нейромережа)  
> **Статус протоколу:** 🛑 ЕТАП 2 ЗАВЕРШЕНО — ЗВІТ ЗГЕНЕРОВАНО, КОДУ НЕ ЗМІНЕНО  
> **Очікування команди користувача для переходу до Етапу 3 (Покрокова реалізація)**  
> **Цільове покриття платформ:** macOS (Apple Silicon ARM64 / Intel x64), Windows 10/11 (x64 / ARM64), Linux (x64 / ARM64), iOS (WebKit / Capacitor 8.5), Android (API 26–35+ / Capacitor 8.5)

---

## 📑 ЗМІСТ ТА СТРУКТУРА ЗВІТУ
1. [Матриця розподілу пулу файлів на оптимальні пачки аудиту](#1-матриця-розподілу-пулу-файлів-на-оптимальні-пачки-аудиту)
2. [Поглиблений пофайловий аудит 96 ключових модулів за 7 обов'язковими критеріями](#2-поглиблений-пофайловий-аудит-96-ключових-модулів)
   - 🌐 [Секція 1: P2P Mesh Network & Swarm Protocol (15 файлів)](#секція-1-p2p-mesh-network--swarm-protocol)
   - 🔌 [Секція 2: MCP Client & Server Infrastructure, Tool Registry & DB Layer (20 файлів)](#секція-2-mcp-client--server-infrastructure-tool-registry--db-layer)
   - 🧠 [Секція 3: Client AI Intelligence, On-Device Inference & Web Workers (19 файлів)](#секція-3-client-ai-intelligence-on-device-inference--web-workers)
   - 🎨 [Секція 4: Frontend UI & Application Shell (20 файлів)](#секція-4-frontend-ui--application-shell)
   - 📱 [Секція 5: Mobile Android Native Subsystem & State Persistence (22 файли)](#секція-5-mobile-android-native-subsystem--state-persistence)
3. [Критичний архітектурний брейншторм Головного системного архітектора](#3-критичний-архітектурний-брейншторм)
4. [Монолітний Генеральний план поетапної дересифікації (6 нумерованих етапів)](#4-монолітний-генеральний-план-поетапної-дересифікації)
5. [Протокольна зупинка та очікування команди (Human-in-the-Loop)](#5-протокольна-зупинка-human-in-the-loop)

---

## 1. МАТРИЦЯ РОЗПОДІЛУ ПУЛУ ФАЙЛІВ НА ОПТИМАЛЬНІ ПАЧКИ АУДИТУ

| Спеціалізований Агент-Аудитор | Кількість файлів / LOC | Ключові технології та підсистеми |
| :--- | :---: | :--- |
| 🌐 **`p2p_mesh_auditor`** | **165** файлів / **16,919** LOC | WebRTC DataChannels, Noble Crypto Suite, ML-KEM-768, Kademlia DHT, GossipSub Mesh, Yjs CRDT |
| 🔌 **`mcp_core_auditor`** | **121** файл / **13,511** LOC | MCP Client Gateway, Tool Registry, Universal Schema Mapper, SQLite WAL Pool, FTS5 BM25, Piscina Workers |
| 🧠 **`ai_workers_auditor`** | **125** файлів / **13,460** LOC | WebGPU Engine, WASM (Wllama), OPFS Storage, FP8 Tensor Quantizer, Hybrid RAG, Multi-Model Routing |
| 🎨 **`frontend_ui_auditor`** | **205** файлів / **23,615** LOC | Chat MessageList (TanStack Virtual), InputDock, Settings Panels, Sidebar, Web Audio API, Next.js Shell |
| 📱 **`native_persistence_auditor`** | **85** файлів / **6,083** LOC | Android Java Plugins, CameraX 1.4, Keystore HSM, P2P Foreground Service, Drizzle ORM, IndexedDB |

---

## 2. ПОГЛИБЛЕНИЙ ПОФАЙЛОВИЙ АУДИТ 96 КЛЮЧОВИХ МОДУЛІВ

---

### СЕКЦІЯ 1: P2P MESH NETWORK & SWARM PROTOCOL (15 МОДУЛІВ)

#### 1. [`client/src/lib/p2p/crypto/mlkem-postquantum-adapter.ts`](file:///Users/roman/Downloads/holy/client/src/lib/p2p/crypto/mlkem-postquantum-adapter.ts) (243 LOC)
- **1. Дересифікація / Багатопоточність:** SHAKE256 великих буферів (2400/1184 байти) блокує UI. Винести у `p2p-transport.worker.ts`.
- **2. Взаємозв'язки:** Імпортує `@noble/hashes`, `@noble/curves`. Викликається `pq-hybrid-ratchet.ts`.
- **3. Баги та чорні плями:** 🔴 **Критична вразливість безпеки:** Псевдо-ML-KEM. Алгоритм не реалізує решітчасту криптографію MLWE, а хешує публічний ключ через `SHAKE256` і шифрує симетричним `AES-GCM`. Будь-хто, перехопивши публічний ключ, може розшифрувати «постквантовий» спільний секрет. Квантовий захист дорівнює 0.
- **4. Заглушки:** Симуляція під виглядом стандарту NIST FIPS 203.
- **5. Ризики розділення:** Збільшення розміру публічного ключа до 1184 байт та шифротексту до 1088 байт.
- **6. Open-Source інтеграція:** Замінити на офіційний `@noble/post-quantum/ml-kem` (`ml_kem_768`).
- **7. План розділення:** 1) Видалити самописний код; 2) Інтегрувати `@noble/post-quantum`; 3) Винести інкапсуляцію у Web Worker.

#### 2. [`client/src/lib/p2p/state/yjs-sync-mesh.ts`](file:///Users/roman/Downloads/holy/client/src/lib/p2p/state/yjs-sync-mesh.ts) (228 LOC)
- **1. Дересифікація / Багатопоточність:** Синхронне парсування JSON-знімків блокує головний потік.
- **2. Взаємозв'язки:** З'єднує P2P канали зі сховищем чатів.
- **3. Баги та чорні плями:** 🔴 **Псевдо-CRDT:** Файл не імпортує `yjs`. Реалізовано примітивний LWW-словник. Конфлікти вкладених полів перезаписуються цілком замість злиття; `deletedKeys` накопичуються нескінченно (витік пам'яті).
- **4. Заглушки:** Оманлива назва файлу, що симулює роботу Yjs.
- **5. Ризики після розділення:** Втрата даних при паралельному редагуванні нотаток або чатів у різних вузлах.
- **6. Open-Source інтеграція:** Офіційний `yjs` (`Y.Doc`, `Y.Map`) + `y-protocols/sync`.
- **7. План розділення:** 1) Інтегрувати справжній `yjs`; 2) Передавати двійкові дельти `Y.encodeStateAsUpdate`; 3) Додати GC видалених ключів.

#### 3. [`client/src/components/p2p/P2pHostModal.tsx`](file:///Users/roman/Downloads/holy/client/src/components/p2p/P2pHostModal.tsx) (375 LOC)
- **1. Дересифікація / Багатопоточність:** Збір телеметрії (`hostHardwareCollector`) та ротація QR виконуються синхронно кожні 3с/60с. Винести таймер у `qr-nonce.slice.ts`.
- **2. Взаємозв'язки:** Керує `P2pHostQrCard`, `P2pHostGovernor`, `P2pConnectedGuestsList`.
- **3. Баги та чорні плями:** 🔴 Хардкод fallback IP `'192.168.0.104'` блокує паринг у підмережах `10.0.0.x` та `172.16.x.x`.
- **4. Заглушки:** Прапорці протоколів `ohttp` та `confer` не мають бекенд-обробників.
- **5. Ризики після розділення:** Втрата валідності Nonce при паралельній ротації ключів.
- **6. Open-Source інтеграція:** `qrcode.react` (SVG mode).
- **7. План розділення:** 1) Видалити хардкод IP; 2) Реалізувати динамічне виявлення локальної IP-адреси через WebRTC Local Candidates.

#### 4. [`client/src/lib/p2p/mesh/kademlia-dht.ts`](file:///Users/roman/Downloads/holy/client/src/lib/p2p/mesh/kademlia-dht.ts) (201 LOC)
- **1. Дересифікація / Багатопоточність:** `generatePoWNodeId` містить синхронний `while(true)` на `crypto.subtle.digest`, що наглухо заморожує UI.
- **2. Взаємозв'язки:** `GossipSubMeshEngine` ➔ `TransportSender`.
- **3. Баги та чорні плями:** Помилка в обчисленні бакета DHT (`Math.clz32(nibble) - 28`); XOR-відстань рахується через повільні hex-рядки.
- **4. Заглушки:** Відсутні мережеві RPC (`FIND_NODE`, `STORE`).
- **5. Ризики після розділення:** Розрив зв'язності при виході сусідніх вузлів.
- **6. Open-Source інтеграція:** `@libp2p/kad-dht`.
- **7. План розділення:** 1) Перевести PoW у Web Worker; 2) Замінити hex-рядки на двійкові `Uint8Array`.

#### 5. [`client/src/lib/p2p/transport/webrtc-mesh-transport.ts`](file:///Users/roman/Downloads/holy/client/src/lib/p2p/transport/webrtc-mesh-transport.ts) (303 LOC)
- **1. Дересифікація / Багатопоточність:** AEAD-шифрування токенів ШІ виконується безпосередньо в UI-потоці через `P2PRatchetCipher`.
- **2. Взаємозв'язки:** Керує життєвим циклом RTCDataChannel, RTT пінгами та Backpressure.
- **3. Баги та чорні плями:** Відсутність очищення `channel.onmessage = null` при виклику `close()` (перешкоджає GC); витік таймера моніторингу пропускної здатності.
- **4. Заглушки:** Заглушка `MCP_TOOL_RPC_REQ` з фіктивною помилкою `'unsupported'`.
- **5. Ризики після розділення:** Порушення послідовності чанків токенів.
- **6. Open-Source інтеграція:** `@libp2p/webrtc`.
- **7. План розділення:** 1) Делегувати шифрування у `p2p-transport.worker.ts`; 2) Перейти на бінарні Transferable `ArrayBuffer`.

#### 6. [`client/src/components/p2p/P2pClientModal.tsx`](file:///Users/roman/Downloads/holy/client/src/components/p2p/P2pClientModal.tsx) (641 LOC)
- **1. Дересифікація:** Сканування камери через rAF та обробка галереї (`FileReader` + `decodeQrMultiScalePipeline`) навантажують UI.
- **2. Взаємозв'язки:** Керує `P2pQrScannerView`, `P2pManualConnect`, `P2pPairedNodesList`.
- **3. Баги:** Витік `MediaStreamTrack` при швидкому закритті модалки; подвійні rAF-цикли при перемиканні камер.
- **4. Заглушки:** Fallback на `<input type="file">` блокується політиками Safari iOS.
- **5. Ризики:** Розсинхронізація нативного MLKit сканера.
- **6. Open-Source:** `@zxing/browser` + Web `BarcodeDetector`.
- **7. План:** Винести камеру в хук `useQrCameraScanner` з `AbortController`.

#### 7. [`client/src/components/p2p/P2pNodeDetailsModal.tsx`](file:///Users/roman/Downloads/holy/client/src/components/p2p/P2pNodeDetailsModal.tsx) (600 LOC)
- **1. Дересифікація:** 3 незалежні інтервали `setInterval` викликають зайві ре-рендери.
- **2. Взаємозв'язки:** Імпортує `NodePerformanceStats`, `NodeTelemetryGrid`, підписаний на `useP2pStore`.
- **3. Баги:** Утримання закритих сесій у `lastValidNodeRef.current` (витік пам'яті).
- **4. Заглушки:** Хардкод значень хоста (`18 GB VRAM`, `14.8 MB/s`) при затримці отримання даних.
- **5. Ризики:** Збій під час зміни квоти хоста при раптовому відключенні гостя.
- **6. Open-Source:** `@tanstack/react-virtual`, `recharts`.
- **7. План:** Розбити на 4 суб-модулі (`NodeHeader`, `NodeAiUsage`, `NodeTelemetry`, `NodeRevocation`).

#### 8. [`client/src/components/p2p/client/P2pQrScannerView.tsx`](file:///Users/roman/Downloads/holy/client/src/components/p2p/client/P2pQrScannerView.tsx) (350 LOC)
- **1. Дересифікація:** Чистий `React.memo` компонент.
- **2. Взаємозв'язки:** Викликається з `P2pClientModal.tsx`.
- **3. Баги:** `scale-x-[-1]` для передньої камери інвертує відео, але рамка залишається несинхронізованою.
- **4. Заглушки:** Статичний текст `Live (Auto • 720p)` замість реальної роздільної здатності.
- **5. Ризики:** Мінімальні.
- **6. Open-Source:** `@yudiel/react-qr-scanner`.
- **7. План:** Динамічний підрахунок роздільної здатності камери.

#### 9. [`client/src/lib/p2p/P2pMeshEngine.ts`](file:///Users/roman/Downloads/holy/client/src/lib/p2p/P2pMeshEngine.ts) (337 LOC)
- **1. Дересифікація:** Головний рушій координації мережі.
- **2. Взаємозв'язки:** `GossipSubMeshEngine`, `BackpressureController`, `TransportSender`.
- **3. Баги:** Витік пам'яті в `seenMessages` при високому навантаженні.
- **4. Заглушки:** Відсутній захист від Broadcast Storm.
- **5. Ризики:** Mesh Partitioning при виході вузлів.
- **6. Open-Source:** `@chainsafe/libp2p-gossipsub`.
- **7. План:** Впровадити LRU для `seenMessages` та батчинг відправлення.

#### 10. [`client/src/lib/p2p/types.ts`](file:///Users/roman/Downloads/holy/client/src/lib/p2p/types.ts) (286 LOC)
- **1. Дересифікація:** Чисті декларації типів TypeScript.
- **2. Взаємозв'язки:** Центральний імпорт для P2P підсистеми.
- **3. Баги:** Дублювання типів `P2pTokenChunk` та `TokenChunk`.
- **4. Заглушки:** Немає.
- **5. Ризики:** Порушення зворотної сумісності.
- **6. Open-Source:** `zod` валідація бінарних пакетів.
- **7. План:** Об'єднати дублікати типів.

#### 11. [`client/src/lib/p2p/transports/webrtc-transport.ts`](file:///Users/roman/Downloads/holy/client/src/lib/p2p/transports/webrtc-transport.ts) (270 LOC)
- **1. Дересифікація:** Застарілий модуль, що дублює `webrtc-mesh-transport.ts`.
- **2. Взаємозв'язки:** Legacy транспорт.
- **3. Баги:** Опитування RTT через `getStats()` кожні 2000 мс створює навантаження на батарею; Race condition при додаванні ICE-кандидатів.
- **4. Заглушки:** Відсутній захист від повторного `createOffer`.
- **5. Ризики:** Дублювання коду.
- **6. Open-Source:** Консолідація у `webrtc-mesh-transport.ts`.
- **7. План:** 🗑️ Видалити файл після міграції викликів.

#### 12. [`client/src/stores/useP2pStore.ts`](file:///Users/roman/Downloads/holy/client/src/stores/useP2pStore.ts) (268 LOC)
- **1. Дересифікація:** Центральний стан для UI та P2P сервісів.
- **2. Взаємозв'язки:** 8 слайсів, 4 сервіси.
- **3. Баги:** Глобальний `crossTabChannel.onmessage` перезаписується без очищення; `reconnectToSavedPeer` переводить хост у статус `online` без перевірки каналу.
- **4. Заглушки:** `approveClientPairing` скидає стан без відправки сигналу.
- **5. Ризики:** Циклічні імпорти між координатором та слайсами.
- **6. Open-Source:** `zustand/middleware` з OPFS-сховищем.
- **7. План:** Додати перевірку WebRTC Handshake перед `online` статусом; додати `crossTabChannel.close()`.

#### 13. [`client/src/components/p2p/P2pPairingConfirmModal.tsx`](file:///Users/roman/Downloads/holy/client/src/components/p2p/P2pPairingConfirmModal.tsx) (260 LOC)
- **1. Дересифікація:** Чистий селекторний рендеринг через `useShallow`.
- **2. Взаємозв'язки:** `DeviceTypeBadge`, `SasSecurityBadge`.
- **3. Баги:** Стан `localConfirmed` не скидається при надходженні нового запиту.
- **4. Заглушки:** Чекбокс `remember` ігнорується при автоматичному підтвердженні.
- **5. Ризики:** Низькі.
- **6. Open-Source:** `@radix-ui/react-dialog`.
- **7. План:** Передати параметр `remember` у `approvePairingRequest(requestId, remember)`.

#### 14. [`client/src/lib/p2p/mesh/gossipsub-mesh-engine.ts`](file:///Users/roman/Downloads/holy/client/src/lib/p2p/mesh/gossipsub-mesh-engine.ts) (244 LOC)
- **1. Дересифікація:** `Promise.allSettled` на кожне повідомлення перевантажує microtask queue.
- **2. Взаємозв'язки:** `TransportSender`, `BackpressureController`.
- **3. Баги:** Відсутність Score Decay дозволяє скомпрометованому вузлу накрутити рейтинг; `destroy()` не очищає бекпрешер пірів.
- **4. Заглушки:** `handleIWant` не має автоматичного механізму відповіді.
- **5. Ризики:** Broadcast Storm при передчасному очищенні `seenMessages`.
- **6. Open-Source:** `@chainsafe/libp2p-gossipsub`.
- **7. План:** Додати Score Decay раз на 1с; додати чергу пакетного відправлення.

#### 15. [`client/src/lib/p2p/crypto/noble-crypto-suite.ts`](file:///Users/roman/Downloads/holy/client/src/lib/p2p/crypto/noble-crypto-suite.ts) (311 LOC)
- **1. Дересифікація:** Константно-часові методи, сумісні з Web Workers.
- **2. Взаємозв'язки:** Фундамент для всієї криптографії.
- **3. Баги:** Синхронний виклик `require('crypto')` викликає попередження у бандлерах.
- **4. Заглушки:** Немає.
- **5. Ризики:** Мінімальні.
- **6. Open-Source:** `@noble/ciphers`, `@noble/curves`.
- **7. План:** Замінити `require('crypto')` на `globalThis.crypto`.

---

### СЕКЦІЯ 2: MCP CLIENT & SERVER INFRASTRUCTURE, TOOL REGISTRY & DB LAYER (20 МОДУЛІВ)

#### 1. [`client/src/lib/mcp-registry/catalog/seed-data.ts`](file:///Users/roman/Downloads/holy/client/src/lib/mcp-registry/catalog/seed-data.ts) (446 LOC)
- **1. Дересифікація:** Генерує 1000+ об'єктів у JS heap (+70 КБ bundle).
- **2. Взаємозв'язки:** Використовується `McpAddChoiceModal.tsx` та `/api/mcp/registry`.
- **3. Баги та заглушки:** 🔴 **Синтетичні фейкові пакети:** Блок `extraDomains` генерує тисячі вигаданих пакетів (`@mcp-catalog/aws-s3` тощо), яких не існує в npmjs.com. Їх встановлення гарантовано видає помилку `404 Not Found`.
- **4. Ризики:** Введення користувача в оману.
- **5. Open-Source інтеграція:** Синхронізація з Smithery.ai / Glama.ai.
- **6. План:** Видалити генератор `extraDomains`; залишити курований список перевірених пакетів.

#### 2. [`client/src/db/fts-setup.ts`](file:///Users/roman/Downloads/holy/client/src/db/fts-setup.ts) (66 LOC) та [`client/src/db/index.ts`](file:///Users/roman/Downloads/holy/client/src/db/index.ts) (112 LOC)
- **1. Дересифікація:** Налаштування прагм SQLite та FTS5 індексів.
- **2. Взаємозв'язки:** Drizzle ORM та сховище сесій.
- **3. Баги:** 🔴 **30 ГБ пам'яті:** `PRAGMA mmap_size = 30000000000` (30 ГБ) викликає OOM на мобільних платформах; розбіжність тригерів FTS5 (4 колонки проти 3) ламає індексацію.
- **4. Ризики:** Збій повнотекстового пошуку.
- **5. Open-Source інтеграція:** `better-sqlite3` FTS5.
- **6. План:** Зменшити `mmap_size` до безпечних 256 МБ (`268435456`); синхронізувати тригери.

#### 3. [`src/database/connection/generic_sqlite_pool.ts`](file:///Users/roman/Downloads/holy/src/database/connection/generic_sqlite_pool.ts) (335 LOC)
- **1. Дересифікація:** Пул багатопотокових з'єднань на читання з WAL-режимом.
- **2. Взаємозв'язки:** Доступ до баз даних `holy-bible-mcp` та директив.
- **3. Баги:** Витік Statements у LRU кеші (видалення з JS Map не викликає C++ деструктор `better-sqlite3`); сліпий таймер `setTimeout(1500)` у `updatePath` закриває з'єднання без перевірки активних запитів.
- **4. Ризики:** Витік пам'яті при тривалому аптаймі.
- **5. План:** Впровадити деструктори Statements; замінити таймер на лічильник `activeQueriesCount === 0`.

#### 4. [`client/src/app/api/mcp/install-code/route.ts`](file:///Users/roman/Downloads/holy/client/src/app/api/mcp/install-code/route.ts) (375 LOC)
- **1. Дересифікація:** Виконує створення папок, `npm install`, AST-перевірку в одному HTTP запиті.
- **2. Взаємозв'язки:** Керується з `McpAddChoiceModal.tsx`.
- **3. Баги:** Глобальний `activeInstallAborts` є `Map` у пам'яті процесу; `execAsync(npm install)` без прапорця `--ignore-scripts` несе загрозу виконання шкідливих хуків.
- **4. План:** Винести установку в фоновий `McpPackageInstallerService` з безпечною пісочницею (`--ignore-scripts`).

#### 5. [`client/src/components/mcp/McpServerCard.tsx`](file:///Users/roman/Downloads/holy/client/src/components/mcp/McpServerCard.tsx) (514 LOC)
- **1. Дересифікація:** Перевантажений 20+ пропсами та бізнес-логікою OPFS/IndexedDB.
- **2. Взаємозв'язки:** `ServerStatusBadge`, `ServerToolsList`, `client-storage.ts`.
- **3. Баги:** `setTimeout(() => setCopied(false), 2000)` не очищається при unmount; відсутній `AbortController` при завантаженні БД.
- **4. Заглушки:** Хардкод дефолтних розмірів `'15.5 MB'` та `'5.88 GB'`.
- **5. План:** Винести стан у хук `useMcpServerLifecycle(serverId)`.

#### 6. [`client/src/components/mcp/McpAddChoiceModal.tsx`](file:///Users/roman/Downloads/holy/client/src/components/mcp/McpAddChoiceModal.tsx) (510 LOC)
- **1. Дересифікація:** Поєднує пошук у каталозі, імпорт з буфера та парсер конфігів.
- **2. Взаємозв'язки:** `presets.ts`, `/api/mcp/registry`.
- **3. Баги:** Race condition при швидкому введенні тексту; відсутність віртуалізації списку (просідання FPS до 15-20).
- **4. Заглушки:** Дефолтний арг `args: ['-y', reg.npmPackage]` без запиту обов'язкових env-змінних.
- **5. План:** Розбити на таби з лінивим імпортом; додати віртуалізацію `@tanstack/react-virtual`.

#### 7. [`client/src/components/mcp/McpServerSettingsModal.tsx`](file:///Users/roman/Downloads/holy/client/src/components/mcp/McpServerSettingsModal.tsx) (347 LOC)
- **1. Дересифікація:** Динамічна генерація UI-контролів на основі метаданих схеми.
- **2. Взаємозв'язки:** `framer-motion`, `useSettingsStore`.
- **3. Баги:** Фільтрація списку налаштувань виконується без `useMemo` всередині AnimatePresence.
- **4. План:** Мемоізувати розрахунок параметрів через `useMemo`.

#### 8. [`client/src/app/api/mcp/download-db/route.ts`](file:///Users/roman/Downloads/holy/client/src/app/api/mcp/download-db/route.ts) (343 LOC)
- **1. Дересифікація:** Фасад HTTP API для `download-state-manager` та `chunk-streamer`.
- **2. Взаємозв'язки:** `manifest-resolver`, `server-list`.
- **3. Баги:** Синхронне видалення файлів (`unlinkSync`) викликає `EBUSY` на Windows при активних з'єднаннях пулу; `renameSync` дає `EXDEV` між різними дисками.
- **4. План:** Викликати `pool.drainAndClose()` перед `DELETE`; замінити на асинхронні `fs.promises`.

#### 9. [`client/src/components/mcp/cards/ServerActionButtons.tsx`](file:///Users/roman/Downloads/holy/client/src/components/mcp/cards/ServerActionButtons.tsx) (182 LOC)
- **1. Дересифікація:** Мемоізований модуль керування сервером.
- **2. Взаємозв'язки:** `framer-motion`, `triggerHapticFeedback`.
- **3. Баги:** Якщо сервер у стані збою (`crashed`), перемикач залишається активним і спамить запити.
- **4. План:** Додати стан `disabled` під час виконання операцій рестарту (`isConnecting`).

#### 10. [`client/src/components/mcp/McpDashboard.tsx`](file:///Users/roman/Downloads/holy/client/src/components/mcp/McpDashboard.tsx) (322 LOC)
- **1. Дересифікація:** Хаб стану між `useSettingsStore` та polling-механізмом.
- **2. Взаємозв'язки:** `McpHeaderToolbar`, `McpServerGrid`.
- **3. Баги:** Подвійна ініціалізація стану з `mcpServers` та fallback на `mcpConfigs`.
- **4. Заглушки:** `handleRefresh` робить пінг, але стан в UI не оновлюється безпосередньо.
- **5. План:** Мігрувати опитування статусів на `react-query` або SWR.

#### 11. [`client/src/lib/mcp/routing/UniversalSchemaMapper.ts`](file:///Users/roman/Downloads/holy/client/src/lib/mcp/routing/UniversalSchemaMapper.ts) (313 LOC)
- **1. Дересифікація:** Алгоритмічний клас динамічного мапінгу схем.
- **2. Взаємозв'язки:** `mcp-manager.ts`, `context-aggregator.ts`.
- **3. Баги:** `new RegExp(...)` створюється з несанітизованого `propName` (ризик `SyntaxError`); `\b(\d{1,4})\b` витягує номер глави вірша замість ліміту.
- **4. План:** Екранувати регулярні вирази; покращити парсинг числових аргументів.

#### 12. [`scripts/seed_directives_db.ts`](file:///Users/roman/Downloads/holy/scripts/seed_directives_db.ts) (272 LOC)
- **1. Дересифікація:** Початкове наповнення бази даних `directives.sqlite`.
- **2. Взаємозв'язки:** Записує директиви у 6 цільових шляхів.
- **3. Баги:** `fs.unlinkSync(dbPath)` видаляє `.sqlite`, але залишає `-wal` та `-shm` файли (ризик розсинхронізації).
- **4. План:** Видаляти файли разом із `-wal` та `-shm`.

#### 13. [`src/prompts_repository.ts`](file:///Users/roman/Downloads/holy/src/prompts_repository.ts) (261 LOC)
- **1. Дересифікація:** Репозиторій промптів за специфікацією MCP SDK.
- **2. Взаємозв'язки:** `DirectiveStore`, `capabilities.ts`.
- **3. Баги:** `parseInt(String(args?.warmth || "80"), 10)` не перевіряє `isNaN`.
- **4. План:** Додати санітизацію аргументів через Zod.

#### 14. [`src/database/resilient_downloader.ts`](file:///Users/roman/Downloads/holy/src/database/resilient_downloader.ts) (243 LOC)
- **1. Дересифікація:** Завантаження бази даних SQLite (5.88 GB) з гонкою дзеркал.
- **2. Взаємозв'язки:** `integrity_checker.ts`, `path_resolver.ts`.
- **3. Баги:** Зависання при очікуванні події `'drain'`; зсув позиції файлу при обриві з'єднання.
- **4. План:** Отримувати точний розмір через `manifest.json`; додати перевірку SHA-256 чанків.

#### 15. [`src/directives/directives_db_loader.ts`](file:///Users/roman/Downloads/holy/src/directives/directives_db_loader.ts) (237 LOC)
- **1. Дересифікація:** Завантаження 12 богословських таблиць у пам'ять.
- **2. Взаємозв'язки:** Репозиторії директив, `directive_store.ts`.
- **3. Баги:** `JSON.parse` без блоків `try/catch` (ризик `SyntaxError`).
- **4. План:** Огорнути всі виклики `JSON.parse` у безпечні хелпери `safeJsonParse`.

#### 16. [`src/token_optimizer/index.ts`](file:///Users/roman/Downloads/holy/src/token_optimizer/index.ts) (225 LOC)
- **1. Дересифікація:** Адаптивний оптимізатор контекстного вікна LLM (40/20/20/20).
- **2. Взаємозв'язки:** `context-aggregator.ts`, `ask_holy_bible`.
- **3. Баги:** Обмеження `16000` токенів для вікон >128K (штучне обмеження для Gemini 1.5/2.0 Pro).
- **4. План:** Додати підтримку профілю `ctx_1m_plus`.

#### 17. [`client/src/lib/mcp/client-storage.ts`](file:///Users/roman/Downloads/holy/client/src/lib/mcp/client-storage.ts) (219 LOC)
- **1. Дересифікація:** Менеджер OPFS та IndexedDB.
- **2. Взаємозв'язки:** `McpServerCard.tsx`, `idb-keyval`.
- **3. Баги:** Відкриття дескрипторів OPFS (`getFileHandle`) без закриття у разі помилки читання.
- **4. План:** Додати перевірку `navigator.storage.estimate()` перед завантаженням.

#### 18. [`src/tools/schemas/tool_schemas.ts`](file:///Users/roman/Downloads/holy/src/tools/schemas/tool_schemas.ts) (211 LOC)
- **1. Дересифікація:** Реєстр схем інструментів на базі Zod.
- **2. Взаємозв'язки:** Хендлери інструментів MCP сервера.
- **3. Баги:** Схема `search_keyword` вимагає обов'язковий `language`, що ламає виклики від клієнтів, які не передають мову.
- **4. План:** Зробити `language` опціональним з автовизначенням.

#### 19. [`src/graph/theological_graphology_engine.ts`](file:///Users/roman/Downloads/holy/src/graph/theological_graphology_engine.ts) (204 LOC)
- **1. Дересифікація:** Графовий аналізатор перехресних посилань (Graphology).
- **2. Взаємозв'язки:** `theology_repository.ts`.
- **3. Баги:** Відсутність обмеження глибини обходу графа при рекурсивному пошуку (ризик Stack Overflow).
- **4. План:** Додати строгий ліміт `maxDepth = 3`.

#### 20. [`client/src/lib/mcp/mcp-manager.ts`](file:///Users/roman/Downloads/holy/client/src/lib/mcp/mcp-manager.ts) (194 LOC)
- **1. Дересифікація:** Керування процесами та Stdio транспортами MCP.
- **2. Взаємозв'язки:** `/api/mcp/route.ts`, `UniversalSchemaMapper`.
- **3. Баги:** Підвислі зомбі-процеси `child_process` при аварійній зупинці Next.js сервера.
- **4. План:** Додати реєстрацію `process.on('exit')` та `process.on('SIGTERM')` для примусового `tree-kill`.

---

### СЕКЦІЯ 3: CLIENT AI INTELLIGENCE, ON-DEVICE INFERENCE & WEB WORKERS (19 МОДУЛІВ)

#### 1. [`client/src/lib/actions/chat.actions.ts`](file:///Users/roman/Downloads/holy/client/src/lib/actions/chat.actions.ts) (278 LOC)
- **1. Дересифікація:** Server Actions для роботи з SQLite та моделями.
- **2. Взаємозв'язки:** Викликається з UI чату.
- **3. Баги та заглушки:** 🔴 **Фальшиві моделі:** Якщо Ollama офлайн, функція повертає хардкодний масив `['qwen3.5:14b', 'qwen2.5:14b', 'gemma4:9b', 'deepseek-r1:14b', 'llama3.3:70b']`, вводячи в оману щодо їх наявності на пристрої.
- **4. План:** Видалити фейковий масив; повертати чесний порожній список та статус `offline`.

#### 2. [`client/src/lib/ai/on-device/catalog/catalog-matcher.ts`](file:///Users/roman/Downloads/holy/client/src/lib/ai/on-device/catalog/catalog-matcher.ts) (194 LOC)
- **1. Дересифікація:** Семантичне зіставлення запитів моделей з GGUF вагами.
- **2. Взаємозв'язки:** Викликається `OnDeviceEngineService`.
- **3. Баги та заглушки:** 🔴 **Приховане підмінювання:** Якщо модель не знайдено, повертається посилання на `Qwen2.5-0.5B-Instruct-GGUF`. Будь-яка невідома модель непомітно виконується як Qwen 0.5B.
- **4. План:** Повертати `undefined`, якщо впевненість розпізнавання моделі нижча за поріг.

#### 3. [`client/src/workers/tensor-quantizer.worker.ts`](file:///Users/roman/Downloads/holy/client/src/workers/tensor-quantizer.worker.ts) (224 LOC)
- **1. Дересифікація:** Web Worker квантування тензорів у FP8 E4M3 та Block-INT4.
- **2. Баги:** 🔴 **Чисельний баг FP8:** Якщо `Math.round(...)` дає 8.0, операція `& 0x07` обнуляє мантису без інкременту експоненти, обвалюючи вагу з 1.95 до 1.0 (втрата точності нейромережі).
- **3. План:** Додати обробку переповнення: `mantissa >= 8 -> mantissa = 0, expBits++`.

#### 4. [`client/src/workers/hybrid-rag.worker.ts`](file:///Users/roman/Downloads/holy/client/src/workers/hybrid-rag.worker.ts) (217 LOC)
- **1. Дересифікація:** Векторний RAG пошук на 31,000+ віршів.
- **2. Баги:** 🔴 **Руйнування купи:** `getSortedResults()` викликає `this.heap.sort()`, що мутує масив `in-place` і руйнує властивість Min-Heap для всіх наступних пошуків.
- **3. План:** Клонувати масив перед сортуванням: `[...this.heap].sort()`.

#### 5. [`client/src/lib/ai/on-device/workers/wasm-engine.worker.ts`](file:///Users/roman/Downloads/holy/client/src/lib/ai/on-device/workers/wasm-engine.worker.ts) (177 LOC)
- **1. Дересифікація:** Web Worker інференсу GGUF на CPU через `@wllama/wllama`.
- **2. Баги:** 🔴 Квадратична складність $O(N^2)$ при генерації: виклик `currentText.slice(fullText.length)` копіює весь згенерований текст на кожному токені.
- **3. План:** Замінити на пряме декодування байтового чанка `new TextDecoder().decode(_piece)`.

#### 6. [`client/src/lib/ai/on-device/worker-pool/inference-worker-proxy.ts`](file:///Users/roman/Downloads/holy/client/src/lib/ai/on-device/worker-pool/inference-worker-proxy.ts) (321 LOC)
- **1. Дересифікація:** Керує воркерами `webgpu` та `wasm`.
- **2. Баги:** Висячий проміс у `loadModel` при краші воркера до відправки `MODEL_READY`.
- **3. План:** Додати кореляційні `requestId` та автореджект усіх висячих промісів при `terminate()`.

#### 7. [`client/src/lib/actions/provider-fetch-models.ts`](file:///Users/roman/Downloads/holy/client/src/lib/actions/provider-fetch-models.ts) (301 LOC)
- **1. Дересифікація:** Опитування моделей провайдерів (Ollama, OpenAI, Gemini).
- **2. Баги:** N+1 запит до `/api/show` у Ollama через `Promise.allSettled(rawList.map(...))` без обмеження конкурентності (50 одночасних POST запитів).
- **3. План:** Додати чергу `p-limit(4)` для опитування Ollama; впровадити LRU-кеш.

#### 8. [`client/src/stores/useModelPullStore.ts`](file:///Users/roman/Downloads/holy/client/src/stores/useModelPullStore.ts) (284 LOC)
- **1. Дересифікація:** Zustand-стор для прогресу завантаження моделей.
- **2. Баги:** Модульні змінні `globalAbortControllers`, `globalTimers` поза Zustand-стором гублять стан при HMR/SSR.
- **3. План:** Інкапсулювати контролери у клас `ModelPullController`.

#### 9. [`client/src/workers/opfs-storage.worker.ts`](file:///Users/roman/Downloads/holy/client/src/workers/opfs-storage.worker.ts) (259 LOC)
- **1. Дересифікація:** OPFS Web Worker для роботи з диском через `FileSystemSyncAccessHandle`.
- **2. Баги:** Подвійне споживання диска під час `COMMIT_FILE` через повне копіювання файлу (модель 4 ГБ вимагає 8 ГБ вільного місця).
- **3. План:** Додати потоковий чанковий коміт з блоками 512 КБ.

#### 10. [`client/src/hooks/useOnDeviceModelManager.ts`](file:///Users/roman/Downloads/holy/client/src/hooks/useOnDeviceModelManager.ts) (257 LOC)
- **1. Дересифікація:** Керування локальними моделями та квотами.
- **2. Баги:** Виклик `cleanOrphanModelFiles()` на кожен маунт хука (ризик видалення активних `.part` файлів паралельних завантажень).
- **3. План:** Перенести стан у Zustand-стор та запускати очищення 1 раз на сесію.

#### 11. [`client/src/workers/p2p-transport.worker.ts`](file:///Users/roman/Downloads/holy/client/src/workers/p2p-transport.worker.ts) (246 LOC)
- **1. Дересифікація:** Web Worker для AES-256-GCM / ChaCha20 з Transferable ArrayBuffers.
- **2. Баги:** Помилка зсуву 1024-бітного бітмапа у `ReplayFilter` (перенесення carry від молодших до старших індексів спотворює маску і дропає валідні пакети).
- **3. План:** Виправити логіку зсуву 1024-бітного вікна; замінити `.slice` на `.subarray`.

#### 12. [`client/src/lib/hardware/fps-meter.ts`](file:///Users/roman/Downloads/holy/client/src/lib/hardware/fps-meter.ts) (219 LOC)
- **1. Дересифікація:** Вимірювання частоти оновлення дисплея (60Hz–240Hz).
- **2. Баги:** Мутація `stimElem.style.transform` на кожному кадрі rAF під час заміру викликає мікро-фрізи UI.
- **3. План:** Закешувати виміряну частоту глобально та скидати тільки за подією зміни орієнтації екрана.

#### 13. [`client/src/lib/ai/on-device/storage/storage-quota.service.ts`](file:///Users/roman/Downloads/holy/client/src/lib/ai/on-device/storage/storage-quota.service.ts) (212 LOC)
- **1. Дересифікація:** Розрахунок дискових квот OPFS та IndexedDB.
- **2. Баги:** Завищена квота для iOS (32-64 ГБ замість реального ліміту Safari у 1.5-2.5 ГБ).
- **3. План:** Знизити дефолтний ліміт iOS до 1.5 ГБ.

#### 14 & 15. [`client/src/workers/opfs-downloader.worker.ts`](file:///Users/roman/Downloads/holy/client/src/workers/opfs-downloader.worker.ts) та [`client/src/lib/ai/on-device/workers/opfs-downloader.worker.ts`](file:///Users/roman/Downloads/holy/client/src/lib/ai/on-device/workers/opfs-downloader.worker.ts) (197 LOC кожен)
- **1. Дересифікація:** Дублювання двох однакових воркерів у різних директоріях.
- **2. Баги:** `targetWritable.write(partFile)` читає 2-4 ГБ файл цілком у пам'ять, викликаючи OOM на мобільних пристроях.
- **3. План:** Об'єднати воркери в один модуль із чанковим копіюванням через `pipeTo`.

#### 16. [`client/src/lib/models/metadata-fetcher.ts`](file:///Users/roman/Downloads/holy/client/src/lib/models/metadata-fetcher.ts) (194 LOC)
- **1. Дересифікація:** Детекція можливостей моделей (Vision, Reasoning) з LRU кешем.
- **2. Баги:** Занадто короткий таймаут `AbortSignal.timeout(400)` (400 мс) скидає запити до зайнятого Ollama.
- **3. План:** Збільшити таймаут до 1500 мс.

#### 17. [`client/src/lib/ai/streaming/executors/remote-http-stream-executor.ts`](file:///Users/roman/Downloads/holy/client/src/lib/ai/streaming/executors/remote-http-stream-executor.ts) (191 LOC)
- **1. Дересифікація:** Обробка SSE-стрімінгу `/api/chat`.
- **2. Баги:** Розрив багатобайтових UTF-8 символів між чанками викликає збій `JSON.parse`.
- **3. План:** Інтегрувати `eventsource-parser`.

#### 18. [`client/src/lib/ai/on-device/workers/webgpu-engine.worker.ts`](file:///Users/roman/Downloads/holy/client/src/lib/ai/on-device/workers/webgpu-engine.worker.ts) (187 LOC)
- **1. Дересифікація:** Web Worker для WebGPU інференсу через `@mlc-ai/web-llm`.
- **2. Баги:** Витік VRAM при зміні моделі всередині одного воркера.
- **3. План:** Повністю термінувати воркер при вивантаженні моделі для звільнення VRAM.

#### 19. [`client/src/lib/ai/adapters/ollama.adapter.ts`](file:///Users/roman/Downloads/holy/client/src/lib/ai/adapters/ollama.adapter.ts) (178 LOC)
- **1. Дересифікація:** Адаптер підключення до Ollama API.
- **2. Баги:** Спроба виклику `require('os')` у браузерному середовищі.
- **3. План:** Використовувати `navigator.hardwareConcurrency` як джерело ядер CPU.

---

### СЕКЦІЯ 4: FRONTEND UI & APPLICATION SHELL (20 МОДУЛІВ)

#### 1. [`client/src/app/globals.css`](file:///Users/roman/Downloads/holy/client/src/app/globals.css) (887 LOC)
- **1. Дересифікація:** Стильове ядро Tailwind CSS v4.
- **2. Баги:** Перевантаження селекторами `body.window-blurred *` та `body.hw-eco *`, які змушують рушій рекалькулювати стилі всього DOM; Safari iOS Safe Area `max(var(--sat), 0.5rem)` збоїть на старих версіях WebKit без `viewport-fit=cover`.
- **3. План:** Винести анімації в `animations.css`, класи апаратного профілювання в `hardware-governor.css`.

#### 2. [`client/src/components/settings/providers/LocalProvidersSection.tsx`](file:///Users/roman/Downloads/holy/client/src/components/settings/providers/LocalProvidersSection.tsx) (585 LOC)
- **1. Дересифікація:** Поєднує налаштування локальних LLM з P2P Mesh Compute Sharing (18 пропсів, 10 окремих підписок на `useP2pStore`).
- **2. Баги:** Hydration Mismatch через різницю обчислення `isMobile` на сервері та клієнті.
- **3. План:** Відокремити `P2pMeshSection.tsx` від `LocalProvidersSection.tsx`; згрупувати підписки в `useShallow`.

#### 3. [`client/src/components/settings/DeviceDiagnosticsSection.tsx`](file:///Users/roman/Downloads/holy/client/src/components/settings/DeviceDiagnosticsSection.tsx) (480 LOC)
- **1. Дересифікація:** Рендеринг 8 діагностичних карток.
- **2. Баги:** `setInterval(..., 2500)` для пінгу мережі тригерить повний ре-рендер усіх 8 карток кожні 2.5 секунди.
- **3. План:** Створити ізольований хук `useLiveNetworkMetrics()` та розбити на атомарні мемоізовані картки.

#### 4. [`client/src/components/chat/MessageList.tsx`](file:///Users/roman/Downloads/holy/client/src/components/chat/MessageList.tsx) (444 LOC)
- **1. Дересифікація:** Віртуалізований скрол на базі `@tanstack/react-virtual`.
- **2. Баги:** `StreamingMessageSlot` змонтований **поза** віртуальними рядками всередині контейнера з фіксованою висотою, що викликає накладання та стрибки скролу; інлайн стрілочні функції у `onTTS` зривають `React.memo` для `MessageItem`.
- **3. План:** Додати `"use client"`; включити `StreamingMessageSlot` у віртуальний масив рядків; мемоізувати колбеки `onTTS`, `onRetry`.

#### 5. [`client/src/components/chat/ChatHeader.tsx`](file:///Users/roman/Downloads/holy/client/src/components/chat/ChatHeader.tsx) (400 LOC)
- **1. Дересифікація:** Верхній бар чату, режими теплоти та деталізації.
- **2. Баги:** Непотрібний `fetch('/api/mcp/configs')` на кожен mount; мертвий стан експорту чату (стан є, але кнопки в JSX немає).
- **3. План:** Видалити мертвий стан або підключити реальну кнопку експорту в меню.

#### 6. [`client/src/components/settings/providers/CloudProvidersSection.tsx`](file:///Users/roman/Downloads/holy/client/src/components/settings/providers/CloudProvidersSection.tsx) (386 LOC)
- **1. Дересифікація:** Список хмарних провайдерів (18 пропсів).
- **2. Баги:** Для кожної моделі на кожен рендер повторно викликаються 4 регулярні вирази детекції можливостей.
- **3. План:** Створити мемоізований `CloudModelChip.tsx` з кешуванням детекції можливостей.

#### 7. [`client/src/components/chat/InputDock.tsx`](file:///Users/roman/Downloads/holy/client/src/components/chat/InputDock.tsx) (375 LOC)
- **1. Дересифікація:** Контейнер введення чату.
- **2. Баги:** Стан `text` перерендерює весь док на кожен символ; 120 FPS оновлення рівнів аудіо перерендерює весь док під час запису.
- **3. План:** Ізолювати локальний стан тексту `[text, setText]` та відокремити аудіозапис у `VoiceRecorderDock.tsx`.

#### 8. [`client/src/components/sidebar/Sidebar.tsx`](file:///Users/roman/Downloads/holy/client/src/components/sidebar/Sidebar.tsx) (374 LOC)
- **1. Дересифікація:** Сайдбар історії діалогів.
- **2. Баги:** `renderContent` викликається двічі, дублюючи віртуальне дерево; передача нових інлайн стрілочних функцій для кожного `SidebarChatItem`.
- **3. План:** Винести `renderContent` в чистий компонент `SidebarContent.tsx`.

#### 9. [`client/src/components/settings/ProvidersSettingsPanel.tsx`](file:///Users/roman/Downloads/holy/client/src/components/settings/ProvidersSettingsPanel.tsx) (366 LOC)
- **1. Дересифікація:** Панель керування провайдерами (9 окремих `useState`).
- **2. Баги:** Таймери debounce у `keyDebounceTimersRef` спрацьовують у фоні після закриття модалки.
- **3. План:** Очищати всі таймери збереження ключів у `useEffect` cleanup.

#### 10. [`client/src/components/sidebar/SidebarChatItem.tsx`](file:///Users/roman/Downloads/holy/client/src/components/sidebar/SidebarChatItem.tsx) (346 LOC)
- **1. Дересифікація:** Атомарний рядок діалогу в сайдбарі.
- **2. Баги:** Компаратор `React.memo` порівнює `chat.updatedAt === nextProps.chat.updatedAt`. Оскільки це об'єкти `Date`, посилання `===` завжди повертає `false`, змушуючи всі 100+ елементів списку ре-рендеритися при будь-якій зміні.
- **3. План:** Порівнювати мілісекунди: `new Date(prev.chat.updatedAt).getTime() === new Date(next.chat.updatedAt).getTime()`.

#### 11. [`client/src/components/audio/AudioVisualizer.tsx`](file:///Users/roman/Downloads/holy/client/src/components/audio/AudioVisualizer.tsx) / `AudioWaveformCanvas.tsx` (343 LOC)
- **1. Дересифікація:** HTML5 Canvas для малювання амплітуди звуку.
- **2. Баги:** Canvas не враховує `window.devicePixelRatio` (розмиття на Retina дисплеях).
- **3. План:** Додати підтримку `devicePixelRatio` для чіткості 120 FPS рендерингу на Retina дисплеях.

#### 12. [`client/src/app/[locale]/page.tsx`](file:///Users/roman/Downloads/holy/client/src/app/[locale]/page.tsx) (334 LOC)
- **1. Дересифікація:** Кореневий шелл чату.
- **2. Баги:** Race condition при швидкому подвійному кліку відправки першого повідомлення (створення двох однакових чатів).
- **3. План:** Додати блокування подвійного надсилання через стійкий `AbortController`.

#### 13. [`client/src/components/settings/providers/card/LocalProviderPullProgress.tsx`](file:///Users/roman/Downloads/holy/client/src/components/settings/providers/card/LocalProviderPullProgress.tsx) (293 LOC)
- **1. Дересифікація:** Візуалізація прогресу завантаження вагів.
- **2. Баги:** При `totalMb === 0` значення прогресу повертає `NaN`.
- **3. План:** Додати валідацію `NaN` для `progressPercent`.

#### 14. [`client/src/hooks/useAudioRecorder.ts`](file:///Users/roman/Downloads/holy/client/src/hooks/useAudioRecorder.ts) (288 LOC)
- **1. Дересифікація:** Керування `MediaRecorder` та мікрофоном.
- **2. Баги:** `setAudioLevels` у циклі `requestAnimationFrame` викликає до 120 ре-рендерів/с.
- **3. План:** Видалити `setAudioLevels` з циклу rAF; передавати `AnalyserNode` безпосередньо у Canvas через `ref`.

#### 15. [`client/src/components/settings/SettingsModal.tsx`](file:///Users/roman/Downloads/holy/client/src/components/settings/SettingsModal.tsx) (283 LOC)
- **1. Дересифікація:** Головне модальне вікно налаштувань.
- **2. Взаємозв'язки:** `ProvidersSettingsPanel`, `DeviceDiagnosticsSection`.
- **3. Баги:** Відсутність фокус-трапу при навігації з клавіатури.
- **4. План:** Інтегрувати `@radix-ui/react-dialog`.

#### 16. [`client/src/components/chat/message/MessageItem.tsx`](file:///Users/roman/Downloads/holy/client/src/components/chat/message/MessageItem.tsx) (282 LOC)
- **1. Дересифікація:** Рендеринг повідомлення користувача/асистента.
- **2. Баги:** Повторний парсинг Markdown при кожному рендері батьківського списку.
- **3. План:** Мемоізувати парсинг Markdown вмісту через `useMemo`.

#### 17. [`client/src/components/chat/McpActivityIndicator.tsx`](file:///Users/roman/Downloads/holy/client/src/components/chat/McpActivityIndicator.tsx) (278 LOC)
- **1. Дересифікація:** Атомарний індикатор викликів MCP інструментів.
- **2. Взаємозв'язки:** `framer-motion`.
- **3. План:** Оптимізувати анімацію пульсації через чистий CSS замість Framer Motion JS потоку.

#### 18. [`client/src/components/chat/AttachmentDock.tsx`](file:///Users/roman/Downloads/holy/client/src/components/chat/AttachmentDock.tsx) (269 LOC)
- **1. Дересифікація:** Панель прикріплених файлів та медіа.
- **2. Баги:** Відсутність очищення `URL.createObjectURL` при видаленні файлу зі списку.
- **3. План:** Додати виклик `URL.revokeObjectURL` при демонтажі чанка.

#### 19. [`client/src/components/chat/hooks/useChatMessages.ts`](file:///Users/roman/Downloads/holy/client/src/components/chat/hooks/useChatMessages.ts) (268 LOC)
- **1. Дересифікація:** Хук синхронізації повідомлень із базою даних.
- **2. Баги:** Висячі проміси при швидкій зміні активного чату.
- **3. План:** Додати `AbortController` для скасування завантаження попереднього діалогу.

#### 20. [`client/src/components/chat/VoiceAssistantOverlay.tsx`](file:///Users/roman/Downloads/holy/client/src/components/chat/VoiceAssistantOverlay.tsx) (251 LOC)
- **1. Дересифікація:** Повноекранний голосовий інтерфейс (STT + TTS).
- **2. Баги:** Витік екземпляра `SpeechRecognition` при раптовому переході в іншу вкладку.
- **3. План:** Гарантувати виклик `recognition.stop()` та `recognition.abort()` у `useEffect` cleanup.

---

### СЕКЦІЯ 5: MOBILE ANDROID NATIVE & STATE PERSISTENCE (22 МОДУЛІ)

#### 1. [`client/android/app/src/main/java/com/holy/bible/mcp/HolyDeviceIdentityPlugin.java`](file:///Users/roman/Downloads/holy/client/android/app/src/main/java/com/holy/bible/mcp/HolyDeviceIdentityPlugin.java) (90 LOC)
- **1. Дересифікація:** Нативний плагін генерації крипто-ідентифікатора пристрою.
- **2. Баги:** 🔴 **Критична вразливість:** Сід пристрою генерується через `System.currentTimeMillis()`. Приватні ключі X25519 стають тривіально передбачуваними.
- **3. План:** Замінити на `java.security.SecureRandom`.

#### 2. [`client/android/app/src/main/java/com/holy/bible/mcp/HolyVisionPlugin.java`](file:///Users/roman/Downloads/holy/client/android/app/src/main/java/com/holy/bible/mcp/HolyVisionPlugin.java) (199 LOC)
- **1. Дересифікація:** Камера та MLKit сканер QR-кодів.
- **2. Баги:** 🔴 **Зависання дозволу камери:** Виклик `requestPermissionForAlias("camera", call, "cameraPermsCallback")` не має оголошеного методу `@PermissionCallback public void cameraPermsCallback(PluginCall call)`. Запит камери зависає назавжди.
- **3. План:** Реалізувати метод `@PermissionCallback public void cameraPermsCallback(PluginCall call)`.

#### 4. [`client/android/app/src/main/java/com/holy/bible/mcp/P2PForegroundService.java`](file:///Users/roman/Downloads/holy/client/android/app/src/main/java/com/holy/bible/mcp/P2PForegroundService.java) (103 LOC)
- **1. Дересифікація:** Фоновий сервіс підтримки P2P зв'язку.
- **2. Баги:** 🔴 Виклик `startForeground` не передає `foregroundServiceType`, що викликає фатальне падіння `ForegroundServiceStartNotAllowedException` на Android 14+ (API 34+).
- **3. План:** Додати `ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE | ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC`.

#### 4. [`client/src/stores/useTransientStreamStore.ts`](file:///Users/roman/Downloads/holy/client/src/stores/useTransientStreamStore.ts) та [`client/src/stores/chat/useTransientStreamStore.ts`](file:///Users/roman/Downloads/holy/client/src/stores/chat/useTransientStreamStore.ts) (137 LOC / 126 LOC)
- **1. Дересифікація:** Дублювання двох різних сторів з однаковою назвою.
- **2. Баги:** Небезпечний синхронний виклик `require('../useP2pStore')` всередині екшнів (ризик циклічного блокування).
- **3. План:** Консолідувати в один стор, видалити синхронний `require`.

#### 5. [`client/src/stores/useChatStore.ts`](file:///Users/roman/Downloads/holy/client/src/stores/useChatStore.ts) (430 LOC)
- **1. Дересифікація:** Монолітний стор чатів (сесії, повідомлення, стрімінг).
- **2. Баги:** Будь-яке оновлення стрімінг-токенів змушує перерендерювати підписників списку сесій.
- **3. План:** Декомпозувати на слайси (`chatSessionsSlice`, `chatMessagesSlice`, `chatStreamingSlice`).

#### 6. [`client/android/app/src/main/java/com/holy/bible/mcp/HolySpeechPlugin.java`](file:///Users/roman/Downloads/holy/client/android/app/src/main/java/com/holy/bible/mcp/HolySpeechPlugin.java) (330 LOC)
- **1. Дересифікація:** Нативний TTS синтез та AudioFocus.
- **2. Баги:** Зависання AudioFocus Ducking (після завершення мови гучність інших додатків не відновлюється).
- **3. План:** Додати гарантоване звільнення фокусу в `onDone` та `onError`.

#### 7. [`client/src/lib/storage/indexeddb-chat-adapter.ts`](file:///Users/roman/Downloads/holy/client/src/lib/storage/indexeddb-chat-adapter.ts) (311 LOC)
- **1. Дересифікація:** Клієнтський адаптер бази даних на IndexedDB.
- **2. Баги:** Хибне визначення хоста: при зверненні за локальним IP десктоп переходить у режим клієнта.
- **3. План:** Використовувати явний прапорець оточення замість евристики за IP.

#### 8. [`client/src/stores/slices/providerSlice.ts`](file:///Users/roman/Downloads/holy/client/src/stores/slices/providerSlice.ts) (223 LOC)
- **1. Дересифікація:** Стор конфігурації провайдерів.
- **2. Баги:** Гонка стану при паралельному збереженні ключів двох провайдерів.
- **3. План:** Впровадити атомарний апдейтер за ID провайдера.

#### 9. [`client/android/app/src/main/java/com/holy/bible/mcp/vision/ui/ScannerOverlayBuilder.java`](file:///Users/roman/Downloads/holy/client/android/app/src/main/java/com/holy/bible/mcp/vision/ui/ScannerOverlayBuilder.java) (226 LOC)
- **1. Дересифікація:** Побудова нативного UI оверлею сканера.
- **2. Баги:** Помилка розрахунку висоти `topDim` на екранах із вирізом камери (Notch).
- **3. План:** Враховувати `WindowInsetsCompat.Type.displayCutout()`.

#### 10. [`client/android/app/src/main/java/com/holy/bible/mcp/HolyTelemetryPlugin.java`](file:///Users/roman/Downloads/holy/client/android/app/src/main/java/com/holy/bible/mcp/HolyTelemetryPlugin.java) (216 LOC)
- **1. Дересифікація:** Моніторинг заряду батареї, пам'яті та температури.
- **2. Баги:** Незакріплений `BroadcastReceiver` при зміні стану Activity.
- **3. План:** Реєструвати та скасовувати ресівер у життєвому циклі `handleOnPause`/`handleOnResume`.

#### 11. [`client/src/stores/default-providers.ts`](file:///Users/roman/Downloads/holy/client/src/stores/default-providers.ts) (185 LOC)
- **1. Дересифікація:** Список провайдерів за замовчуванням.
- **2. План:** Синхронізувати моделі за замовчуванням з останніми версіями API.

#### 12. [`client/android/app/src/main/java/com/holy/bible/mcp/vision/CameraXSessionController.java`](file:///Users/roman/Downloads/holy/client/android/app/src/main/java/com/holy/bible/mcp/vision/CameraXSessionController.java) (157 LOC)
- **1. Дересифікація:** Керування життєвим циклом CameraX.
- **2. Баги:** Незакритий `ImageProxy` при виникненні винятку у MLKit аналізаторі блокує отримання наступних кадрів.
- **3. План:** Огорнути `imageProxy.close()` у блок `finally`.

#### 13. [`client/src/stores/slices/provider/cloudProviderSlice.ts`](file:///Users/roman/Downloads/holy/client/src/stores/slices/provider/cloudProviderSlice.ts) (138 LOC)
- **1. Дересифікація:** Слайс хмарних моделей.
- **2. План:** Додати дедуплікацію ID моделей.

#### 14. [`client/src/db/statements.ts`](file:///Users/roman/Downloads/holy/client/src/db/statements.ts) (117 LOC)
- **1. Дересифікація:** Підготовлені SQL вирази.
- **2. План:** Додати безпечну санітизацію параметрів пошуку.

#### 15. [`client/src/stores/slices/mcpSlice.ts`](file:///Users/roman/Downloads/holy/client/src/stores/slices/mcpSlice.ts) (113 LOC)
- **1. Дересифікація:** Слайс стану серверів MCP.
- **2. План:** Додати оптимістичні оновлення статусу перемикачів.

#### 16. [`client/src/stores/slices/provider/localProviderSlice.ts`](file:///Users/roman/Downloads/holy/client/src/stores/slices/provider/localProviderSlice.ts) (112 LOC)
- **1. Дересифікація:** Слайс локальних моделей Ollama / LM Studio.
- **2. План:** Синхронізувати стан автозавантаження моделей.

#### 17. [`client/src/db/schema.ts`](file:///Users/roman/Downloads/holy/client/src/db/schema.ts) (69 LOC)
- **1. Дересифікація:** Схема таблиць Drizzle ORM.
- **2. План:** Оголосити явні `relations()` між таблицями `chats` та `messages`.

#### 18. [`client/android/app/src/main/java/com/holy/bible/mcp/identity/KeystoreSecurityManager.java`](file:///Users/roman/Downloads/holy/client/android/app/src/main/java/com/holy/bible/mcp/identity/KeystoreSecurityManager.java) (64 LOC)
- **1. Дересифікація:** Апаратне шифрування ключів Android Keystore.
- **2. План:** Додати підтримку StrongBox Keymaster для флагманських чіпів.

#### 19. [`client/android/app/src/main/java/com/holy/bible/mcp/MainActivity.java`](file:///Users/roman/Downloads/holy/client/android/app/src/main/java/com/holy/bible/mcp/MainActivity.java) (51 LOC)
- **1. Дересифікація:** Головна точка входу Capacitor Android.
- **2. Баги:** Мертвий код `CAMERA_REQ_CODE`.
- **3. План:** Видалити застарілі статичні константи.

#### 20. [`client/android/app/src/main/java/com/holy/bible/mcp/HolyVisionFeedback.java`](file:///Users/roman/Downloads/holy/client/android/app/src/main/java/com/holy/bible/mcp/HolyVisionFeedback.java) (62 LOC)
- **1. Дересифікація:** Тактильний та звуковий зворотний зв'язок сканера.
- **2. План:** Використовувати `VibrationEffect.createPredefined` для сучасних версій Android.

#### 21. [`client/android/app/src/main/java/com/holy/bible/mcp/HolyP2PBridgePlugin.java`](file:///Users/roman/Downloads/holy/client/android/app/src/main/java/com/holy/bible/mcp/HolyP2PBridgePlugin.java) (41 LOC)
- **1. Дересифікація:** IPC міст між Capacitor та нативним P2P сервісом.
- **2. План:** Додати типізовані події зміни статусу з'єднання.

#### 22. [`client/android/app/src/main/java/com/holy/bible/mcp/identity/LegacyIdentityMigrator.java`](file:///Users/roman/Downloads/holy/client/android/app/src/main/java/com/holy/bible/mcp/identity/LegacyIdentityMigrator.java) (47 LOC)
- **1. Дересифікація:** Міграція ідентичності зі старих версій додатку.
- **2. План:** Безпечно видаляти незашифровані старі ключі з SharedPreferences після успішної міграції в Keystore.

---

## 3. КРИТИЧНИЙ АРХІТЕКТУРНИЙ БРЕЙНШТОРМ

1. **Топологія імпортів та захист від циклів:** Спільні інтерфейси виносяться в чисті `*.types.ts`. Зв'язок між Zustand-сторами переводиться на decoupled event-bus (`SignalingEnvelopeDispatcher`) без синхронних `require()`.
2. **Гарантія 120 FPS та багатопоточність:** Усі криптографічні операції (ML-KEM, AEAD), RAG-пошук, квантування, PoW Kademlia та WASM/WebGPU інференс ізолюються у Web Workers із використанням **Transferable `ArrayBuffer`** (Zero-Copy). Рівні звуку з мікрофона передаються в Canvas безпосередньо через `AnalyserNode` без участі React State.
3. **100% збереження функціоналу:** Зберігаються всі публічні API-контракти MCP та Server Actions. Усі псевдо-імплементації замінюються на **справжні відкриті стандарти** (офіційний NIST ML-KEM-768 через `@noble/post-quantum`, офіційний `Yjs` з CRDT-дельтами `y-protocols`).
4. **Кросплатформність (macOS / Windows / Linux / iOS / Android / ARM64 / x64):** Нормалізовані шляхи `path.posix`, безпечні квоти для WebKit iOS (1.5 ГБ), `foregroundServiceType` для Android 14+ та SIMD-оптимізація для ARM Neon і x64 AVX2.

---

## 4. МОНОЛІТНИЙ ГЕНЕРАЛЬНИЙ ПЛАН ПОЕТАПНОЇ ДЕРЕСИФІКАЦІЇ

---

### 🔴 ЕТАП 1: Усунення критичних блокерів безпеки, криптографії та нативних аварій
1. `mlkem-postquantum-adapter.ts`: Інтеграція офіційного алгоритму `ml_kem_768` (`@noble/post-quantum`).
2. `HolyDeviceIdentityPlugin.java`: Заміна `currentTimeMillis()` на криптографічний `SecureRandom`.
3. `HolyVisionPlugin.java`: Реалізація `@PermissionCallback public void cameraPermsCallback(PluginCall call)`.
4. `P2PForegroundService.java`: Додавання `foregroundServiceType` для сумісності з Android 14+ (API 34+).
5. `P2pHostModal.tsx`: Видалення хардкоду IP `192.168.0.104` на користь динамічного виявлення.
6. `fts-setup.ts` & `db/index.ts`: Зменшення `mmap_size` до безпечних 256 МБ та синхронізація тригерів FTS5.

---

### ⚠️ ЕТАП 2: Видалення фейкових заглушок, mocks та виправлення алгоритмів ШІ/RAG
1. `chat.actions.ts`: Видалення фейкового масиву моделей Ollama, чесний статус `offline`.
2. `catalog-matcher.ts`: Видалення прихованого підмінювання на Qwen 0.5B.
3. `seed-data.ts`: Видалення генератора неіснуючих пакетів `extraDomains`.
4. `tensor-quantizer.worker.ts`: Виправлення переповнення мантиси FP8.
5. `p2p-transport.worker.ts`: Виправлення зсуву 1024-бітного вікна Replay Filter.
6. `hybrid-rag.worker.ts`: Виправлення інваріанту Min-Heap купи `[...this.heap].sort()`.
7. `wasm-engine.worker.ts`: Пряме байтове декодування чанка токена `TextDecoder().decode(_piece)`.

---

### ⚡ ЕТАП 3: Оптимізація багатопоточності Web Workers та фонового I/O
1. Об'єднання дублікатів OPFS воркерів у потоковий `pipeTo` (блоки 512 КБ).
2. `kademlia-dht.ts`: Винесення синхронного PoW `while(true)` у Web Worker.
3. `webgpu-engine.worker.ts`: Повна термінація воркера при вивантаженні моделі для звільнення VRAM.
4. `storage-quota.service.ts`: Корекція квот для iOS Safari (1.5 ГБ) та Android.
5. `provider-fetch-models.ts`: Лімітування конкурентності `p-limit(4)` для опитування Ollama.

---

### 💾 ЕТАП 4: Дересифікація стану, ліквідація дублікатів та уніфікація персистенції
1. Об'єднання дублюючих `useTransientStreamStore.ts` в один стор; видалення синхронного `require`.
2. `useChatStore.ts`: Декомпозиція на атомарні слайси (`chatSessionsSlice`, `chatMessagesSlice`, `chatStreamingSlice`).
3. `yjs-sync-mesh.ts`: Інтеграція офіційного `yjs` (`Y.Doc`, `Y.Map`) з бінарними оновленнями.
4. `generic_sqlite_pool.ts`: Додавання деструкторів Statements та заміна таймера на лічильник активних запитів.

---

### 🎨 ЕТАП 5: Дересифікація Frontend UI: 120 FPS, ізоляція аудіо та усунення ре-рендерів
1. `useAudioRecorder.ts` & `InputDock.tsx`: Видалення `setAudioLevels` із циклу rAF; пряма передача `AnalyserNode` у Canvas через ref.
2. `MessageList.tsx`: Додавання `"use client"`; віртуалізація `StreamingMessageSlot` всередині TanStack Virtualizer; мемоізація колбеків.
3. `SidebarChatItem.tsx` & `Sidebar.tsx`: Виправлення `React.memo` дат; винесення `renderContent` в чистий компонент.
4. `LocalProvidersSection.tsx` & `DeviceDiagnosticsSection.tsx`: Відокремлення `P2pMeshSection.tsx`; групування підписок в `useShallow`; ізоляція опитування мережі.
5. `InputDock.tsx`: Ізоляція локального стану `text` та оптимізація підписок.

---

### 🧹 ЕТАП 6: Фізичне видалення застарілих файлів та фінальна кросплатформна верифікація
1. Фізичне видалення застарілих файлів: `webrtc-transport.ts`, `gossipsub-engine.ts`, `p2p-worker-bridge.ts`, дублюючих воркерів та сторів.
2. Повна перевірка типізації: `npx tsc --noEmit`.
3. Фінальна збірка: `npm run verify:i18n` та `npm run build:all`.

---

## 5. 🔒 ПРОТОКОЛЬНА ЗУПИНКА (HUMAN-IN-THE-LOOP)

> [!IMPORTANT]
> **ГОЛОВНИЙ СИСТЕМНИЙ АРХІТЕКТОР ЗУПИНЕНИЙ ТА ОЧІКУЄ ВАШОГО ПІДТВЕРДЖЕННЯ.**  
> Жодного файлу з кодом наразі не змінено і не створено.  
> 
> Щоб розпочати покрокову реалізацію, надішліть команду:  
> **`«Підтверджую етап 1»`** (або «Підтверджую всі етапи»).
