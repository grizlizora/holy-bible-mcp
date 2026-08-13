import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

export function AiThinkingIndicator({ statusKey = 'processingRequest' }: { statusKey?: string }) {
  const tMsg = useTranslations('MessageList');

  // Normalize raw status strings that may arrive from MCP/AI SDK annotations.
  // Valid i18n keys never contain spaces or colons — if they do, map to a known key.
  function normalizeKey(raw: string): string {
    if (!raw) return 'processingRequest';
    // Already a clean key (no spaces, no colons)
    if (!/[\s:]/.test(raw)) return raw;
    // Map raw localized text → i18n key
    const lower = raw.toLowerCase();
    if (lower.includes('mcp') || lower.includes('підключення') || lower.includes('connecting')) {
      return 'status_mcp_connect';
    }
    if (lower.includes('ollama')) return 'status_ollama_connect';
    if (lower.includes('api')) return 'status_api_connect';
    if (lower.includes('vector') || lower.includes('вектор')) return 'status_vector_search';
    if (lower.includes('генеру') || lower.includes('generating') || lower.includes('формує')) return 'status_generating';
    return 'processingRequest';
  }

  const keyToUse = normalizeKey(statusKey || 'processingRequest');
  const cleanKey = keyToUse.replace(/^status_/, '');
  const candidateKeys = [keyToUse, `status_${cleanKey}`, cleanKey];

  let displayText = '';

  for (const k of candidateKeys) {
    try {
      const translated = tMsg(k as any);
      if (translated && !translated.startsWith('MessageList.')) {
        displayText = translated;
        break;
      }
    } catch {
      // Continue checking next candidate key
    }
  }

  if (!displayText) {
    try {
      displayText = tMsg('processingRequest');
    } catch {
      displayText = tMsg('status_generating');
    }
  }

  return (
    <div className="flex items-center gap-3.5 py-2 px-1 select-none">
      <div className="relative w-6 h-6 flex items-center justify-center">
        {/* 🧠 100% Guaranteed 120 FPS Framer Motion GPU Spinner */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-blue-500 dark:border-blue-400 border-t-transparent transform-gpu" 
        />
        
        {/* 🧠 Luminous core */}
        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
      </div>
      
      <div className="relative flex items-center h-6 overflow-hidden pr-2">
        <span className="whitespace-nowrap text-[13px] font-medium tracking-wide text-slate-700 dark:text-slate-200">
          {displayText}
        </span>
      </div>
    </div>
  );
}
