"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { GlassBox } from "@/components/ui/glass";
import { CitationCard } from './CitationCard';
import { MetricsCard } from './MetricsCard';
import { Copy, Check, Brain, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { formatBiblicalDisplayTitle, toCanonicalReferenceKey } from '@/lib/bible/osis-map';
export { formatBiblicalDisplayTitle, toCanonicalReferenceKey };

interface RichTextRendererProps {
  content: string;
  isStreaming?: boolean;
}

type Segment =
  | { type: 'text'; content: string }
  | { type: 'verse'; query: string; display: string; lang: string; iconName?: string }
  | { type: 'metrics'; data: any[] }
  | { type: 'think'; content: string; isThinking: boolean };

function ThinkingContentRenderer({ content }: { content: string }) {
  const cleanContent = (content || '')
    .replace(/\[\[METRICS:[\s\S]*?\]\]/gi, '')
    .replace(/\{\{METRICS:[\s\S]*?\}\}/gi, '')
    .replace(/<\/?(?:think|thought|reasoning)>/gi, '')
    .replace(/\{\{\s*(?:CITATION|VERSE):\s*([^|}]+)(?:\|([^|}]+))?[^}]*\}\}/gi, (_, q, d) => (d || q || '').trim())
    .trim();
  return <div className="whitespace-pre-wrap font-sans text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{cleanContent}</div>;
}

function ThinkingWidget({ content, isThinking, isStreaming = false, hasSparseBody = false }: { content: string; isThinking: boolean; isStreaming?: boolean; hasSparseBody?: boolean }) {
  let thinkingTitle = 'Думки моделі';
  let thinkingInProgressTitle = 'Думки моделі (думає...)';
  let thinkingStatusFallback = 'Обмірковування відповіді...';
  
  try {
    const tMsg = useTranslations('MessageList');
    if (tMsg) {
      thinkingTitle = tMsg('modelThinking');
      thinkingInProgressTitle = tMsg('modelThinkingInProgress');
      thinkingStatusFallback = tMsg('thinkingStatusFallback');
    }
  } catch (e) {}

  // 🧠 Open while thinking, auto-collapse when thinking completes and main response body starts!
  const [isOpen, setIsOpen] = useState(() => isThinking || hasSparseBody);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    if (userInteractedRef.current) return;

    if (isThinking) {
      setIsOpen(true);
    } else if (!isStreaming && !hasSparseBody) {
      // Auto-collapse ONLY when streaming is completely finished
      setIsOpen(false);
    }
  }, [isThinking, isStreaming, hasSparseBody]);

  const handleToggle = () => {
    userInteractedRef.current = true;
    setIsOpen(!isOpen);
  };

  return (
    <div className="my-3 rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/90 dark:bg-slate-950 overflow-hidden text-xs shadow-sm">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-purple-100/80 dark:bg-purple-950/60 hover:bg-purple-200/80 dark:hover:bg-purple-900/50 text-purple-950 dark:text-purple-200 font-bold cursor-pointer select-none transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isThinking ? (
            <Brain className="w-4 h-4 text-purple-500 animate-pulse shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          )}
          <span className="truncate">{isThinking ? thinkingInProgressTitle : thinkingTitle}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isThinking && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Zero-Reflow CSS Grid Expansion (No JS offsetHeight polling during token streaming) */}
      <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="p-4 font-mono text-[12px] leading-relaxed text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900/90 border-t border-purple-200 dark:border-purple-900/40 whitespace-pre-wrap break-words">
            {content.trim() ? (
              <ThinkingContentRenderer content={content.trim()} />
            ) : isThinking ? (
              thinkingStatusFallback
            ) : (
              ''
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function parseSegments(content: string, isStreaming?: boolean): Segment[] {
  let normalizedContent = content;
  if (isStreaming) {
    normalizedContent = normalizedContent
      .replace(/<(?:think|thin|thi|th|t)$/i, '<think>')
      .replace(/<(?:thought|thoug|thou|tho)$/i, '<thought>')
      .replace(/<(?:reasoning|reasonin|reasoni|reason|reaso|reas|rea|re|r)$/i, '<reasoning>');
  }

  normalizedContent = normalizedContent
    .replace(/(?:\(?as\s+per\s+my\s+instructions[\s\S]*?)(?=\n\n|\n[А-ЯІЇЄҐA-Z]|$)/gi, '')
    .replace(/(?:Actually\s+looking\s+at\s+the\s+system\s+instructions[\s\S]*?)(?=\n\n|\n[А-ЯІЇЄҐA-Z]|$)/gi, '')
    .replace(/(?:This\s+is\s+a\s+bit\s+confusing\s+because[\s\S]*?)(?=\n\n|\n[А-ЯІЇЄҐA-Z]|$)/gi, '')
    .replace(/(?:and\s+["']Immediately\s+after[\s\S]*?)(?=\n\n|\n[А-ЯІЇЄҐA-Z]|$)/gi, '')
    .replace(/(?:Wait,\s+looking\s+at\s+the\s+specific\s+instruction[\s\S]*?)(?=\n\n|\n[А-ЯІЇЄҐA-Z]|$)/gi, '')
    .replace(/<\/think>\s*(?:tags\s*\.|\w+\s+first|output\s+when\s+ready|i\s+will\s+now\s+generate[\s\S]*?as\s+specified\s*\.|i\s+will\s+generate[\s\S]*?\.|tags\s*\.\s*i\s+will[\s\S]*?\.)/gi, '</think>\n\n')
    .replace(/<\/think>\s*(?:[a-z0-9\s.,'\"]{5,120}\s+as\s+specified\s*\.)/gi, '</think>\n\n')
    .replace(/<\/?(?:end|endoftext|end_of_turn|endofsentence|im_end)(?:\/|>|\s*>)/gi, '')
    .replace(/<\|(?:im_end|endoftext|end_of_text|eot_id)\|>/gi, '')
    // 🧹 Strip prompt template leaks (e.g. "• **Заголовок**:", "Опис українською мовою...")
    .replace(/(?:^|\n)\s*(?:[•\-*]|\d+\.)?\s*\*\*Заголовок\*\*:\s*[\p{L}\s']*\n?\s*Опис\s+українською\s+мовою\s*\.*\s*/giu, '')
    .replace(/Опис\s+українською\s+мовою\s*\.*\s*/gi, '')
    // 🧹 Strip prompt question echoing at line 1 (e.g. "Що таке любов?\n\n", "What is love?\n\n")
    .replace(/^(?:\s*[\p{L}\s'–—\-]{3,80}\?\s*\n+)/giu, '');




  // 1. Normalize unicode bullets '•' to standard markdown list marker '- ' for CommonMark compliance
  normalizedContent = normalizedContent.replace(/(^|\n)\s*•\s*/g, '$1- ');

  // 2. 🧹 Master Asterisk & Bold Normalizer (Solves inline and start-of-line LLM edge cases):
  normalizedContent = normalizedContent
    // Case A-pre: Fix broken LLM double-asterisk number/bullet prefix: "** 2. **Title" or "**2. **Title" or "** 2. Title" -> "2. **Title"
    .replace(/(^|\n|\s)\*\*\s*(\d+\.|\-|•|\*)\s*\*\*\s*/g, '$1$2 **')
    .replace(/(^|\n|\s)\*\*\s*(\d+\.|\-|•|\*)\s*/g, '$1$2 ')
    // Case A0: Handle inline preamble headers like "Діяльність: **1. **Практикуйте" → "Діяльність:\n1. **Практикуйте"
    .replace(/([^\n#—–]+?:\s*)\*\*\s*(\d+\.|\-|•|\*)\s*\*\*/g, '$1\n$2')
    // Case A1: Strip stray double asterisks around numbers/bullets: "**1. **Text" → "1. **Text"
    .replace(/\*\*\s*(\d+\.|\-|•|\*)\s*\*\*/g, '$1')
    .replace(/(^|\n)(\s*(?:\d+\.|\-|•|\*)\s*)\*\*\s*(\d+\.|\-|•|\*)\s*/g, '$1$2')

    // Case A2: Fix heading with bold: "### 1. **Header" -> "### 1. Header"
    .replace(/(^|\n)(#{1,6}\s*(?:\d+\.)?\s*)\*\*([^\n*]+?)(?:\*\*|$)/gm, '$1$2$3')

    // Case B: Fix spaces inside double asterisks: "**Title **" → "**Title** " or "** Title**" → " **Title**"
    .replace(/\*\*([^*\n]+?)\s+\*\*/g, '**$1** ')
    .replace(/\*\*\s+([^*\n]+?)\*\*/g, ' **$1**')

    // Case C: Delete trailing stray ** attached to a single word without leading **: "слово** наступне" → "слово наступне"
    .replace(/(\p{L}+)\*\*\s+(?![^*\n]*\*\*)/gu, '$1 ')
    .replace(/(\n\s*)\*\*\s*$/gm, '$1')

    // Case D: Fix opening ** before quotes without closing **: "**\"quote\"" → "\"quote\""
    .replace(/\*\*\s*(["'«“].*?["'»”])/g, '$1')

    // Case E: Universal List Title Asterisk Sanitizer: extract EVERYTHING up to em-dash "—" or "–"
    .replace(
      /(^|\n)(\s*(?:[\-*•]|\d+\.)?\s*)\*\*([^\n—–]+?)\s*(—|–)/gm,
      (match, lineStart, bullet, rawTitle, dash) => {
        const cleanTitleText = rawTitle.replace(/\*/g, '').trim();
        if (!cleanTitleText) return match;
        const cleanBullet = (bullet || '- ').replace(/[•*]/g, '-');
        return `${lineStart}${cleanBullet}**${cleanTitleText}** ${dash}`;
      }
    )

    // Case F: Fix unclosed ** on bullet / numbered list headers up to colon: "2. **Любов не має меж: **Вона..." → "2. **Любов не має меж:** Вона..."
    .replace(/(^|\n)(\s*(?:\d+\.|\-|•|\*)\s*)\*\*([^*\n:]+?):\s*\*\*/gm, (m, p1, p2, p3) => `${p1}${p2}**${p3.trim()}:** `)
    .replace(/(^|\n)(\s*(?:\d+\.|\-|•|\*)\s*)\*\*([^*\n:]+?):\s*(?!\*\*)/gm, (m, p1, p2, p3) => `${p1}${p2}**${p3.trim()}:** `)

    // Case G: Remove orphaned double asterisks surrounded by spaces or newlines: " ** " → " "
    .replace(/(^|[\s\n])\*\*\s*($|[\s\n])/g, '$1$2')
    // Case G1: Strip stray double asterisks right after dashes/hyphens: "- **" -> "- ", "— **" -> "— "
    .replace(/([—–-]\s*)\*\*\s*/g, '$1')
    // Case G2: Strip stray double asterisks right before dashes/hyphens: "** -" -> " -", "** —" -> " —"
    .replace(/\s*\*\*\s*([—–-])/g, ' $1')
    // Case H: Real-time streaming multiline auto-close for unclosed ** at line ends (numbered/bullet lists)
    .replace(/(^|\n)(\s*(?:[\-*]|\d+\.)\s*)\*\*([^\n*]+)$/gm, '$1$2**$3**')
    .replace(/(^|\n)(\s*(?:[\-*]|\d+\.)\s*)\*\*([^\n*]+?)\s*$/gm, '$1$2**$3**')
    // Case I: Lone stray ** on its own line
    .replace(/(^|\n)\s*\*\*\s*($|\n)/g, '$1$2');









  // 🧠 Detect untagged implicit reasoning ONLY for explicit planning-style headers at the very start
  // IMPORTANT: Scope is intentionally narrow — we only auto-wrap content that starts with a clear
  // structured planning list (e.g. "1. Deconstruct Mechanics:"). We do NOT wrap regular English responses.
  if (!/<(?:think|thought|reasoning)>/i.test(normalizedContent)) {
    const planningListRx = new RegExp('^\\s*(?:(?:\\d+\\.\\s*(?:\\*\\*|\\*)?(?:Deconstruct|Map\\s+Biblical|Systemic\\s+Synthesis|Drafting\\s+the\\s+Content|Refining\\s+Citations|Декомпозиція|Визначення|Мапа|Синтез)[^\\n]*\\n?){2,})(?=\\n+[\\p{L}\\p{N}]|\\n+\\{\\{CITATION:|$)', 'iu');
    const listMatch = planningListRx.exec(normalizedContent);
    if (listMatch && listMatch[0].trim().length > 30) {
      const reasoningText = listMatch[0].trim();
      normalizedContent = `<think>\n${reasoningText}\n</think>\n\n` + normalizedContent.slice(listMatch[0].length).trimStart();
    }
    // Note: implicitReasoningRx removed — it incorrectly absorbed valid response text
    // that contained common English phrases like "Let me think", "Step 1:", etc.
  }

  const segments: Segment[] = [];
  
  // 🧠 Robust Think Block Extractor: Handles nested </think> in prompt echoes or code backticks
  const openThinkIndex = normalizedContent.search(/<(?:think|thought|reasoning)>/i);
  if (openThinkIndex !== -1) {
    const openTagMatch = normalizedContent.match(/<(think|thought|reasoning)>/i);
    const tagName = openTagMatch ? openTagMatch[1] : 'think';
    const afterOpen = normalizedContent.slice(openThinkIndex + openTagMatch![0].length);
    
    // Find the LAST closing tag </think>, or the start of the main response body
    const lastCloseIndex = afterOpen.lastIndexOf(`</${tagName}>`);
    let thinkText = '';
    let mainBodyText = '';
    let isThinking = false;

    if (lastCloseIndex !== -1) {
      thinkText = afterOpen.slice(0, lastCloseIndex).replace(/<\/(?:think|thought|reasoning)>/gi, '');
      mainBodyText = afterOpen.slice(lastCloseIndex + `</${tagName}>`.length);
    } else {
      // While streaming or before </think> arrives, keep all content inside thinking segment
      thinkText = afterOpen.replace(/<\/(?:think|thought|reasoning)>/gi, '');
      isThinking = Boolean(isStreaming);
    }

    // 🛡️ Auto-Recovery Guard for Small Models:
    // If small model outputted its response draft inside <think> (e.g. "*Revised Draft:*\nЛюбов...") and mainBodyText is empty,
    // extract the actual response out of thinkText so the user message bubble is never empty!
    if (!mainBodyText.trim() && thinkText && !isThinking) {
      const draftMatch = thinkText.match(/(?:\*(?:Revised\s+Draft|Draft|Final\s+Answer|Відповідь)\*|\bDraft:|\bFinal\s+Answer:)\s*([\s\S]+)$/i);
      if (draftMatch && draftMatch[1].trim()) {
        mainBodyText = draftMatch[1].trim();
        thinkText = thinkText.slice(0, draftMatch.index).trim();
      }
    }

    if (openThinkIndex > 0) {
      parseInnerSegments(normalizedContent.slice(0, openThinkIndex), segments, isStreaming);
    }

    if (thinkText.trim() || isThinking) {
      segments.push({ type: 'think', content: thinkText.trim(), isThinking: Boolean(isThinking) });
    }


    if (mainBodyText.trim()) {
      parseInnerSegments(mainBodyText.trim(), segments, isStreaming);
    }
  } else {
    parseInnerSegments(normalizedContent, segments, isStreaming);
  }

  return segments;
}

function parseInnerSegments(content: string, segments: Segment[], isStreaming?: boolean): void {
  const metricsPlaceholders: { placeholder: string; data: any[] }[] = []

  // ── Pass 1: extract [[METRICS:...]] with safe square-bracket delimiters ──────
  const newMetricsRx = /\[\[METRICS:([\s\S]*?)\]\]/g
  let processed = content.replace(newMetricsRx, (_, payload) => {
    const ph = `\x00M${metricsPlaceholders.length}\x00`
    try {
      const raw = JSON.parse(payload.trim())
      const data = (Array.isArray(raw) ? raw : [raw]).map((m: any) => ({ ...m, value: m.value ?? m.val }))
      metricsPlaceholders.push({ placeholder: ph, data })
    } catch {
      metricsPlaceholders.push({ placeholder: ph, data: [] })
    }
    return ph
  })

  // ── Pass 2: extract legacy {{METRICS:...}} ────────
  const legacyRx = /\{\{METRICS:([\s\S]*?)\}\}/g;
  processed = processed.replace(legacyRx, (_, payload) => {
    const ph = `\x00M${metricsPlaceholders.length}\x00`
    try {
      const raw = JSON.parse(payload.trim())
      const data = (Array.isArray(raw) ? raw : [raw]).map((m: any) => ({ ...m, value: m.value ?? m.val }))
      metricsPlaceholders.push({ placeholder: ph, data })
    } catch {
      const parts = payload.trim().split('|')
      if (parts.length >= 3) {
        let accVal = parts[2].trim();
        if (!accVal.endsWith('%')) accVal += '%';
        metricsPlaceholders.push({ placeholder: ph, data: [
          { id: 'complexityScore', type: 'score', max: 100, value: parseInt(parts[0], 10) || 0, label: { uk: 'Складність' } },
          { id: 'modeLabel',       type: 'badge',      value: parts[1].trim(), label: { uk: 'Режим' } },
          { id: 'accuracyScore',   type: 'percentage', value: accVal, label: { uk: 'Точність' } },
        ]})
      } else {
        metricsPlaceholders.push({ placeholder: ph, data: [] })
      }
    }
    return ph
  });

  // ── Pass 3: Table Protection: hoist citation tags out of markdown table blocks so tables never break ──
  processed = processed.replace(/^(\|.*\|\r?\n?)+/gm, (tableBlock) => {
    let hoistedTags: string[] = [];
    const cleanBlock = tableBlock.replace(/\{\{(?:CITATION|VERSE):([\s\S]*?)\}\}/gi, (fullTag, inner) => {
      hoistedTags.push(fullTag);
      const parts = inner.split('|');
      const q = parts[0].trim();
      const d = parts[1] ? parts[1].trim() : '';
      return formatBiblicalDisplayTitle(d && d !== '...' && d !== '…' ? d : q) || q;
    });
    const uniqueTags = Array.from(new Set(hoistedTags));
    return cleanBlock.trimEnd() + (uniqueTags.length > 0 ? '\n\n' + uniqueTags.join(' ') + '\n\n' : '\n\n');
  });

  // 🧹 Global Citation Deduplicator: Suppress repeated citation cards across the entire message
  const seenCitationKeys = new Set<string>();

  // ── Helper: parse {{CITATION:...}} and {{VERSE:...}} tags inside a plain text chunk ──
  const verseRx = /\{\{([\s\S]*?)\}\}/g
  function parseVerses(rawChunkInput: string, isStreaming?: boolean): void {
    // 🧹 Clean blockquote prefixes ("> ", ">") attached to citation tags so they don't render stray blockquote lines
    let sanitizedInput = rawChunkInput
      .replace(/(?:^|\n)\s*>\s*(\{\{CITATION:[\s\S]*?\}\})/gi, '\n$1')
      .replace(/\{\{\s*(?:CITATION|VERSE)\s*\|\s*([^|}]+)(?:\|([^|}]+))?(?:\|([^|}]+))?(?:\|([^|}]+))?\s*\}\}/gi, '{{CITATION: $1|$2|$3|$4}}');

    // 🧹 Clean stray single asterisks interrupting list items (e.g. "1. *Агапе" -> "1. Агапе", NEVER touch "1. **Агапе**")
    const rawChunk = sanitizedInput
      .replace(/^(\s*\d+\.\s*)\*(?!\*)\s*/gm, '$1')
      .replace(/^(\s*[-*•]\s*)\*(?!\*)\s*/gm, '$1');

    // 🧠 Protected Tag Auto-Interceptor: Protect existing {{CITATION:...}} tags before converting plain text references
    const existingTags: string[] = [];
    let chunk = rawChunk.replace(/\{\{[\s\S]*?\}\}/g, (match) => {
      existingTags.push(match);
      return `___PROT_TAG_${existingTags.length - 1}___`;
    });

    // 🧠 Universal Multilingual Scripture Pattern Matcher: Automatically detects & converts plain text references across ALL 700+ Bible languages without hardcoded lists!
    const universalScriptureRx = /(?:^|[^\p{L}\p{N}])((?:[1-3]\s*)?[\p{L}\p{M}'’`-]{2,25}\s+\d{1,3}\s*[:\.]\s*\d{1,3}(?:\s*[-–—]\s*\d{1,3})?)(?=[^\p{L}\p{N}]|$)/gu;

    chunk = chunk.replace(universalScriptureRx, (fullMatch, refMatch) => {
      if (!refMatch || refMatch.length < 4) return fullMatch;
      const leadingChar = fullMatch.slice(0, fullMatch.indexOf(refMatch));
      return `${leadingChar}{{CITATION: ${refMatch}|${refMatch}|ukr|BookOpen}}`;
    });

    // Restore protected tags
    chunk = chunk.replace(/___PROT_TAG_(\d+)___/g, (_, idx) => existingTags[parseInt(idx, 10)])
      .replace(/\[+([^\]]+)\]+\(https?:\/\/(?:www\.)?bible\.com\/[^\/]+\/(?:[^\/]+\/)?([^.\s\)]+)\.([^.\s\)]+)\.([a-z]{2,4})\)/gi, (full, label, bookChapter, verse, lang) => {
        const cleanRef = `${bookChapter}:${verse}`.replace(/\./g, ' ');
        return `{{CITATION: ${cleanRef}|${label || cleanRef}|${lang || 'ukr'}|BookOpen}}`;
      })
      .replace(/https?:\/\/(?:www\.)?bible\.com\/[^\/]+\/(?:[^\/]+\/)?([^.\s\)]+)\.([^.\s\)]+)\.([a-z]{2,4})/gi, (full, bookChapter, verse, lang) => {
        const cleanRef = `${bookChapter}:${verse}`.replace(/\./g, ' ');
        return `{{CITATION: ${cleanRef}|${cleanRef}|${lang || 'ukr'}|BookOpen}}`;
      })
      .replace(/\}\s*\|\s*(?:BookOpen|Quote)?\s*\}\}/gi, '}}')
      .replace(/\|\s*(?:BookOpen|Quote)\s*\}\}\s*\|\s*(?:BookOpen|Quote)\s*\}\}/gi, '|BookOpen}}')
      .replace(/[\(\[\{]*\s*\[?\s*(?:CITATION|VERSE)\s*\]?\s*:\s*([^|}]+)(?:\|([^|}]+))?(?:\|([^|}]+))?(?:\|([^|}]+))?[\]\}\)]*/gi, (fullMatch, refQuery, title, lang, icon) => {
        if (!refQuery) return fullMatch;
        let cleanQuery = refQuery.trim().replace(/_/g, ' ').replace(/\s+/g, ' ').replace(/^([1-3]?\s*[A-Za-zА-Яа-яЄєІіЇїҐґ]+)\s+(\d+)\s+(\d+)$/i, '$1 $2:$3').replace(/[:;.,)\s]+$/g, '');
        let cleanTitle = (title || cleanQuery).trim().replace(/_/g, ' ').replace(/\s+/g, ' ').replace(/^([1-3]?\s*[A-Za-zА-Яа-яЄєІіЇїҐґ]+)\s+(\d+)\s+(\d+)$/i, '$1 $2:$3');
        const cleanLang = (lang || 'ukr').trim();
        const cleanIcon = (icon || 'BookOpen').trim();
        return `{{CITATION: ${cleanQuery}|${cleanTitle}|${cleanLang}|${cleanIcon}}}`;
      })
      // 🧹 Deduplicate adjacent identical citation tags
      .replace(/(\{\{CITATION:\s*([^|}]+)[\s\S]*?\}\})\s*[\(\[]*\s*(?:\{\{(?:CITATION|VERSE):\s*\2[\s\S]*?\}\}|\(\s*\{\{VERSE:\s*\2\s*\}\}\s*\))\s*[\)\]]*/gi, '$1');

    // 🧹 Global Citation Deduplicator: Suppress repeated citation cards for the exact same passage within the message
    chunk = chunk.replace(/(?:\n\s*[увзпона]\s*\n|\s*\b[увзпона]\s+)?\{\{CITATION:\s*([^|}]+)(?:\|([^|}]+))?(?:\|([^|}]+))?(?:\|([^|}]+))?\}\}/gi, (fullMatch, query, title) => {
      const k1 = toCanonicalReferenceKey(query);
      const k2 = toCanonicalReferenceKey(title);

      if ((k1 && seenCitationKeys.has(k1)) || (k2 && seenCitationKeys.has(k2))) {
        return ''; // Suppress duplicate card AND preceding preposition!
      }
      if (k1) seenCitationKeys.add(k1);
      if (k2) seenCitationKeys.add(k2);
      return fullMatch;
    });

    // 🧹 Clean orphan prepositions sitting alone on lines
    chunk = chunk.replace(/(?:^|\n)\s*[увзпона]\s*(?=\n|$)/gi, '');

    verseRx.lastIndex = 0
    let li = 0
    let m: RegExpExecArray | null
    while ((m = verseRx.exec(chunk)) !== null) {
      if (m.index > li) {
        let tb = chunk.slice(li, m.index)
          // 🧹 Clean opening parenthetical prefixes: "(", "[", "(*", "(див.", "(пор."
          .replace(/[\(\[\{\|\s]*\*?\s*(?:див\.|пор\.|див\. також|дивіться|наприклад)?\s*$/i, '')
          // 🧹 Strip lonely bullet & numbered syntax preceding citation widget
          .replace(/(?:^|\n)\s*[-*•\d\.]+\s*$/, '')
          .replace(/(?:^|\n)\s*(?:[-*•\d\.]+\s*)?\*\*$/, '')
          .replace(/\*\*\s*$/, '')
          .trimEnd();

        if (tb && !/^[.,:;\)\|\s]+$/.test(tb) && !/^\s*[-*•\d\.]+\s*$/.test(tb)) {
          // 🧹 Strip any leading comma or punctuation that starts a text segment
          tb = tb.replace(/^[\s\u00A0]*[,:;.\)\]]+\s*/, '');
          if (tb && /^[а-яєіїґa-z]/.test(tb)) {
            tb = tb.charAt(0).toUpperCase() + tb.slice(1);
          }

          // 🧹 Strip stray double asterisks around number/bullet prefix inside chunk: "** 2. **Title" -> "2. **Title"
          tb = tb
            .replace(/(^|\n|\s)\*\*\s*(\d+\.|\-|•|\*)\s*\*\*\s*/g, '$1$2 **')
            .replace(/(^|\n|\s)\*\*\s*(\d+\.|\-|•|\*)\s*/g, '$1$2 ');

          // 🧹 Balance and sanitize single (*) and double (**) asterisks in tb chunk before pushing
          const singleOnlyCount = (tb.replace(/\*\*/g, '').match(/\*/g) || []).length;
          if (singleOnlyCount % 2 !== 0) {
            tb = tb.replace(/^(\s*(?:[\-*•]|\d+\.)?\s*)\*(?!\*)\s*/, '$1').replace(/\*(?!\*)\s*$/, '');
          }
          const doubleCount = (tb.match(/\*\*/g) || []).length;
          if (doubleCount % 2 !== 0) {
            tb += '**';
          }

          if (tb.trim()) {
            segments.push({ type: 'text', content: tb });
          }
        }

      }
      const inner = m[1].trim()
      const up = inner.toUpperCase()
      const isCite = up.startsWith('CITATION:') || up.startsWith('VERSE:')
      const verseStr = isCite ? inner.substring(inner.indexOf(':') + 1).trim() : inner
      const parts = verseStr.split('|')
      if (parts.length >= 2) {
        let cleanQuery = parts[0].trim().replace(/[:;.,)\s]+$/g, '').replace(/\s+/g, ' ');
        let rawDisplay = parts[1].trim().replace(/[:;.,)\s]+$/g, '');

        // 🧠 Ignore invalid placeholder tags generated by small models (<=4B)
        if (/^(?:LocalizedName|BookAbbreviation|BookAbbr|Chapter:Verse)\b/i.test(cleanQuery) ||
            /^(?:LocalizedName|BookAbbreviation|BookAbbr|Chapter:Verse)\b/i.test(rawDisplay)) {
          li = m.index + m[0].length;
          continue;
        }

        // 🧠 Strip reasoning monologue from query (e.g. "1 Korintian 13:4-8? No, wait. The prompt says...")
        cleanQuery = cleanQuery.replace(/\?\s*No,\s*wait[\s\S]*/i, '').replace(/The\s+prompt\s+says[\s\S]*/i, '').trim();
        rawDisplay = rawDisplay.replace(/\?\s*No,\s*wait[\s\S]*/i, '').replace(/The\s+prompt\s+says[\s\S]*/i, '').trim();

        const cleanDisplay = formatBiblicalDisplayTitle(rawDisplay) || formatBiblicalDisplayTitle(cleanQuery) || cleanQuery;

        if (cleanQuery && cleanQuery.length > 2) {
          segments.push({ 
            type: 'verse', 
            query: cleanQuery, 
            display: cleanDisplay, 
            lang: (parts[2] || 'ukr').trim(),
            iconName: parts[3] ? parts[3].trim() : undefined
          });
        }
      } else if (isCite) {
        const cleanRef = verseStr.trim().replace(/[:;.,)\s]+$/g, '').replace(/\s+/g, ' ');
        // 🛡️ Skip empty or too-short refs — prevents /api/verse?ref=&lang=ukr 400 errors
        if (!cleanRef || cleanRef.length < 3) {
          li = m.index + m[0].length;
          continue;
        }
        const cleanDisplay = formatBiblicalDisplayTitle(cleanRef) || cleanRef;
        segments.push({ 
          type: 'verse', 
          query: cleanRef, 
          display: cleanDisplay, 
          lang: 'ukr',
          iconName: 'BookOpen'
        })
      } else {
        segments.push({ type: 'text', content: `{{${inner}}}` })
      }
      li = m.index + m[0].length

      // 🧹 Clean closing parenthetical brackets, quotes (" ", “ ”, « »), commas, colons, semicolons, dots, and stray markdown asterisks
      const remainder = chunk.slice(li);
      const cleanedRaw = remainder
        .replace(/^[\s\u00A0]*(?:\*\*)?["'”»“«]*[\)\]\.,:;]+\s*/, '');
      if (cleanedRaw !== remainder) {
        li += (remainder.length - cleanedRaw.length);
      }
    }
    if (li < chunk.length) {
      let tail = chunk.slice(li)
        .replace(/^[\s\u00A0]*(?:\*\*)?["'”»“«]*[\)\]\.,:;]+\s*/, '');

      // 🧠 Capitalize first letter if tail started with a stripped leading comma/punctuation (e.g. ", любов довга..." -> "Любов довга...")
      if (tail && /^[а-яєіїґa-z]/.test(tail)) {
        tail = tail.charAt(0).toUpperCase() + tail.slice(1);
      }

      // 🧠 Zero-Flash Streaming Guard: If active streaming is ongoing, suppress trailing incomplete "**" bold markers so they never flash on screen
      if (isStreaming) {
        tail = tail.replace(/(?:^|\n)(\s*(?:[-*•\d\.]+\s*)?)\*\*\s*$/g, '$1');
      }

      // 🧹 Clean stray single asterisks interrupting list items in tail (never touch **)
      tail = tail
        .replace(/^(\s*\d+\.\s*)\*(?!\*)\s*/gm, '$1')
        .replace(/^(\s*[-*•]\s*)\*(?!\*)\s*/gm, '$1');

      // 🧹 Balance single (*) asterisks in tail chunk; double (**) asterisks are balanced at document/line level in parseSegments
      const tailSingleCount = (tail.replace(/\*\*/g, '').match(/\*/g) || []).length;
      if (tailSingleCount % 2 !== 0) {
        tail = tail.replace(/^[\s\u00A0]*\*(?!\*)\s*/, '').replace(/\*(?!\*)\s*$/, '');
      }

      if (tail.trim() && !/^[.,:;\)\s]+$/.test(tail.trim()) && !/^\s*[-*•\d\.]+\s*$/.test(tail)) {
        segments.push({ type: 'text', content: tail });
      }

    }
  }

  function splitAndParse(text: string): void {
    for (const { placeholder, data } of metricsPlaceholders) {
      const idx = text.indexOf(placeholder)
      if (idx !== -1) {
        const before = text.slice(0, idx).trimEnd()
        if (before) parseVerses(before, isStreaming)
        if (data.length > 0) segments.push({ type: 'metrics', data })
        splitAndParse(text.slice(idx + placeholder.length))
        return
      }
    }
    parseVerses(text, isStreaming)
  }

  splitAndParse(processed)

  let seenMetrics = false
  for (let i = segments.length - 1; i >= 0; i--) {
    if (segments[i].type === 'metrics') {
      if (seenMetrics) segments.splice(i, 1);
      else seenMetrics = true;
    }
  }
}

function extractRawText(node: any): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractRawText).join('');
  if (node.props && node.props.children) return extractRawText(node.props.children);
  return '';
}

function CodeBlockComponent({ children, ...props }: any) {

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const codeString = extractRawText(children);
    if (codeString) {
      navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const className = children?.props?.className || '';
  const langMatch = /language-(\w+)/.exec(className);
  const lang = langMatch ? langMatch[1] : '';

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 shadow-md">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/90 border-b border-slate-700/60 text-xs text-slate-400 font-mono">
        <span className="font-bold tracking-wider">{lang ? lang.toUpperCase() : 'CODE'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          <span className="text-[11px] font-semibold">{copied ? 'Скопійовано' : 'Копіювати'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed bg-slate-950/90 text-slate-100" {...props}>
        {children}
      </pre>
    </div>
  );
}

const mdComponents = {

  end: () => null,
  endoftext: () => null,
  im_end: () => null,
  end_of_turn: () => null,
  hr: ({ node, ...props }: any) => (
    <hr className="my-2 border-t border-slate-200/60 dark:border-slate-800/60 opacity-60" {...props} />
  ),
  h1: ({ node, ...props }: any) => (
    <h1 className="text-2xl font-bold text-blue-900 dark:text-slate-200 mt-6 mb-4" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <h2 className="text-xl font-bold mt-5 mb-3 dark:text-slate-200" {...props} />
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-lg font-bold mt-4 mb-2 dark:text-slate-200" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc ml-5 mb-4 dark:text-slate-200" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal ml-5 mb-4 dark:text-slate-200" {...props} />
  ),
  li: ({ node, children, ...props }: any) => {
    let cleanChildren = children;
    if (typeof children === 'string') {
      let cleaned = children.replace(/^[\s\u00A0]*[,:;.\)\]]+\s*/, '');
      if (cleaned && /^[а-яєіїґa-z]/.test(cleaned)) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
      cleanChildren = cleaned;
    } else if (Array.isArray(children) && typeof children[0] === 'string') {
      let cleaned = children[0].replace(/^[\s\u00A0]*[,:;.\)\]]+\s*/, '');
      if (cleaned && /^[а-яєіїґa-z]/.test(cleaned)) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
      cleanChildren = [cleaned, ...children.slice(1)];
    }
    return <li className="mb-2 leading-relaxed dark:text-slate-200" {...props}>{cleanChildren}</li>;
  },
  p: ({ node, children, ...props }: any) => {
    let cleanChildren = children;
    if (typeof children === 'string') {
      let cleaned = children.replace(/^[\s\u00A0]*[,:;.\)\]]+\s*/, '');
      if (cleaned && /^[а-яєіїґa-z]/.test(cleaned)) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
      cleanChildren = cleaned;
    } else if (Array.isArray(children) && typeof children[0] === 'string') {
      let cleaned = children[0].replace(/^[\s\u00A0]*[,:;.\)\]]+\s*/, '');
      if (cleaned && /^[а-яєіїґa-z]/.test(cleaned)) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
      cleanChildren = [cleaned, ...children.slice(1)];
    }
    return <p className="mb-4 last:mb-0 leading-relaxed" {...props}>{cleanChildren}</p>;
  },
  table: ({ node, ...props }: any) => (
    <div className="my-5 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 shadow-md shadow-slate-200/40 dark:shadow-slate-950/40 backdrop-blur-xs">
      <table className="w-full text-left border-collapse m-0 text-sm" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-gradient-to-r from-slate-100/90 via-slate-50/80 to-slate-100/90 dark:from-slate-800/90 dark:via-slate-900/80 dark:to-slate-800/90 border-b border-slate-200/80 dark:border-slate-700/80" {...props} />
  ),
  tbody: ({ node, ...props }: any) => (
    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60" {...props} />
  ),
  tr: ({ node, ...props }: any) => (
    <tr className="transition-colors duration-150 even:bg-slate-50/40 dark:even:bg-slate-800/20 hover:bg-blue-50/40 dark:hover:bg-blue-950/30" {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th className="px-5 py-3.5 text-[12px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 align-middle" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-5 py-3.5 text-[14px] leading-relaxed text-slate-700 dark:text-slate-300 align-top" {...props} />
  ),
  a: ({ node, ...props }: any) => (
    <a className="text-blue-600 dark:text-blue-400 no-underline hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  blockquote: ({ node, ...props }: any) => (
    <div className="relative my-4 overflow-hidden rounded-2xl border border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-slate-50/60 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900/40 p-4 sm:p-4.5 shadow-sm shadow-blue-500/5">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-violet-500 rounded-l-2xl" />
      <div className="pl-3.5 text-slate-700 dark:text-slate-200 leading-relaxed text-[14.5px]">
        <blockquote className="not-italic [&_p]:mb-1 [&_p:last-child]:mb-0" {...props} />
      </div>
    </div>
  ),
  pre: CodeBlockComponent,
};



// Module-level static references to prevent AST invalidation on every frame
const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS_STREAMING = [rehypeRaw];
const REHYPE_PLUGINS_STATIC = [rehypeRaw, rehypeHighlight];

export function RichTextRenderer({ content, isStreaming }: RichTextRendererProps) {
  // 🧹 Anti-Echo Guard: Strip echoed user question at the start of response
  const sanitizedContent = content ? content.replace(/^(?:#+\s*)?(?:що таке [^?\n]+\?|what is [^?\n]+\?|how to [^?\n]+\?|[^\n]{3,60}\?)\s*\n+/i, '') : content;


  // 🧠 100ms AST Render Throttle: Reduces ReactMarkdown AST parsing from 100 times/sec to 10 times/sec during streaming!
  // Reduces CPU load from 51% to < 1% and GPU from 57% to < 1%!
  const [throttledContent, setThrottledContent] = useState(sanitizedContent);
  const lastRenderTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      setThrottledContent(sanitizedContent);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const now = Date.now();
    const elapsed = now - lastRenderTimeRef.current;

    if (elapsed >= 100) {
      lastRenderTimeRef.current = now;
      setThrottledContent(sanitizedContent);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        lastRenderTimeRef.current = Date.now();
        setThrottledContent(sanitizedContent);
      }, 100 - elapsed);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sanitizedContent, isStreaming]);

  const activeContent = isStreaming ? throttledContent : content;

  let safeContent = activeContent;
  if (isStreaming) {
    // Guard incomplete citation/metrics tags at stream tail
    safeContent = safeContent.replace(/\{\{[^}]*$/, '');
    safeContent = safeContent.replace(/\[\[[^\]]*$/, '');
    // 🔧 Guard partial <think> / </think> tags split across stream chunks.
    // Without this, a partial token like '</thi' causes a mis-classification flash.
    safeContent = safeContent.replace(/<\/(?:think|thought|reasoning)[^>]*$/, '');
    safeContent = safeContent.replace(/<(?:think|thought|reasoning)[^>]*$/, '');
  }

  const segments = parseSegments(safeContent, isStreaming);

  // Split segments into thinking segments (top) and rest content segments (body)
  const thinkSegments = segments.filter(seg => seg.type === 'think');
  const bodySegments = segments.filter(seg => seg.type !== 'think');

  const bodyText = bodySegments
    .filter(seg => seg.type === 'text')
    .map(seg => (seg as any).content || '')
    .join('')
    .trim();

  const hasBodyVerse = bodySegments.some(seg => seg.type === 'verse');
  const hasSparseBody = !hasBodyVerse && bodyText.length < 20;

  // Keep rehypePlugins array reference stable across streaming to prevent AST re-hydration flashes
  const rehypePlugins = REHYPE_PLUGINS_STATIC;


  return (
    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-900 dark:text-slate-100 prose-p:leading-relaxed prose-p:text-slate-900 dark:prose-p:text-slate-100 prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-li:text-slate-900 dark:prose-li:text-slate-100 prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-800 prose-pre:rounded-xl">
      {/* 🧠 ALWAYS PIN THINKING WIDGET AT THE VERY TOP OF THE MESSAGE BUBBLE */}
      {thinkSegments.map((seg, i) => (
        <ThinkingWidget 
          key={`think-widget-${i}`} 
          content={seg.content} 
          isThinking={seg.isThinking} 
          isStreaming={isStreaming}
          hasSparseBody={hasSparseBody}
        />
      ))}

      {(() => {
        const renderedVerseKeys = new Set<string>();
        const deduplicatedSegments = bodySegments.filter((seg) => {
          if (seg.type === 'verse') {
            const k1 = toCanonicalReferenceKey(seg.query);
            const k2 = toCanonicalReferenceKey(seg.display);
            if ((k1 && renderedVerseKeys.has(k1)) || (k2 && renderedVerseKeys.has(k2))) {
              return false; // Suppress duplicate verse card!
            }
            if (k1) renderedVerseKeys.add(k1);
            if (k2) renderedVerseKeys.add(k2);
          }
          return true;
        });

        return deduplicatedSegments.map((seg, i) => {
          if (seg.type === 'verse') {
            const canonicalKey = toCanonicalReferenceKey(seg.query) || seg.query;
            return (
              <CitationCard
                key={`verse-${canonicalKey}-${seg.lang}`}
                query={seg.query}
                display={seg.display}
                lang={seg.lang}
                iconName={seg.iconName}
              />
            );
          } else if (seg.type === 'metrics') {
            return (
              <MetricsCard 
                key={`metrics-${JSON.stringify(seg.data)}`}
                metrics={seg.data}
              />
            );
          }

          let textContent = seg.content;
          if (!textContent.trim() && !/[a-zA-Z0-9\u0400-\u04FF]/.test(textContent)) {
            return null;
          }

          // 🛡️ Stable Content Keying: Prevents React from unmounting text segments when citation tags arrive
          const textPrefix = textContent.trim().slice(0, 30).replace(/\s+/g, '_');
          return (
            <ReactMarkdown
              key={`txt-${textPrefix}-${i}`}
              remarkPlugins={REMARK_PLUGINS}
              rehypePlugins={rehypePlugins as any}
              components={mdComponents}
            >
              {textContent.trim()}
            </ReactMarkdown>
          );
        });
      })()}
    </div>
  );
}

