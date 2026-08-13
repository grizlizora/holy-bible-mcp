"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useChat } from 'ai/react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { EmptyState } from './EmptyState';
import { InputDock } from './InputDock';
import { useChatStore } from '@/stores/useChatStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { getGlassClasses } from "@/components/ui/glass";
import { cn } from "@/lib/utils";
import { getMessages, addMessage, rollbackChatToMessage } from '@/lib/actions/chat.actions';

interface ChatViewProps {
  chatId: string;
}

export function ChatView({ chatId }: ChatViewProps) {
  const tChatView = useTranslations('ChatView');
  // Granular per-chat selectors — prevents re-renders when other chats update or stream
  const chat = useChatStore(useCallback(s => s.chats.find(c => c.id === chatId), [chatId]));
  const status = useChatStore(s => s.chatStatuses[chatId]) || 'idle';
  const currentStreamText = useChatStore(s => s.streamingTexts[chatId]) || '';
  const currentStatusKey = useChatStore(s => s.streamingStatuses[chatId]) || 'processingRequest';
  const stopChatGeneration = useChatStore(s => s.stopChatGeneration);
  const startBackgroundGeneration = useChatStore(s => s.startBackgroundGeneration);
  const lastCompletedMsg = useChatStore(s => s.lastCompletedMessage[chatId]);
  const streamingSettingsForChat = useChatStore(s => s.streamingSettings[chatId]);
  const streamingMsgId = useChatStore(s => s.streamingMessageIds[chatId]);
  
  const { channelType, localProvider, apiProvider, selectedModel, mcpSettings, activeMcpId, activeWarmthMcpId, activeModeMcpId } = useSettingsStore(
    useShallow((s: any) => ({
      channelType: s.channelType,
      localProvider: s.localProvider,
      apiProvider: s.apiProvider,
      selectedModel: s.selectedModel,
      mcpSettings: s.mcpSettings,
      activeMcpId: s.activeMcpId,
      activeWarmthMcpId: s.activeWarmthMcpId,
      activeModeMcpId: s.activeModeMcpId,
    }))
  );

  
  const resolvedMcpId = activeWarmthMcpId || activeModeMcpId || activeMcpId;

  
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollPill, setShowScrollPill] = useState(false);
  const scrollToBottomRef = useRef<(() => void) | null>(null);

  const handleScrollStateChange = useCallback((isScrolledUp: boolean, scrollToBottom: () => void) => {
    setShowScrollPill(isScrolledUp);
    scrollToBottomRef.current = scrollToBottom;
  }, []);

  const handlePillClick = useCallback(() => {
    scrollToBottomRef.current?.();
    setShowScrollPill(false);
  }, []);

  const isGenerating = status === 'generating';

  // Ensure scroll pill is hidden if chat is empty
  useEffect(() => {
    if (messages.length === 0) {
      setShowScrollPill(false);
    }
  }, [messages.length]);

  // Load history from DB on mount or when switching chats
  useEffect(() => {
    let isSubscribed = true;
    async function loadChatMessages() {
      setIsLoading(true);
      const data = await getMessages(chatId);
      if (!isSubscribed) return;

      const initialMessages = data.map((m: any) => {
        let parsedMetadata = null;
        if (m.metadata) {
          try { parsedMetadata = JSON.parse(m.metadata); } catch (e) {}
        }
        
        return {
          id: m.id,
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
          createdAt: m.createdAt,
          annotations: parsedMetadata ? [parsedMetadata] : [],
          attachments: (m as any).attachments || []
        };
      });
      
      setMessages(initialMessages);
      setIsLoading(false);

      // Auto-trigger AI if chat was newly created and has 1 user message without AI response
      if (initialMessages.length === 1 && initialMessages[0].role === 'user' && !isGenerating) {
        const metadata = { channelType, localProvider, apiProvider, selectedModel, mcpSettings, primaryMcpId: resolvedMcpId };
        startBackgroundGeneration(chatId, initialMessages[0].content, [], metadata, initialMessages[0].attachments || []);
      }
    }

    loadChatMessages();
    return () => { isSubscribed = false; };
  }, [chatId]);

  // When lastCompletedMsg arrives from DB, commit it to state
  useEffect(() => {
    if (!lastCompletedMsg) return;
    setMessages(prev => {
      const filtered = prev.filter(m => !String(m.id).startsWith('streaming-'));
      if (filtered.some(m => m.id === lastCompletedMsg.id)) return filtered;
      return [...filtered, lastCompletedMsg];
    });
  }, [lastCompletedMsg]);

  const [dockText, setDockText] = useState<string | undefined>(undefined);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string, newAttachments?: any[]) => {
    if (!text.trim() && (!newAttachments || newAttachments.length === 0)) return;
    
    const metadata = { channelType, localProvider, apiProvider, selectedModel, mcpSettings, primaryMcpId: resolvedMcpId };
    const savedMsg = await addMessage(chatId, 'user', text, metadata, newAttachments);
    const newMsg = {
      id: savedMsg.id,
      role: 'user',
      content: text,
      createdAt: savedMsg.createdAt,
      annotations: [metadata],
      attachments: newAttachments || []
    };
    setMessages(prev => [...prev, newMsg]);
    setDockText('');
    startBackgroundGeneration(chatId, text, messagesRef.current, metadata, newAttachments);
  }, [chatId, channelType, localProvider, apiProvider, selectedModel, mcpSettings, resolvedMcpId, startBackgroundGeneration]);

  const handleStop = useCallback(() => {
    stopChatGeneration(chatId);
  }, [chatId, stopChatGeneration]);

  const handleRollback = useCallback(async (messageId: string, promptText: string) => {
    stopChatGeneration(chatId, 'rollback');
    useChatStore.getState().clearLastCompletedMessage(chatId);
    
    // Perform DB rollback
    await rollbackChatToMessage(chatId, messageId);
    
    // Clean attached file context dumps from promptText
    const cleanPrompt = (typeof promptText === 'string' ? promptText : '')
      .replace(/\[USER ATTACHED FILES REFERENCE CONTEXT\][\s\S]*$/, '')
      .replace(/\[ДОВІДКОВА ІНФОРМАЦІЯ З ПРИКРІПЛЕНИХ ФАЙЛІВ КОРИСТУВАЧЕМ\][\s\S]*$/, '')
      .trim();

    // Reset first then update to guarantee React useEffect trigger in InputDock
    setDockText('');
    setTimeout(() => {
      setDockText(cleanPrompt);
    }, 10);

    // Synchronize fresh messages directly from DB so memory is 100% clean
    const dbMsgs = await getMessages(chatId);
    setMessages(dbMsgs);
  }, [chatId, stopChatGeneration]);

  const chatTitle = chat?.title || 'Liquid AI Workspace';

  const streamingCreatedAtRef = useRef<Date | null>(null);

  if (isGenerating) {
    if (!streamingCreatedAtRef.current) {
      streamingCreatedAtRef.current = new Date();
    }
  } else {
    streamingCreatedAtRef.current = null;
  }

  const fallbackSettings = useMemo(() => ({
    channelType, localProvider, apiProvider, selectedModel, mcpSettings, primaryMcpId: resolvedMcpId
  }), [channelType, localProvider, apiProvider, selectedModel, mcpSettings, resolvedMcpId]);

  const streamingAnnotations = useMemo(
    () => [streamingSettingsForChat || fallbackSettings],
    [streamingSettingsForChat, fallbackSettings]
  );

  const displayMessages = useMemo(() => {
    const base = messages.filter(m => !String(m.id).startsWith('streaming-'));
    if (isGenerating) {
      return [...base, {
        id: lastCompletedMsg ? lastCompletedMsg.id : (streamingMsgId || 'streaming-' + chatId),
        role: 'assistant',
        content: currentStreamText,
        createdAt: streamingCreatedAtRef.current || new Date(),
        annotations: streamingAnnotations
      }];
    }
    if (lastCompletedMsg && !base.some(m => m.id === lastCompletedMsg.id)) {
      return [...base, lastCompletedMsg];
    }
    return base;
  }, [messages, isGenerating, currentStreamText, chatId, streamingAnnotations, lastCompletedMsg, streamingMsgId]);


  return (
    <div className="relative flex flex-col h-full w-full min-w-0 overflow-hidden">
      {/* Header Layer */}
      <div className="w-full z-20 flex-shrink-0">
        <ChatHeader chatTitle={chatTitle} />
      </div>

      {/* Scrollable Message List Layer */}
      <div className="flex-1 min-h-0 relative z-0">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
        ) : displayMessages.length === 0 ? (
          <EmptyState />
        ) : (
          <ErrorBoundary fallbackText="Помилка рендерингу списку повідомлень">
            <MessageList 
              messages={displayMessages as any} 
              isAiStreaming={isGenerating} 
              onRollback={handleRollback}
              onScrollStateChange={handleScrollStateChange}
              currentStatusKey={currentStatusKey}
            />
          </ErrorBoundary>
        )}
      </div>

      {/* Scroll-to-bottom pill — zero-height anchor, floats UP over messages */}
      <AnimatePresence>
        {showScrollPill && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="relative flex-shrink-0 z-30 flex justify-center"
            style={{ height: 0 }}
          >
            <button
              onClick={handlePillClick}
              style={{ transform: 'translateY(calc(-100% - 6px))', padding: '16px 24px 16px 18px' }}
              className={cn(
                getGlassClasses("medium", "md"),
                "group inline-flex items-center gap-4 w-fit whitespace-nowrap hover:bg-white/40 dark:hover:bg-slate-700/60 rounded-full shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] active:scale-95 cursor-pointer transition-all duration-300"
              )}
            >
              <ArrowDown size={20} strokeWidth={2.5} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
              <span className="text-[15px] font-semibold">{tChatView('scrollToBottom')}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Dock Layer */}
      <div className="w-full z-20 flex-shrink-0">
        <InputDock 
          onSendMessage={handleSendMessage} 
          isStreaming={isGenerating} 
          onStop={handleStop} 
          initialText={dockText}
        />
      </div>
    </div>
  );
}
