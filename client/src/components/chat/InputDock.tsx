"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, Mic, ArrowUp, Square, Loader2, Cpu, Cloud, Shield, ChevronDown, X, Check } from 'lucide-react';
import { useSettingsStore, ChannelType, LocalProvider, ApiProvider } from '@/stores/useSettingsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { getOllamaModels } from '@/lib/actions/chat.actions';
import { GlassBox, GlassButton, getGlassClasses } from "@/components/ui/glass";
import { cn } from "@/lib/utils";
import { useContentBlur } from "@/lib/useContentBlur";

import { useFileUpload } from '@/hooks/useFileUpload';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { formatDuration } from '@/lib/media';
import { AttachmentDock } from './AttachmentDock';

import { useTranslations } from 'next-intl';

const CLOUD_MODELS_BY_PROVIDER: Record<ApiProvider, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'o3-mini'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
  google: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
  openrouter: [
    'deepseek/deepseek-r1',
    'qwen/qwen-2.5-72b-instruct',
    'google/gemma-2-27b-it',
    'meta-llama/llama-3.3-70b-instruct'
  ]
};

interface InputDockProps {
  onSendMessage: (content: string, attachments?: any[]) => void;
  isStreaming?: boolean;
  onStop?: () => void;
  initialText?: string;
}

function InputDockComponent({ onSendMessage, isStreaming, onStop, initialText }: InputDockProps) {
  const tInput = useTranslations('InputDock');
  const tChat = useTranslations('Chat');
  const [text, setText] = useState('');
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [localModels, setLocalModels] = useState<string[]>(['qwen3.5:14b', 'qwen2.5:14b', 'gemma4:9b', 'deepseek-r1:14b', 'llama3.3:70b']);

  // Apple-style content blur: blur page content when source modal is open
  useContentBlur(isSourceModalOpen);
  
  useEffect(() => {
    getOllamaModels().then(setLocalModels).catch(console.error);
  }, []);

  useEffect(() => {
    if (typeof initialText === 'string') {
      setText(initialText);
      if (initialText.trim()) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 50);
      }
    }
  }, [initialText]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isRecording, recordingDuration, permissionError, startRecording, stopRecording, cancelRecording, clearPermissionError } = useAudioRecorder();

  const channelType = useSettingsStore(s => s.channelType);
  const setChannelType = useSettingsStore(s => s.setChannelType);
  const localProvider = useSettingsStore(s => s.localProvider);
  const setLocalProvider = useSettingsStore(s => s.setLocalProvider);
  const apiProvider = useSettingsStore(s => s.apiProvider);
  const setApiProvider = useSettingsStore(s => s.setApiProvider);
  const selectedModel = useSettingsStore(s => s.selectedModel);
  const setSelectedModel = useSettingsStore(s => s.setSelectedModel);

  const [tempChannelType, setTempChannelType] = useState<ChannelType>(channelType);
  const [tempLocalProvider, setTempLocalProvider] = useState<LocalProvider>(localProvider);
  const [tempApiProvider, setTempApiProvider] = useState<ApiProvider>(apiProvider);
  const [tempSelectedModel, setTempSelectedModel] = useState<string>(selectedModel);

  const openSourceModal = () => {
    setTempChannelType(channelType);
    setTempLocalProvider(localProvider);
    setTempApiProvider(apiProvider);
    setTempSelectedModel(selectedModel);
    setIsSourceModalOpen(true);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  // File Upload Logic
  const { attachments, uploads, handleFiles, removeAttachment, clearAttachments, cancelUpload } = useFileUpload();
  const isUploadingFiles = uploads.size > 0;

  const handleSend = () => {
    if (isUploadingFiles) return;
    // Can send if there's text OR if there are attachments
    if (text.trim() || attachments.length > 0) {
      onSendMessage(text.trim(), attachments);
      setText('');
      clearAttachments();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      handleFiles(e.clipboardData.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      const file = await stopRecording();
      if (file) {
        setIsSendingVoice(true);
        try {
          // Await the upload using the new Promise-returning handleFiles
          const uploadedAttachments = await handleFiles([file], true);
          if (uploadedAttachments && uploadedAttachments.length > 0) {
            // Automatically send the message once upload is complete
            onSendMessage(text.trim(), [...attachments, ...uploadedAttachments]);
            setText('');
            clearAttachments();
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
            }
          }
        } catch (e) {
          console.error('Failed to send voice message:', e);
        } finally {
          setIsSendingVoice(false);
        }
      }
    } else {
      await startRecording();
    }
  };

  const getSourceBadge = () => {
    if (channelType === 'local') return `💻 ${localProvider.toUpperCase()} (${selectedModel})`;
    if (channelType === 'api') return `☁️ ${apiProvider.toUpperCase()} (${selectedModel})`;
    return '🛡️ P2P Mesh';
  };

  return (
    <>
      <div className="p-3 sm:p-5 pb-5 sm:pb-8 pointer-events-none w-full bg-transparent">
        <GlassBox 
          variant="medium" 
          intensity="xl" 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "pointer-events-auto w-full max-w-4xl mx-auto relative shadow-2xl shadow-slate-950/20 rounded-3xl sm:rounded-[32px] p-3.5 sm:p-5 flex flex-col gap-2.5 sm:gap-3 transition-[box-shadow,background-color] duration-300",
            isRecording && "ring-2 ring-red-500/50 bg-red-50/90 dark:bg-red-900/40",
            isDragging && "ring-4 ring-blue-500/50 bg-blue-50/90 dark:bg-blue-900/40"
          )}
        >
          {isDragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[inherit] bg-blue-500/10 backdrop-blur-sm pointer-events-none">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-lg sm:text-xl px-6 py-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-xl flex items-center gap-2">
                <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" /> Відпустіть файли тут
              </span>
            </div>
          )}
          
          {/* Top Bar inside Input Dock: Model Selector Button */}
          <div className="flex items-center justify-between px-2 sm:px-2.5 pt-1">
            <GlassButton 
              variant="medium"
              onClick={openSourceModal}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-[12px] sm:text-[14px] font-extrabold truncate max-w-[85%]"
            >
              <Cpu className="flex-shrink-0 text-blue-500 w-[15px] h-[15px] sm:w-[16px] sm:h-[16px]" />
              <span className="truncate tracking-tight">{getSourceBadge()}</span>
              <ChevronDown className="flex-shrink-0 opacity-50 w-[14px] h-[14px] sm:w-[15px] sm:h-[15px]" />
            </GlassButton>

            <span className="text-[11px] sm:text-[12px] font-extrabold tracking-widest text-slate-400 dark:text-slate-500 uppercase opacity-70">Liquid AI</span>
          </div>

          {/* Microphone Permission Warning Banner */}
          {permissionError && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              <span>⚠️ {permissionError}</span>
              <button 
                onClick={clearPermissionError}
                className="p-1 hover:bg-amber-500/20 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <AttachmentDock 
            attachments={attachments}
            uploads={uploads}
            onRemoveAttachment={removeAttachment}
            onCancelUpload={cancelUpload}
          />

          {/* Text Area & Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-1 sm:px-1.5 py-0.5">
            {/* Attach File Button */}
            <input 
              type="file" 
              ref={fileInputRef} 
              multiple
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }} 
              className="hidden" 
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 sm:p-3 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 transition-colors flex-shrink-0"
            >
              <Paperclip className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Auto-resizing Textarea */}
            {isRecording ? (
              <div className="flex-1 max-h-[140px] min-w-0 bg-transparent flex items-center py-2 px-2 gap-2 text-slate-800 dark:text-slate-100 text-[15px] sm:text-[16px] leading-relaxed font-medium">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="text-red-500 font-bold tracking-widest shrink-0">{formatDuration(recordingDuration)}</span>
                <span className="text-slate-400 truncate">{tInput('listening')}</span>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={tInput('placeholder')}
                className="flex-1 max-h-[140px] min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none py-2 px-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400/80 scrollbar-hide text-[15px] sm:text-[16px] leading-relaxed font-medium"
                rows={1}
              />
            )}

            {/* Action Buttons (Stop, Mic or Send) */}
            {isStreaming ? (
              <motion.button 
                onClick={onStop}
                title={tChat('stop_generation')}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="p-2.5 sm:p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors flex-shrink-0 shadow-md shadow-red-500/20 active:scale-95 flex items-center justify-center cursor-pointer transform-gpu"
              >
                <Square fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            ) : (text.trim().length === 0 && attachments.length === 0) && !isRecording ? (
              <button 
                onClick={toggleRecording}
                className="p-2.5 sm:p-3 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 transition-colors flex-shrink-0"
              >
                <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            ) : isRecording ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-full border border-slate-300/50 dark:border-slate-700/50 backdrop-blur-sm shrink-0">
                <button 
                  onClick={cancelRecording}
                  disabled={isSendingVoice}
                  title={tChat('cancel_recording')}
                  className={cn(
                    "p-2 sm:p-2.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0",
                    isSendingVoice && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button 
                  onClick={toggleRecording}
                  disabled={isSendingVoice}
                  title={tChat('send_voice')}
                  className={cn(
                    "p-2 sm:p-2.5 rounded-full transition-all flex-shrink-0 flex items-center justify-center min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px]",
                    isSendingVoice 
                      ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  )}
                >
                  {isSendingVoice ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSend}
                disabled={isUploadingFiles}
                className={cn(
                  "p-2.5 sm:p-3 rounded-full text-white transition-all flex-shrink-0 shadow-lg flex items-center justify-center",
                  isUploadingFiles 
                    ? "bg-slate-400 dark:bg-slate-600 cursor-not-allowed shadow-none" 
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30 active:scale-90"
                )}
              >
                {isUploadingFiles ? (
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                ) : (
                  <ArrowUp strokeWidth={3} className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
            )}
          </div>

        </GlassBox>
      </div>

      {/* Source Selection Bottom Sheet Modal (Liquid Glass) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isSourceModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 liquid-backdrop"
                onClick={() => setIsSourceModalOpen(false)}
              />
              <motion.div 
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                style={{ willChange: 'transform', transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}
                className={cn(
                  getGlassClasses("modal", "lg"),
                  "relative w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto no-scrollbar overscroll-none mx-auto border-t sm:border-t-0"
                )}
              >
              <div className="flex items-center justify-between border-b border-white/20 dark:border-slate-700/50 pb-5 mb-1 gap-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-500 shadow-inner flex-shrink-0">
                  <Cpu size={22} />
                </div>
                <span className="flex-1 text-center text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100 px-1 truncate">
                  {tInput('channelSource')}
                </span>
                <GlassButton 
                  onClick={() => setIsSourceModalOpen(false)}
                  className="w-10 h-10 rounded-2xl"
                >
                  <X size={22} />
                </GlassButton>
              </div>

              {/* Mode Tabs */}
              <div className="flex bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl gap-1 border border-slate-200/80 dark:border-slate-700/60">
                <button 
                  onClick={() => setTempChannelType('local')}
                  className={`flex-1 min-w-0 truncate py-2.5 text-[13px] font-bold rounded-xl transition-all ${tempChannelType === 'local' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                >
                  {tInput('localModel')}
                </button>
                <button 
                  onClick={() => setTempChannelType('api')}
                  className={`flex-1 min-w-0 truncate py-2.5 text-[13px] font-bold rounded-xl transition-all ${tempChannelType === 'api' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                >
                  {tInput('cloudApi')}
                </button>
                <button 
                  onClick={() => setTempChannelType('p2p')}
                  className={`flex-1 min-w-0 truncate py-2.5 text-[13px] font-bold rounded-xl transition-all ${tempChannelType === 'p2p' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                >
                  🛡️ P2P
                </button>
              </div>

              {/* Sub-options based on ChannelType */}
              {tempChannelType === 'local' && (
                <div className="flex flex-col gap-5 pt-1">
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">{tInput('localApp')}</span>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(['ollama', 'lmstudio', 'vllm'] as LocalProvider[]).map(lp => (
                        <button 
                          key={lp} 
                          onClick={() => setTempLocalProvider(lp)}
                          className={`w-full py-3 px-3 text-[13px] rounded-2xl border font-bold uppercase transition-all flex items-center justify-between min-w-0 backdrop-blur-md ${tempLocalProvider === lp ? 'border-blue-500 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02] ring-1 ring-blue-500/50' : 'border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'}`}
                        >
                          <span className="truncate">{lp}</span>
                          {tempLocalProvider === lp ? (
                            <Check size={16} className="flex-shrink-0 ml-1 text-white" />
                          ) : (
                            <div className="w-4 h-4 ml-1"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-1">
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">{tInput('chooseModel')}</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {localModels.map(m => (
                        <button 
                          key={m} 
                          title={m}
                          onClick={() => setTempSelectedModel(m)}
                          className={`w-full py-3 px-3 text-[12px] sm:text-[13px] rounded-2xl border font-bold transition-all flex items-center justify-between min-w-0 backdrop-blur-md ${tempSelectedModel === m ? 'border-blue-500 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02] ring-1 ring-blue-500/50' : 'border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'}`}
                        >
                          <span className="truncate flex-1 text-left">{m}</span>
                          {tempSelectedModel === m ? (
                            <Check size={16} className="flex-shrink-0 ml-1 text-white" />
                          ) : (
                            <div className="w-4 h-4 ml-1"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tempChannelType === 'api' && (
                <div className="flex flex-col gap-5 pt-1">
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">{tInput('apiProvider')}</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(['openai', 'anthropic', 'google', 'openrouter'] as ApiProvider[]).map(ap => (
                        <button 
                          key={ap} 
                          onClick={() => {
                            setTempApiProvider(ap);
                            const available = CLOUD_MODELS_BY_PROVIDER[ap];
                            if (available && available.length > 0) {
                              setTempSelectedModel(available[0]);
                            }
                          }}
                          className={`w-full py-3 px-3 text-[13px] rounded-2xl border font-bold capitalize transition-all flex items-center justify-between min-w-0 backdrop-blur-md ${tempApiProvider === ap ? 'border-blue-500 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02] ring-1 ring-blue-500/50' : 'border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'}`}
                        >
                          <span className="truncate">{ap}</span>
                          {tempApiProvider === ap ? (
                            <Check size={16} className="flex-shrink-0 ml-1 text-white" />
                          ) : (
                            <div className="w-4 h-4 ml-1"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-1">
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">{tInput('chooseModel')}</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(CLOUD_MODELS_BY_PROVIDER[tempApiProvider] || CLOUD_MODELS_BY_PROVIDER.openai).map(m => (
                        <button 
                          key={m} 
                          onClick={() => setTempSelectedModel(m)}
                          className={`w-full py-3.5 px-3.5 text-[13px] rounded-2xl border font-bold transition-all flex items-center justify-between min-w-0 backdrop-blur-md ${tempSelectedModel === m ? 'border-blue-500 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02] ring-1 ring-blue-500/50' : 'border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'}`}
                        >
                          <span className="truncate">{m}</span>
                          {tempSelectedModel === m ? (
                            <Check size={16} className="flex-shrink-0 ml-1 text-white" />
                          ) : (
                            <div className="w-4 h-4 ml-1"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tempChannelType === 'p2p' && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-center flex flex-col gap-1.5 my-1 backdrop-blur-md">
                  <span className="text-[13px] font-bold text-purple-700 dark:text-purple-300">🛡️ P2P AES-256 WebRTC Stream</span>
                  <span className="text-[12px] text-purple-600 dark:text-purple-400 font-medium leading-relaxed">{tInput('encryptedStream')}</span>
                </div>
              )}

              <button 
                onClick={() => {
                  setChannelType(tempChannelType);
                  setLocalProvider(tempLocalProvider);
                  setApiProvider(tempApiProvider);
                  setSelectedModel(tempSelectedModel);
                  setIsSourceModalOpen(false);
                }}
                className="w-full mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-bold text-[15px] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
              >
                {tInput('confirm')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </>
  );
}

export const InputDock = React.memo(InputDockComponent);
