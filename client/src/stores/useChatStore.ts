import { create } from 'zustand';
import { addMessage } from '@/lib/actions/chat.actions';

export type ChatStatus = 'idle' | 'generating' | 'completed_unread';

interface Chat {
  id: string;
  title: string;
  isPinned: boolean;
  updatedAt: Date;
}

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  chatStatuses: Record<string, ChatStatus>;
  abortControllers: Record<string, AbortController>;
  streamingTexts: Record<string, string>;
  streamingStatuses: Record<string, string>;
  lastCompletedMessage: Record<string, any>;
  streamingSettings: Record<string, any>;
  streamingMessageIds: Record<string, string>;
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  setActiveChat: (id: string | null) => void;
  pinChat: (id: string, isPinned: boolean) => void;
  deleteChat: (id: string) => void;
  setChatStatus: (id: string, status: ChatStatus) => void;
  registerAbortController: (id: string, controller: AbortController) => void;
  stopChatGeneration: (id: string, reason?: string) => void;
  clearLastCompletedMessage: (id: string) => void;
  markChatAsRead: (id: string) => void;
  startBackgroundGeneration: (chatId: string, userMessage: string, history: any[], settings: any, attachments?: any[]) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  chatStatuses: {},
  abortControllers: {},
  streamingTexts: {},
  streamingStatuses: {},
  streamingSettings: {},
  streamingMessageIds: {},
  lastCompletedMessage: {},
  setChats: (chats) => set({ chats }),
  addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
  setActiveChat: (id) => {
    set({ activeChatId: id });
    if (id) {
      get().markChatAsRead(id);
    }
  },
  pinChat: (id, isPinned) => set((state) => ({
    chats: state.chats.map(c => c.id === id ? { ...c, isPinned } : c)
  })),
  deleteChat: (id) => {
    get().stopChatGeneration(id);
    set((state) => ({
      chats: state.chats.filter(c => c.id !== id),
      activeChatId: state.activeChatId === id ? null : state.activeChatId
    }));
  },
  setChatStatus: (id, status) => set((state) => ({
    chatStatuses: { ...state.chatStatuses, [id]: status }
  })),
  registerAbortController: (id, controller) => set((state) => ({
    abortControllers: { ...state.abortControllers, [id]: controller }
  })),
  clearLastCompletedMessage: (id) => set((state) => {
    const nextLastCompleted = { ...state.lastCompletedMessage };
    delete nextLastCompleted[id];
    return { lastCompletedMessage: nextLastCompleted };
  }),
  stopChatGeneration: (id, reason) => {
    const controller = get().abortControllers[id];
    if (controller) {
      try { controller.abort(reason); } catch (e) {}
    }
    // We intentionally do NOT delete the streaming text or state here.
    // The AbortError caught in `startBackgroundGeneration` will handle saving
    // the partial text to the database and cleaning up the state.
  },
  markChatAsRead: (id) => set((state) => {
    if (state.chatStatuses[id] === 'completed_unread') {
      return { chatStatuses: { ...state.chatStatuses, [id]: 'idle' } };
    }
    return {};
  }),
  startBackgroundGeneration: async (chatId, userMessage, history, settings, attachments) => {
    // 0. Abort any previous generation running on this same chatId
    get().stopChatGeneration(chatId);

    // 1. Create dedicated AbortController
    const controller = new AbortController();
    const streamingMsgId = `msg_stream_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    set((state) => ({
      abortControllers: { ...state.abortControllers, [chatId]: controller },
      chatStatuses: { ...state.chatStatuses, [chatId]: 'generating' },
      streamingTexts: { ...state.streamingTexts, [chatId]: '' },
      streamingStatuses: { ...state.streamingStatuses, [chatId]: 'status_init' },
      // Capture request-time settings snapshot so badge shows what was actually sent
      streamingSettings: { ...state.streamingSettings, [chatId]: settings },
      streamingMessageIds: { ...state.streamingMessageIds, [chatId]: streamingMsgId },
    }));

    // Hoisted before try so catch block can cancel any pending RAF on abort
    let pendingAnimationFrameId: number | null = null;

    try {
      const apiMessages = [
        ...history.map(m => ({ role: m.role, content: m.content, attachments: (m as any).attachments })),
        { role: 'user', content: userMessage }
      ];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          attachments,
          ...settings
        }),
        signal: controller.signal
      });

      if (!res.ok || !res.body) {
        const statusText = res.status === 502 || res.status === 504
          ? 'Сервер тимчасово недоступний. Спробуйте ще раз.'
          : `Stream request failed (${res.status})`;
        throw new Error(statusText);
      }

      const effectiveDetail = res.headers.get('x-effective-detail-level');
      const finalSettings = effectiveDetail ? { ...settings, effectiveDetailLevel: effectiveDetail, detailLevel: effectiveDetail } : settings;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      // Buffer for incomplete lines split across TCP chunks
      let lineBuffer = '';

      let lastBatchTime = 0;

      let latestStreamText = '';
      let hasFlushedFirstToken = false;
      let lastFlushTimeRef = 0;

      const pushStreamUpdate = (currentText: string) => {
        latestStreamText = currentText;
        if (!hasFlushedFirstToken) {
          hasFlushedFirstToken = true;
          // 🧠 Instant 0ms synchronous flush for token 0 (<think> tag) so ThinkingWidget renders immediately!
          set((state) => {
            if (state.streamingTexts[chatId] === latestStreamText) return state;
            return { streamingTexts: { ...state.streamingTexts, [chatId]: latestStreamText } };
          });
          return;
        }

        const now = Date.now();
        if (now - lastFlushTimeRef >= 25) { // 🧠 40 FPS Stream Throttle: Eliminates React state thrashing during high-speed token generation!
          lastFlushTimeRef = now;
          if (!pendingAnimationFrameId) {
            pendingAnimationFrameId = requestAnimationFrame(() => {
              pendingAnimationFrameId = null;
              set((state) => {
                if (state.streamingTexts[chatId] === latestStreamText) return state;
                return { streamingTexts: { ...state.streamingTexts, [chatId]: latestStreamText } };
              });
            });
          }
        }
      };

      const processLine = (line: string): void => {
        // 1. Clean carriage returns (\r) to support all network line endings (\r\n vs \n)
        const cleanLine = line.replace(/\r/g, '');
        if (!cleanLine.trim()) return;

        // 2. Handle Text Delta Frames (0:...)
        if (cleanLine.startsWith('0:')) {
          const rawPayload = cleanLine.slice(2);
          
          // Strategy A: Standard JSON parsing
          try {
            const textPiece = JSON.parse(rawPayload);
            if (typeof textPiece === 'string') {
              fullText += textPiece;
              pushStreamUpdate(fullText);
              return;
            }
          } catch (e) {}

          // Strategy B: Escape unescaped control characters (newlines/tabs) within JSON string
          try {
            const sanitizedPayload = rawPayload
              .replace(/\n/g, '\\n')
              .replace(/\t/g, '\\t');
            const textPiece = JSON.parse(sanitizedPayload);
            if (typeof textPiece === 'string') {
              fullText += textPiece;
              pushStreamUpdate(fullText);
              return;
            }
          } catch (e) {}

          // Strategy C: Fallback direct string extraction (guarantees 100% token preservation)
          let extracted = rawPayload;
          if (extracted.startsWith('"')) extracted = extracted.slice(1);
          if (extracted.endsWith('"')) extracted = extracted.slice(0, -1);
          extracted = extracted
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');

          if (extracted) {
            fullText += extracted;
            pushStreamUpdate(fullText);
          }
        } 
        // 3. Handle Status Event Frames (2:...)
        else if (cleanLine.startsWith('2:')) {
          const rawPayload = cleanLine.slice(2);
          try {
            const dataArray = JSON.parse(rawPayload);
            if (Array.isArray(dataArray)) {
              for (const item of dataArray) {
                if (item.type === 'status' && (item.key || item.text)) {
                  // Prefer explicit key; fall back to text only if no key present.
                  // Sanitize raw text to a safe i18n key (strip Cyrillic prefix & server name).
                  let statusVal: string = item.key || item.text;
                  if (!item.key && typeof item.text === 'string') {
                    // Map known raw texts to i18n keys
                    const t = item.text.toLowerCase();
                    if (t.includes('mcp') || t.includes('підключення') || t.includes('connecting')) {
                      statusVal = 'status_mcp_connect';
                    } else if (t.includes('генеру') || t.includes('generating') || t.includes('формує')) {
                      statusVal = 'status_generating';
                    } else if (t.includes('ollama')) {
                      statusVal = 'status_ollama_connect';
                    } else {
                      // Strip spaces/special chars to prevent broken i18n key lookup
                      statusVal = 'status_mcp_connect';
                    }
                  }
                  set((state) => ({
                    streamingStatuses: { ...state.streamingStatuses, [chatId]: statusVal }
                  }));
                }
              }
            }
          } catch (e) {}
        } 
        // 4. Handle Continuation Lines (literal newline splits inside JSON payload)
        else if (!/^[0-9a-f]:/.test(cleanLine)) {
          let continuation = cleanLine;
          if (continuation.endsWith('"')) continuation = continuation.slice(0, -1);
          continuation = continuation
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');

          if (continuation) {
            fullText += continuation;
            pushStreamUpdate(fullText);
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (lineBuffer.trim()) processLine(lineBuffer);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        lineBuffer += chunk;
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() ?? '';
        for (const line of lines) {
          processLine(line);
        }
      }

      if (pendingAnimationFrameId) {
        cancelAnimationFrame(pendingAnimationFrameId);
      }

      console.log(`🎨 [UI STREAM COMPLETED] ChatID: ${chatId}, Total Received Chars: ${fullText.length}, Preview: ${JSON.stringify(fullText.slice(0, 60))}`);

      // Fail-safe: if stream ended with 0 text content, set fallback text so message never disappears silently!
      if (!fullText.trim()) {
        console.warn(`⚠️ [UI STORE] Stream for chat ${chatId} finished with empty text! Using fail-safe fallback.`);
        fullText = '⚠️ [Помилка моделі]: Локальна модель не повернула текст відповіді. Будь ласка, спробуйте повторити запит.';
      }

      set((state) => ({
        streamingTexts: { ...state.streamingTexts, [chatId]: fullText }
      }));

      // Save assistant response to DB on completion
      let savedMsg: any = null;
      if (fullText.trim()) {
        const currentMsgId = get().streamingMessageIds[chatId];
        savedMsg = await addMessage(chatId, 'assistant', fullText.trim(), finalSettings, undefined, currentMsgId);
      }

      // Check active chat state
      const isCurrentlyActive = get().activeChatId === chatId;
      set((state) => {
        const nextControllers = { ...state.abortControllers };
        const nextStreaming = { ...state.streamingTexts };
        const nextStatuses = { ...state.streamingStatuses };
        delete nextControllers[chatId];
        delete nextStreaming[chatId];
        delete nextStatuses[chatId];

        return {
          abortControllers: nextControllers,
          streamingTexts: nextStreaming,
          streamingStatuses: nextStatuses,
          chatStatuses: {
            ...state.chatStatuses,
            [chatId]: isCurrentlyActive ? 'idle' : 'completed_unread'
          },
          lastCompletedMessage: savedMsg ? {
            ...state.lastCompletedMessage,
            [chatId]: {
              id: savedMsg.id,
              role: savedMsg.role,
              content: savedMsg.content,
              createdAt: savedMsg.createdAt,
              annotations: [finalSettings]
            }
          } : state.lastCompletedMessage
        };
      });

    } catch (err: any) {
      // Cancel any pending RAF update from the streaming loop before cleaning up
      if (pendingAnimationFrameId) {
        cancelAnimationFrame(pendingAnimationFrameId);
        pendingAnimationFrameId = null;
      }
      if (err.name !== 'AbortError') {
        console.error(`[BackgroundGeneration] Error in chat ${chatId}:`, err);
      }

      // If aborted, save whatever was generated so far
      const currentText = get().streamingTexts[chatId];
      if (err.name === 'AbortError' && currentText && currentText.trim() && err.message !== 'rollback' && get().abortControllers[chatId]?.signal.reason !== 'rollback') {
        addMessage(chatId, 'assistant', currentText.trim(), settings).then((savedMsg) => {
          if (savedMsg) {
            set((state) => ({
              lastCompletedMessage: {
                ...state.lastCompletedMessage,
                [chatId]: {
                  id: savedMsg.id,
                  role: savedMsg.role,
                  content: savedMsg.content,
                  createdAt: savedMsg.createdAt,
                  annotations: [settings]
                }
              }
            }));
          }
        }).catch(console.error);
      }

      set((state) => {
        const nextControllers = { ...state.abortControllers };
        const nextStreaming = { ...state.streamingTexts };
        const nextStatuses = { ...state.streamingStatuses };
        delete nextControllers[chatId];
        delete nextStreaming[chatId];
        delete nextStatuses[chatId];

        return {
          abortControllers: nextControllers,
          streamingTexts: nextStreaming,
          streamingStatuses: nextStatuses,
          chatStatuses: { ...state.chatStatuses, [chatId]: 'idle' }
        };
      });
    }
  }
}));
