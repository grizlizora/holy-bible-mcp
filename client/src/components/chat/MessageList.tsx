import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { RichTextRenderer } from './RichTextRenderer';
import { formatBiblicalDisplayTitle } from '@/lib/bible/osis-map';
import { AiThinkingIndicator } from './AiThinkingIndicator';
import { Bot, User, Volume2, Copy, Check, RotateCcw, Loader2, Settings } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { GlassBox, GlassButton } from "@/components/ui/glass";
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTheme } from 'next-themes';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  annotations?: any[];
  attachments?: any[];
}

interface MessageListProps {
  messages: Message[];
  isAiStreaming?: boolean;
  onRollback?: (messageId: string, promptText: string) => void;
  onScrollStateChange?: (isScrolledUp: boolean, scrollToBottom: () => void) => void;
  currentStatusKey?: string;
}

const fallbackDetailLabels: Record<string, { label: string, iconName: string }> = {
  'minimal': { label: 'Мінімально', iconName: 'Zap' },
  'short': { label: 'Скорочено', iconName: 'Pencil' },
  'medium': { label: 'Середньо', iconName: 'Scale' },
  'detailed': { label: 'Детально', iconName: 'Search' },
  'deep': { label: 'Поглиблено', iconName: 'Landmark' },
  'verses_only': { label: 'Тільки Вірші', iconName: 'Scroll' },
};

import { FileText, File as FileIcon, Image as ImageIcon, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

const MessageItem = memo(function MessageItem({
  msg,
  idx,
  isUser,
  defaultMeta,
  isCopied,
  onCopyUserPrompt,
  onCopyCleanAssistantText,
  onTTS,
  onRollback,
  isStreaming,
  currentStatusKey
}: {
  msg: Message;
  idx: number;
  isUser: boolean;
  defaultMeta: any;
  isCopied: boolean;
  onCopyUserPrompt: (content: string, id: string) => void;
  onCopyCleanAssistantText: (content: string, id: string) => void;
  onTTS: (text: string) => void;
  onRollback?: (messageId: string, promptText: string) => void;
  isStreaming?: boolean;
  currentStatusKey?: string;
}) {
  const tMsg = useTranslations('MessageList');
  const tDetail = useTranslations('DetailModal');

  const { resolvedTheme } = useTheme();
  // Use resolvedTheme directly — dark class is already set server-side, no flash possible here
  const isDark = resolvedTheme === 'dark';
  const assistantBg = isDark ? '#0f172a' : '#ffffff';
  const assistantFg = isDark ? '#ffffff' : '#0f172a';

  const msgMeta = useMemo(() => (msg.annotations?.[0] || {}) as any, [msg.annotations]);
  const activeMcpId = msgMeta.primaryMcpId || defaultMeta.activeMcpId || 'holy-bible-mcp';
  const primaryConfig = useMemo(() => 
    defaultMeta.mcpConfigs?.find((c: any) => c.id === activeMcpId) || defaultMeta.mcpConfigs?.[0], 
  [defaultMeta.mcpConfigs, activeMcpId]);
  
  const { detailMap, warmthIconName } = useMemo(() => {
    const detailLevelConfig = primaryConfig?.settings?.find((s: any) => s.id === 'detailLevel');
    const warmthConfig = primaryConfig?.settings?.find((s: any) => s.id === 'warmth');
    
    const map: Record<string, { label: string, iconName: string }> = {
      'minimal': { label: tDetail('minimal'), iconName: 'Zap' },
      'short': { label: tDetail('short'), iconName: 'Pencil' },
      'medium': { label: tDetail('medium'), iconName: 'Scale' },
      'detailed': { label: tDetail('detailed'), iconName: 'Search' },
      'deep': { label: tDetail('deep'), iconName: 'Landmark' },
      'verses_only': { label: tDetail('versesOnly'), iconName: 'Scroll' },
    };

    if (detailLevelConfig?.options && detailLevelConfig.options.length > 0) {
      detailLevelConfig.options.forEach((opt: any) => {
        map[opt.value] = {
          label: opt.label?.uk || opt.value,
          iconName: opt.iconName || 'Settings'
        };
      });
    }

    return { 
      detailMap: map, 
      warmthIconName: warmthConfig?.iconName || 'Flame' 
    };
  }, [primaryConfig, tDetail]);
  const mcpSpecificSettings = msgMeta.mcpSettings?.[activeMcpId] || defaultMeta.mcpSettings?.[activeMcpId] || {};
  const msgWarmth = mcpSpecificSettings.warmth ?? 80;
  const msgDetailLevel = mcpSpecificSettings.detailLevel ?? 'medium';
  const msgChannelType = msgMeta.channelType ?? defaultMeta.channelType;
  const msgLocalProvider = msgMeta.localProvider ?? defaultMeta.localProvider;
  const msgApiProvider = msgMeta.apiProvider ?? defaultMeta.apiProvider;
  const msgSelectedModel = msgMeta.selectedModel ?? defaultMeta.selectedModel;

  const sourceBadge = useMemo(() => {
    const modelClean = (msgSelectedModel || 'qwen2.5').replace(/[()]/g, '');
    if (msgChannelType === 'local') return `💻 ${msgLocalProvider.toUpperCase()} ${modelClean}`;
    if (msgChannelType === 'api') return `☁️ ${msgApiProvider.toUpperCase()} ${modelClean}`;
    return '🛡️ P2P Mesh';
  }, [msgSelectedModel, msgChannelType, msgLocalProvider, msgApiProvider]);

  const bubbleStyle = useMemo(() => ({
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    opacity: 1,
    backgroundColor: isUser ? '#2563eb' : assistantBg,
    color: isUser ? '#ffffff' : assistantFg
  }), [isUser, assistantBg, assistantFg]);

  const formattedTime = useMemo(() =>
    new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  , [msg.createdAt]);

  const msgKey = msg.id || `${msg.role}-${idx}`;

  return (
    <div
      key={msgKey}
      style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
      className={`chat-item-contain ${isStreaming ? 'is-streaming' : ''} flex gap-3 max-w-full ${isUser ? 'flex-row-reverse self-end w-full sm:w-auto' : 'flex-row self-start w-full'}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm ${isUser ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white border border-white/40 shadow-blue-500/30' : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)]'}`}>
          {isUser ? <User size={18} /> : <Bot size={18} className="text-blue-600 dark:text-blue-400" />}
        </div>
      </div>

      {/* Message Content & Metadata */}
      <div className={`flex flex-col min-w-0 overflow-hidden ${isUser ? 'items-end max-w-[85%]' : 'items-start w-full max-w-[85%]'}`}>
        
        {/* Floating Tags Metadata Cluster */}
        <div className={`flex flex-wrap items-center gap-1.5 mb-1.5 w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
          
          {/* Unified Source + Warmth + Mode pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-[11px] font-extrabold text-blue-600 dark:text-blue-400 max-w-[280px] sm:max-w-[400px] overflow-hidden">
            <span className="shrink-0">{sourceBadge.split(' ')[0]}</span>
            <span className="truncate">{sourceBadge.split(' ').slice(1).join(' ')}</span>
            {typeof msgWarmth !== 'undefined' && (
              <>
                <span className="text-slate-300 dark:text-slate-600 mx-0.5">·</span>
                <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                  {(() => {
                    const WarmthIcon = (LucideIcons as any)[warmthIconName] || Settings;
                    return <WarmthIcon size={14} className="text-orange-500" />;
                  })()}
                  {msgWarmth}%
                </span>
              </>
            )}
            {msgDetailLevel && (
              <>
                <span className="text-slate-300 dark:text-slate-600 mx-0.5">·</span>
                <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                  {(() => {
                    const iconName = detailMap[msgDetailLevel]?.iconName || 'Settings';
                    const DetailIcon = (LucideIcons as any)[iconName] || Settings;
                    return <DetailIcon size={14} className="text-purple-500 dark:text-purple-400" />;
                  })()}
                  {detailMap[msgDetailLevel]?.label || msgDetailLevel}
                </span>
              </>
            )}
          </div>

          {/* Actions for User Prompt */}
          {isUser && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onCopyUserPrompt(msg.content, msg.id)}
                className="w-6 h-6 rounded-full bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 transition-transform active:scale-95 cursor-pointer"
                title={tMsg('copyRequest')}
              >
                {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>

              {onRollback && (
                  <button
                    onClick={() => onRollback(msg.id, msg.content)}
                    className="w-6 h-6 rounded-full bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-transform active:scale-95 cursor-pointer"
                    title={tMsg('rollbackAndEdit')}
                  >
                    <RotateCcw size={13} />
                  </button>
              )}
            </div>
          )}

          {/* Actions for Assistant Response */}
          {!isUser && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onCopyCleanAssistantText(msg.content, msg.id)}
                className="w-6 h-6 rounded-full bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-transform active:scale-95 cursor-pointer"
                title={tMsg('copyCleanText')}
              >
                {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>

              <button 
                onClick={() => onTTS(msg.content)}
                className="w-6 h-6 rounded-full bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-transform active:scale-95 cursor-pointer"
                title={tMsg('listen')}
              >
                <Volume2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Render Attachments */}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className={`flex flex-wrap gap-2 mb-2 w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
            {msg.attachments.map(att => (
              <a
                key={att.id}
                href={att.url}
                download={att.filename}
                target="_blank"
                rel="noreferrer"
                className="group relative flex items-center gap-2 p-1.5 pr-3 bg-slate-200/60 dark:bg-white/10 hover:bg-slate-300/60 dark:hover:bg-white/20 border border-slate-300/60 dark:border-white/20 rounded-xl overflow-hidden transition-colors text-slate-700 dark:text-slate-200"
                title={tMsg('downloadFile')}
              >
                {att.type === 'image' ? (
                  <img src={att.url} alt={att.filename} className="w-10 h-10 object-cover rounded-lg" />
                ) : (
                  <div className="w-10 h-10 bg-slate-300/50 dark:bg-white/10 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <FileText className="w-5 h-5 opacity-80" />
                  </div>
                )}
                <div className="flex flex-col max-w-[140px]">
                  <span className="text-xs font-semibold truncate opacity-90">{att.filename}</span>
                  <span className="text-[10px] opacity-60">{(att.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Download className="w-4 h-4 text-white" />
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Bubble */}
        <div 
          style={bubbleStyle}
          className={`overflow-hidden p-4 rounded-2xl transition-colors ${
            isUser 
              ? 'w-fit ml-auto bg-blue-600 dark:bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-500/30 rounded-tr-xs' 
              : 'w-full assistant-card-container rounded-tl-xs shadow-md shadow-slate-950/20'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap leading-relaxed text-[15px] font-medium">
              {msg.content
                .replace(/\[USER ATTACHED FILES REFERENCE CONTEXT\][\s\S]*$/, '')
                .replace(/\[ДОВІДКОВА ІНФОРМАЦІЯ З ПРИКРІПЛЕНИХ ФАЙЛІВ КОРИСТУВАЧЕМ\][\s\S]*$/, '')
                .trim()}
            </div>
          ) : (msg.content && msg.content.length > 0) ? (
            <RichTextRenderer content={msg.content} isStreaming={isStreaming} />
          ) : (
            <AiThinkingIndicator statusKey={currentStatusKey} />
          )}
        </div>

      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // If historical non-streaming message, skip re-render completely if content & copy state match!
  if (!prevProps.isStreaming && !nextProps.isStreaming) {
    return prevProps.msg.id === nextProps.msg.id &&
           prevProps.msg.content === nextProps.msg.content &&
           prevProps.isCopied === nextProps.isCopied &&
           prevProps.currentStatusKey === nextProps.currentStatusKey;
  }
  // For streaming message, re-render only when content or status changes
  return prevProps.msg.id === nextProps.msg.id &&
         prevProps.msg.content === nextProps.msg.content &&
         prevProps.isStreaming === nextProps.isStreaming &&
         prevProps.isCopied === nextProps.isCopied &&
         prevProps.currentStatusKey === nextProps.currentStatusKey;
});

export const MessageList = memo(function MessageList({ messages, isAiStreaming, onRollback, onScrollStateChange, currentStatusKey }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);
  const prevMessagesLengthRef = useRef(messages.length);
  const touchStartYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const scrollRafIdRef = useRef<number | null>(null);
  
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStreamScrollTimeRef = useRef(0);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollPill, setShowScrollPill] = useState(false);

  const rawSettings = useSettingsStore(useShallow(s => ({
    mcpSettings: s.mcpSettings,
    channelType: s.channelType,
    localProvider: s.localProvider,
    apiProvider: s.apiProvider,
    selectedModel: s.selectedModel,
    activeMcpId: s.activeMcpId,
    mcpConfigs: s.mcpConfigs,
  })));

  const defaultMeta = useMemo(() => rawSettings, [
    rawSettings.mcpSettings,
    rawSettings.channelType,
    rawSettings.localProvider,
    rawSettings.apiProvider,
    rawSettings.selectedModel,
    rawSettings.activeMcpId,
    rawSettings.mcpConfigs,
  ]);

  // ─── RAF + timer cleanup on unmount ─────────────────────────
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (scrollRafIdRef.current) cancelAnimationFrame(scrollRafIdRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);





  // ─── Scroll helpers ─────────────────────────────────────────
  const doScrollToBottom = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    });
  }, []);

  const handleScrollPillClick = useCallback(() => {
    isUserScrolledUpRef.current = false;
    setShowScrollPill(false);
    onScrollStateChange?.(false, doScrollToBottom);
    doScrollToBottom();
  }, [doScrollToBottom, onScrollStateChange]);

  const handleScroll = useCallback(() => {
    if (scrollRafIdRef.current) return;
    
    scrollRafIdRef.current = window.requestAnimationFrame(() => {
      scrollRafIdRef.current = null;
      if (!containerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      
      if (scrollHeight <= clientHeight) {
        if (isUserScrolledUpRef.current) {
          isUserScrolledUpRef.current = false;
          setShowScrollPill(false);
          onScrollStateChange?.(false, doScrollToBottom);
        }
        return;
      }

      const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
      const isScrolledUp = !isNearBottom;
      
      if (isUserScrolledUpRef.current !== isScrolledUp) {
        isUserScrolledUpRef.current = isScrolledUp;
        setShowScrollPill(isScrolledUp);
        onScrollStateChange?.(isScrolledUp, doScrollToBottom);
      }
    });
  }, [onScrollStateChange, doScrollToBottom]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.deltaY < 0 && containerRef.current) {
      if (containerRef.current.scrollHeight > containerRef.current.clientHeight) {
        isUserScrolledUpRef.current = true;
        setShowScrollPill(true);
        onScrollStateChange?.(true, doScrollToBottom);
      }
    }
  }, [onScrollStateChange, doScrollToBottom]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    if (currentY - touchStartYRef.current > 6 && containerRef.current) {
      if (containerRef.current.scrollHeight > containerRef.current.clientHeight) {
        isUserScrolledUpRef.current = true;
        setShowScrollPill(true);
        onScrollStateChange?.(true, doScrollToBottom);
      }
    }
  }, [onScrollStateChange, doScrollToBottom]);

  // ─── Auto-scroll logic ──────────────────────────────────────
  useEffect(() => {
    const newLength = messages.length;
    const prevLength = prevMessagesLengthRef.current;

    if (newLength > prevLength) {
      prevMessagesLengthRef.current = newLength;
      const lastMsg = messages[newLength - 1];
      
      // Force-scroll only for new user messages (user just sent prompt)
      if (lastMsg && lastMsg.role === 'user') {
        isUserScrolledUpRef.current = false;
        setShowScrollPill(false);
        onScrollStateChange?.(false, doScrollToBottom);
        doScrollToBottom();
      }
      return;
    }

    if (newLength < prevLength) {
      prevMessagesLengthRef.current = newLength;
      if (containerRef.current && containerRef.current.scrollHeight <= containerRef.current.clientHeight) {
        isUserScrolledUpRef.current = false;
        setShowScrollPill(false);
        onScrollStateChange?.(false, doScrollToBottom);
      }
      return;
    }

    // During streaming, native CSS overflowAnchor auto-scrolls on the GPU compositor thread (0% reflow overhead!)
  }, [messages, isAiStreaming, onScrollStateChange]);

  // ─── Handlers ───────────────────────────────────────────────
  const handleTTS = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'uk-UA';
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleCopyCleanAssistantText = useCallback((content: string, id: string) => {
    // 🧹 Clean internal thinking tags, metrics payloads, and citation tags before copying to clipboard
    const cleanContent = content
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/\{\{\s*METRICS:[\s\S]*?\}\}/gi, '')
      .replace(/\[\[\s*METRICS:[\s\S]*?\]\]/gi, '')
      .replace(/\{\{(?:CITATION|VERSE):([\s\S]*?)\}\}/gi, (_, inner) => {
        const parts = inner.split('|');
        const query = parts[0].trim();
        const display = parts[1] ? parts[1].trim() : '';
        const title = formatBiblicalDisplayTitle(display) || formatBiblicalDisplayTitle(query) || query;
        return `📖 ${title}`;
      })
      .trim();

    navigator.clipboard.writeText(cleanContent);
    setCopiedId(id);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleCopyUserPrompt = useCallback((content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
  }, []);

  if (messages.length === 0 && !isAiStreaming) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto px-3 sm:px-5 overscroll-contain chat-scroll-anchor smooth-120hz-scroll"
      ref={containerRef}
      onScroll={handleScroll}
      onWheel={handleWheel}
      style={{ scrollBehavior: 'auto', overscrollBehavior: 'contain' }}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-6 pt-4 sm:pt-6 pb-6 sm:pb-8" style={{ overflowAnchor: 'none' }}>
        {messages.map((msg, idx) => {
          const isStreamingMsg = String(msg.id).startsWith('streaming-') || String(msg.id).startsWith('msg_stream_');
          const isLastAssistant = idx === messages.length - 1 && msg.role === 'assistant';
          // 🛡️ Key Stability: Use msg.id directly (or fallback) so key NEVER changes when isAiStreaming transitions to false.
          // Changing keys forces React to unmount and remount the DOM subtree, causing a 1-frame UI flash.
          const stableKey = msg.id || `msg-${msg.role}-${idx}`;

          return (

            <MessageItem
              key={stableKey}
              msg={msg}
              idx={idx}
              isUser={msg.role === 'user'}
              defaultMeta={defaultMeta}
              isCopied={copiedId === msg.id}
              onCopyUserPrompt={handleCopyUserPrompt}
              onCopyCleanAssistantText={handleCopyCleanAssistantText}
              onTTS={handleTTS}
              onRollback={onRollback}
              isStreaming={isAiStreaming && (isStreamingMsg || isLastAssistant)}
              currentStatusKey={currentStatusKey}
            />
          );
        })}
        <div ref={bottomRef} className="h-0 min-h-0" style={{ overflowAnchor: 'auto' }} />
      </div>
    </div>
  );
});
