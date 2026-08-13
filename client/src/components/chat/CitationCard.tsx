"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { BookOpen, AlertCircle, Loader2, Copy, Check, Quote } from 'lucide-react';
import { GlassBox } from "@/components/ui/glass";

interface CitationCardProps {
  query: string;
  display: string;
  lang?: string;
  sourceType?: 'bible' | 'legal' | 'general';
  iconName?: string;
}

// Global in-memory caches for fetched citations and in-flight network requests
const citationCache = new Map<string, string>();
const pendingPromises = new Map<string, Promise<string | null>>();

export function CitationCard({ query, display, lang = 'ukr', sourceType = 'bible', iconName }: CitationCardProps) {
  const cacheKey = `${sourceType}_${query}_${lang}`;
  const [citationText, setCitationText] = useState<string | null>(() => citationCache.get(cacheKey) || null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !citationCache.has(cacheKey));
  const [error, setError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 🧹 Cache Sanitizer: Purge invalid Genesis 1:1 cached fallback entries for non-Genesis references
    const isGenesisQuery = /\b(?:GEN|БТ|БУТТЯ|БЫТИЕ|БЫТ|GENESIS|GN|GE)\b/i.test(query);
    const cachedText = citationCache.get(cacheKey);
    if (cachedText && !isGenesisQuery && /^(?:У початку сотворив|В начале сотворил|In the beginning God)/i.test(cachedText.trim())) {
      citationCache.delete(cacheKey);
    }

    if (citationCache.has(cacheKey)) {
      setCitationText(citationCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    async function fetchCitation() {
      try {
        setIsLoading(true);

        // 🛡️ Guard against invalid placeholders (e.g. BOOK CHAP:VERSE, OSIS_CODE, Ukrainian Title, langCode)
        const isPlaceholder = /^(?:BOOK|CHAP|VERSE|OSIS_CODE|Ukrainian Title|Title Chapter|langCode|LanguageCode|Translation Title|BookAbbreviation|LocalizedName)\b/i.test(query.trim()) ||
          /^(?:BOOK|CHAP|VERSE|OSIS_CODE|Ukrainian Title|Title Chapter)\b/i.test(display.trim()) ||
          /BOOK\s+CHAP|Title\s+Chapter|OSIS_CODE/i.test(query) ||
          !/\d+/.test(query);

        if (isPlaceholder) {
          if (mounted) {
            setError(false);
            setIsLoading(false);
          }
          return;
        }
        
        let fetchPromise = pendingPromises.get(cacheKey);
        if (!fetchPromise) {
          fetchPromise = (async () => {
            const res = await fetch(`/api/verse?ref=${encodeURIComponent(query)}&lang=${encodeURIComponent(lang)}`);
            if (!res.ok) throw new Error('Citation not found');
            const data = await res.json();
            return (data.text as string) || null;
          })();
          pendingPromises.set(cacheKey, fetchPromise);
        }

        const text = await fetchPromise;
        const isGenText = /^(?:У початку сотворив|В начале сотворил|In the beginning God)/i.test(text || '');
        if (mounted && text && (isGenesisQuery || !isGenText)) {
          citationCache.set(cacheKey, text);
          setCitationText(text);
          setError(false);
        } else if (mounted && text && !isGenesisQuery && isGenText) {
          // Do NOT cache Genesis fallback for non-Genesis queries
          setCitationText(text);
          setError(false);
        } else if (mounted && !text) {
          setError(true);
        }
      } catch (err) {
        if (mounted) setError(true);
      } finally {
        pendingPromises.delete(cacheKey);
        if (mounted) setIsLoading(false);
      }
    }

    fetchCitation();

    return () => {
      mounted = false;
    };
  }, [query, lang, cacheKey]);

  const handleCopyCitation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `${display}\n«${citationText || ''}»`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!citationText && !isLoading && !error) {
    return null;
  }

  return (
    <div className="my-3 border border-blue-200 dark:border-blue-900/40 bg-blue-50/95 dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
      {/* Header / Toggle */}
      <div 
        className="flex items-center justify-between px-4 py-2.5 bg-blue-100/70 dark:bg-slate-800/80 cursor-pointer hover:bg-blue-200/60 dark:hover:bg-slate-800 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {(() => {
            // 🛡️ Guard: only render dynamic icon if it's a valid callable React component
            const DynamicIcon = iconName && iconName in LucideIcons
              ? (LucideIcons as any)[iconName]
              : null;
            const isValidIcon = DynamicIcon &&
              (typeof DynamicIcon === 'function' ||
               (typeof DynamicIcon === 'object' && DynamicIcon !== null && '$$typeof' in DynamicIcon && typeof DynamicIcon.render === 'function'));
            if (isValidIcon) {
              return <DynamicIcon size={16} className="text-blue-600 dark:text-blue-400" />;
            }
            return sourceType === 'bible' ? (
              <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
            ) : (
              <Quote size={16} className="text-blue-600 dark:text-blue-400" />
            );
          })()}
          <span className="font-semibold text-sm text-blue-800 dark:text-blue-300 truncate max-w-[200px] sm:max-w-[400px]">
            {display && display !== '...' && display !== '…' ? display : query}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 size={14} className="animate-spin text-blue-500" />}
          
          <button
            onClick={handleCopyCitation}
            title="Скопіювати текст"
            className="p-1 rounded-lg hover:bg-blue-200/60 dark:hover:bg-blue-800/60 text-blue-600 dark:text-blue-300 transition-colors"
          >
            {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>

          <span className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">
            {isOpen ? 'Приховати' : 'Показати'}
          </span>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 border-t border-blue-100 dark:border-blue-900/30">
              {isLoading ? (
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-blue-100 dark:bg-blue-900/50 rounded w-3/4"></div>
                    <div className="h-3 bg-blue-100 dark:bg-blue-900/50 rounded w-full"></div>
                    <div className="h-3 bg-blue-100 dark:bg-blue-900/50 rounded w-5/6"></div>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-between text-rose-500 dark:text-rose-400 text-xs sm:text-sm">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex gap-2 rounded-lg">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>Не вдалося завантажити текст цитати.</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      citationCache.delete(cacheKey);
                      setError(false);
                      setIsLoading(true);
                      // fetchCitation
                      fetch(`/api/verse?ref=${encodeURIComponent(query)}&lang=${encodeURIComponent(lang)}`)
                        .then(r => {
                          if (!r.ok) throw new Error('Citation not found');
                          return r.json();
                        })
                        .then(data => {
                          citationCache.set(cacheKey, data.text);
                          setCitationText(data.text);
                          setError(false);
                        })
                        .catch(() => setError(true))
                        .finally(() => setIsLoading(false));
                    }}
                    className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/60 font-semibold transition-colors shrink-0"
                  >
                    Повторити
                  </button>
                </div>
              ) : (
                <span className="italic">«{citationText}»</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
