"use client";

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { EmptyState } from '@/components/chat/EmptyState';
import { ChatView } from '@/components/chat/ChatView';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { InputDock } from '@/components/chat/InputDock';
import { AmbientFluidBackground } from '@/components/chat/AmbientFluidBackground';
import { useChatStore } from '@/stores/useChatStore';
import { createChat, addMessage } from '@/lib/actions/chat.actions';
import { useTranslations } from 'next-intl';

export default function Home() {
  const tPage = useTranslations('Page');
  const activeChatId = useChatStore(s => s.activeChatId);
  const setActiveChat = useChatStore(s => s.setActiveChat);
  const addChat = useChatStore(s => s.addChat);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();

      // Disable Telegram native vertical swipe-to-close gesture to unlock 60-120 FPS performance if supported (v7.7+)
      if (typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('7.7')) {
        if (typeof tg.disableVerticalSwipes === 'function') {
          tg.disableVerticalSwipes();
        }
        if ('isVerticalSwipesEnabled' in tg) {
          tg.isVerticalSwipesEnabled = false;
        }
      }
    }
  }, []);

  const handleInitialSendMessage = async (content: string, attachments?: any[]) => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      // Create new chat title from first 30 chars of prompt or first attachment filename
      let title = content.trim();
      if (!title && attachments && attachments.length > 0) {
        title = attachments[0].filename || tPage('attachedFile');
      }
      if (!title) title = tPage('newChat');
      if (title.length > 30) title = title.slice(0, 30) + '...';

      const newChat = await createChat(title);
      addChat(newChat as any);
      
      // Save initial message with attachments!
      await addMessage(newChat.id, 'user', content, undefined, attachments);
      
      // Set active chat so ChatView mounts and streams AI response
      setActiveChat(newChat.id);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div id="app-content" className="flex h-[100dvh] w-full overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 flex flex-col relative z-10 min-w-0 overflow-hidden">
        {activeChatId ? (
          <ChatView key={activeChatId} chatId={activeChatId} />
        ) : (
          <div className="flex flex-col h-full w-full relative min-w-0 overflow-hidden">
            <ChatHeader chatTitle="Liquid AI Workspace" />
            <EmptyState />
            <InputDock onSendMessage={handleInitialSendMessage} />
          </div>
        )}
      </main>
    </div>
  );
}
