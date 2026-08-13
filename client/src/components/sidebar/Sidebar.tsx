"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, Plus, Settings, MessageSquare, MoreVertical, X, 
  Trash2, Edit2, Check, Loader2, GripVertical, Search, Pin, SearchX, Square, CheckCircle2
} from "lucide-react";
import { GlassBox, GlassButton, getGlassClasses } from "@/components/ui/glass";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { useChatStore } from '@/stores/useChatStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getChats, createChat, deleteChat, togglePinChat, searchChatsGlobal } from '@/lib/actions/chat.actions';

import { useShallow } from 'zustand/react/shallow';

const SettingsModal = dynamic(
  () => import('../settings/SettingsModal').then((mod) => mod.SettingsModal),
  { ssr: false }
);

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mounted, setMounted] = useState(false);
  const tSidebar = useTranslations('Sidebar');
  const tSettings = useTranslations('Settings');

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const prefetchSettings = () => import('../settings/SettingsModal');
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(prefetchSettings);
      } else {
        setTimeout(prefetchSettings, 800);
      }
    }
  }, []);
  
  const chats = useChatStore(useShallow(s => s.chats));
  const chatStatuses = useChatStore(useShallow(s => s.chatStatuses));
  const setChats = useChatStore(s => s.setChats);
  const addChat = useChatStore(s => s.addChat);
  const storeDeleteChat = useChatStore(s => s.deleteChat);
  const storePinChat = useChatStore(s => s.pinChat);
  const activeChatId = useChatStore(s => s.activeChatId);
  const setActiveChat = useChatStore(s => s.setActiveChat);
  const storeStopChatGeneration = useChatStore(s => s.stopChatGeneration);
  const isMobileSidebarOpen = useSettingsStore(s => s.isMobileSidebarOpen);
  const setMobileSidebarOpen = useSettingsStore(s => s.setMobileSidebarOpen);

  const [isLoadingChats, setIsLoadingChats] = useState(true);

  useEffect(() => {
    async function loadChats() {
      try {
        const data = await getChats();
        setChats(data as any[]);
      } finally {
        setIsLoadingChats(false);
      }
    }
    loadChats();
  }, [setChats]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchChatsGlobal(searchQuery.trim());
        setSearchResults(results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleSidebar = () => setIsOpen(prev => !prev);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [chats]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;

    const pinned = sortedChats.filter(c => c.isPinned);
    const sourceIdx = pinned.findIndex(c => c.id === sourceId);
    const targetIdx = pinned.findIndex(c => c.id === targetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const newPinned = [...pinned];
      const [moved] = newPinned.splice(sourceIdx, 1);
      newPinned.splice(targetIdx, 0, moved);

      const unpinned = sortedChats.filter(c => !c.isPinned);
      setChats([...newPinned, ...unpinned]);
    }
  };

  const handleCreateChat = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const newChat = await createChat(tSidebar('newChat'));
      addChat(newChat as any);
      setActiveChat(newChat.id);
      setMobileSidebarOpen(false);
      if (!isOpen) setIsOpen(true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteChat(id);
    storeDeleteChat(id);
  };

  const handlePinChat = async (e: React.MouseEvent, id: string, isPinned: boolean) => {
    e.stopPropagation();
    await togglePinChat(id, !isPinned);
    storePinChat(id, !isPinned);
  };

  const renderSidebarContent = (isDrawer = false) => {
    const isExpanded = isDrawer || isOpen;

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className={cn(
          "flex shrink-0 items-center border-b border-white/20 dark:border-slate-700/50 p-4 h-[72px] sm:h-[80px]",
          isExpanded ? "justify-between" : "justify-center"
        )}>
          {isExpanded && (
            <span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
              Liquid AI
            </span>
          )}
          <GlassButton 
            onClick={() => {
              if (isDrawer) {
                setMobileSidebarOpen(false);
              } else {
                toggleSidebar();
              }
            }}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0"
          >
            <X size={20} className="md:hidden" />
            <Menu size={20} className="hidden md:block" />
          </GlassButton>
        </div>

        {/* New Chat Button */}
        <div className={cn("pt-4 pb-4 shrink-0", isExpanded ? "px-4" : "px-3 flex justify-center")}>
          {isExpanded ? (
            <button 
              onClick={handleCreateChat}
              disabled={isCreating}
              className="flex items-center justify-center w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white p-3.5 rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-[0.98] transition-all duration-300 min-w-0"
            >
              {isCreating ? <Loader2 size={20} className="animate-spin shrink-0" /> : <Plus size={20} className="shrink-0" />}
              <span className="truncate">{tSidebar('newChat')}</span>
            </button>
          ) : (
            <button
              onClick={handleCreateChat}
              disabled={isCreating}
              title={tSidebar('newChat')}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
            >
              {isCreating ? <Loader2 size={20} className="animate-spin" /> : <Plus size={22} />}
            </button>
          )}
        </div>

        {/* Search */}
        <div className={cn("pb-4 shrink-0", isExpanded ? "px-4" : "px-3 flex justify-center")}>
          {isExpanded ? (
            <div className="relative h-11 w-full bg-white/50 dark:bg-slate-800/30 rounded-2xl border border-white/60 dark:border-slate-700/50 shadow-sm group transition-all duration-300 focus-within:bg-white/80 dark:focus-within:bg-slate-800/50 focus-within:border-blue-400 dark:focus-within:border-slate-600/50 focus-within:shadow-md">
              <div className={`absolute inset-0 flex items-center justify-center gap-2 pointer-events-none transition-all duration-300 ${searchQuery || 'group-focus-within:opacity-0 group-focus-within:scale-95'} ${searchQuery ? 'opacity-0 scale-95' : 'opacity-100'}`}>
                <Search size={16} className="text-slate-600 dark:text-slate-500 shrink-0" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-500 truncate max-w-[160px]">{tSidebar('searchPlaceholder')}</span>
              </div>
              
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px', paddingRight: '38px' }}
                className="w-full h-full bg-transparent text-sm font-medium focus:outline-none text-slate-800 dark:text-slate-100 relative z-10"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setSearchQuery('')}
                    style={{ right: '10px' }}
                    className={cn(
                      getGlassClasses("medium", "md"),
                      "absolute z-20 flex items-center justify-center w-6 h-6 rounded-full shadow-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600/60 transition-all active:scale-95"
                    )}
                  >
                    <X size={13} strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => setIsOpen(true)}
              title={tSidebar('searchPlaceholder')}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-white/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/70 border border-white/60 dark:border-slate-700/50 shadow-sm active:scale-95 transition-all"
            >
              <Search size={20} />
            </button>
          )}
        </div>

        {/* Chats List or Search Results */}
        <div className={cn("py-2 flex flex-col gap-1 flex-1 overflow-y-auto min-h-0 scrollbar-hide", isExpanded ? "px-4" : "px-2 items-center")}>
          {searchQuery.trim() && isExpanded ? (
            <>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 pl-2 flex items-center">
                Результати пошуку
                {isSearching && <Loader2 size={12} className="ml-2 animate-spin text-blue-500" />}
              </h3>
              
              {!isSearching && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <GlassBox variant="clear" intensity="md" className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 text-slate-400">
                    <SearchX size={20} />
                  </GlassBox>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Нічого не знайдено
                  </div>
                  <div className="text-xs text-slate-400 max-w-[180px]">
                    Спробуйте змінити слово або перевірте правильність написання
                  </div>
                </div>
              )}
              
              {searchResults.map((res, i) => (
                <motion.button 
                  key={`${res.chatId}-${res.messageId}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  onClick={() => {
                    setActiveChat(res.chatId);
                    setMobileSidebarOpen(false);
                    setSearchQuery('');
                  }}
                  className={cn(
                    getGlassClasses("medium", "sm"),
                    "flex flex-col text-left p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-800/60 transition-all hover:border-blue-200 dark:hover:border-slate-600/50 hover:shadow-md group active:scale-[0.98] mb-1.5"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate pr-2">
                      {res.chatTitle}
                    </div>
                    <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">
                      {new Intl.DateTimeFormat('uk-UA', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(new Date(res.messageTime))}
                    </div>
                  </div>
                  <div className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {res.snippet.split(/\[\[\[MATCH\]\]\]|\[\[\[\/MATCH\]\]\]/g).map((part: string, index: number) => 
                      index % 2 === 1 ? (
                        <b key={index} className="text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/20 px-1 py-0.5 rounded-md font-semibold border border-blue-500/20">
                          {part}
                        </b>
                      ) : (
                        <span key={index}>{part}</span>
                      )
                    )}
                  </div>
                </motion.button>
              ))}
            </>
          ) : (
            <>
              {isExpanded && (
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 pl-2">
                  {tSidebar('chats')}
                </h3>
              )}
              {sortedChats.map(chat => (
                <NavItem 
                  key={chat.id}
                  id={chat.id}
                  icon={<MessageSquare size={18} />} 
                  label={chat.title} 
                  isOpen={isExpanded} 
                  isActive={activeChatId === chat.id}
                  status={chatStatuses[chat.id] || 'idle'}
                  onClick={() => {
                    setActiveChat(chat.id);
                    setMobileSidebarOpen(false);
                  }}
                  onPin={(e) => handlePinChat(e, chat.id, chat.isPinned)}
                  onDelete={(e) => handleDeleteChat(e, chat.id)}
                  onStop={(e) => {
                    e.stopPropagation();
                    storeStopChatGeneration(chat.id);
                  }}
                  isPinned={chat.isPinned}
                  isDraggable={chat.isPinned}
                  onDragStart={(e) => handleDragStart(e, chat.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, chat.id)}
                />
              ))}
              {isLoadingChats ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={18} className="animate-spin text-slate-400" />
                </div>
              ) : sortedChats.length === 0 && isExpanded ? (
                <div className="text-sm text-slate-400 text-center py-4">{tSidebar('noChats')}</div>
              ) : null}
            </>
          )}
        </div>

        {/* Footer / Profile */}
        <div className={cn("pt-2 shrink-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md", isExpanded ? "p-4" : "p-3 flex justify-center")}>
          {isExpanded ? (
            <button onClick={() => setIsSettingsOpen(true)} className={cn(getGlassClasses("medium", "md"), "flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-white/80 dark:hover:bg-slate-800/80 shadow-sm transition-all group active:scale-[0.98]")}>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-inner border border-white/20">
                РВ
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <div className="text-[14px] font-bold truncate text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Роман Вайда</div>
                <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400 truncate">{tSettings('title')}</div>
              </div>
              <Settings size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors mr-1" />
            </button>
          ) : (
            <button 
              onClick={() => setIsSettingsOpen(true)}
              title="Роман Вайда - Налаштування"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm border border-white/20 active:scale-95 transition-all"
            >
              РВ
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          getGlassClasses("medium", "xl"),
          "hidden md:flex flex-col h-[100dvh] border-y-0 border-l-0 border-r border-white/20 dark:border-slate-800/60 relative z-20 flex-shrink-0 shadow-lg shadow-slate-900/5 overflow-hidden transition-all duration-300 ease-in-out rounded-none",
          isOpen ? "w-[280px]" : "w-[76px]"
        )}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer Backdrop (Portaled to document.body + GPU Compositor Promoted for 120 FPS) */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-[999] md:hidden flex pointer-events-auto liquid-drawer-portal">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 bg-slate-900/30 dark:bg-black/60 backdrop-blur-md"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{ 
                  borderTopRightRadius: '32px', 
                  borderBottomRightRadius: '32px',
                  willChange: 'transform',
                  transform: 'translateZ(0)'
                }}
                className="relative z-10 w-[82%] max-w-[300px] h-[100dvh] bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
              >
                {renderSidebarContent(true)}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}

const NavItem = React.memo(function NavItem({ id, icon, label, isOpen, isActive, status, onClick, onPin, onDelete, onStop, isPinned, isDraggable, onDragStart, onDragOver, onDrop }: { 
  id?: string,
  icon: React.ReactNode, 
  label: string, 
  isOpen: boolean, 
  isActive?: boolean,
  status?: string,
  isPinned?: boolean,
  onClick: () => void,
  onPin: (e: React.MouseEvent) => void,
  onDelete: (e: React.MouseEvent) => void,
  onStop?: (e: React.MouseEvent) => void,
  isDraggable?: boolean,
  onDragStart?: (e: React.DragEvent) => void,
  onDragOver?: (e: React.DragEvent) => void,
  onDrop?: (e: React.DragEvent) => void
}) {
  if (!isOpen) {
    return (
      <button
        onClick={onClick}
        title={label}
        className={cn(
          "w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center relative transition-all group border shrink-0 my-0.5",
          isActive
            ? "bg-blue-100/80 dark:bg-blue-500/25 border-blue-400/60 dark:border-blue-500/50 text-blue-700 dark:text-blue-300 shadow-xs"
            : "border-transparent hover:border-slate-200/80 dark:hover:border-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
        )}
      >
        <span className="flex-shrink-0">{icon}</span>

        {/* Compact Status Indicator */}
        {status === 'generating' && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse border border-white dark:border-slate-900" />
        )}
        {status === 'completed_unread' && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
        )}
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "flex items-center gap-2.5 w-full p-2.5 rounded-2xl transition-all group relative border",
        isActive 
          ? "bg-blue-100/70 dark:bg-blue-500/20 border-blue-300/60 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 shadow-xs" 
          : "border-transparent hover:border-slate-200/80 dark:hover:border-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300",
        isDraggable && "cursor-grab active:cursor-grabbing"
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-sm font-medium truncate flex-1 text-left pr-2">{label}</span>

      {/* Live Background Status Indicators */}
      {status === 'generating' && (
        <div className="flex items-center ml-1 bg-purple-100/80 dark:bg-purple-500/10 backdrop-blur-md text-purple-600 dark:text-purple-300 rounded-full text-[10px] font-extrabold flex-shrink-0 border border-purple-200/80 dark:border-purple-500/20 shadow-sm overflow-hidden group/gen transition-all">
          <div className="flex items-center gap-1.5 pl-3.5 pr-2.5 py-1">
            <Loader2 size={10} className="animate-spin text-purple-500 dark:text-purple-400" />
            <span className="animate-pulse">Генерує...</span>
          </div>
          <div className="w-[1px] h-3 bg-purple-200 dark:bg-purple-500/20"></div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (onStop) onStop(e);
            }}
            className="flex items-center justify-center px-2 py-1 hover:bg-purple-200/80 dark:hover:bg-purple-500/30 hover:text-red-500 dark:hover:text-red-400 text-purple-500/70 dark:text-purple-400/70 transition-all cursor-pointer"
            title="Зупинити генерацію"
            role="button"
          >
            <Square size={8} className="fill-current" />
          </div>
        </div>
      )}

      {status === 'completed_unread' && (
        <div className="flex items-center ml-1 bg-emerald-100/80 dark:bg-emerald-500/10 backdrop-blur-md text-emerald-600 dark:text-emerald-300 rounded-full text-[10px] font-extrabold flex-shrink-0 border border-emerald-200/80 dark:border-emerald-500/20 shadow-sm overflow-hidden group/done transition-all">
          <div className="flex items-center gap-1.5 pl-3.5 pr-2.5 py-1">
            <CheckCircle2 size={10} className="text-emerald-500 dark:text-emerald-400" />
            <span>Готово</span>
          </div>
        </div>
      )}

      {/* Hover action icons */}
      <div className="hidden group-hover:flex items-center gap-1 ml-auto">
        <div onClick={onPin} className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${isPinned ? 'text-blue-500' : 'text-slate-400'}`}>
          <Pin size={14} className={isPinned ? 'fill-current' : ''} />
        </div>
        <div onClick={onDelete} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500">
          <Trash2 size={14} />
        </div>
      </div>
    </button>
  );
});
