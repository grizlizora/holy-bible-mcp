"use client";

import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, Sparkles, BrainCircuit, Sliders, X, Check, Flame, Settings, 
  ThermometerSun, Brain, Zap, Scale, FileText, Search, Library, ScrollText,
  Activity, ArrowRight, Bot, Pencil, Landmark, Scroll, Snowflake, ShieldCheck
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { GlassBox, GlassButton, getGlassClasses } from "@/components/ui/glass";
import { cn } from "@/lib/utils";
import { useContentBlur } from "@/lib/useContentBlur";

const iconMap: Record<string, any> = {
  Menu, Sparkles, BrainCircuit, Sliders, X, Check, Flame, Settings,
  ThermometerSun, Brain, Zap, Scale, FileText, Search, Library, ScrollText,
  Activity, ArrowRight, Bot, Pencil, Landmark, Scroll, Snowflake, ShieldCheck
};

const optionStyleMap: Record<string, { 
  boxBg: string, 
  iconText: string, 
  borderActive: string, 
  bgActive: string 
}> = {
  minimal: {
    boxBg: 'bg-amber-500/15 dark:bg-amber-500/25',
    iconText: 'text-amber-500 dark:text-amber-400',
    borderActive: 'border-amber-500/80',
    bgActive: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/15 border-amber-500/80 text-amber-900 dark:text-amber-200 shadow-md shadow-amber-500/15'
  },
  short: {
    boxBg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
    iconText: 'text-emerald-500 dark:text-emerald-400',
    borderActive: 'border-emerald-500/80',
    bgActive: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/15 border-emerald-500/80 text-emerald-900 dark:text-emerald-200 shadow-md shadow-emerald-500/15'
  },
  medium: {
    boxBg: 'bg-purple-500/15 dark:bg-purple-500/25',
    iconText: 'text-purple-500 dark:text-purple-400',
    borderActive: 'border-purple-500/80',
    bgActive: 'bg-gradient-to-r from-purple-500/20 to-indigo-500/15 border-purple-500/80 text-purple-900 dark:text-purple-200 shadow-md shadow-purple-500/15'
  },
  detailed: {
    boxBg: 'bg-cyan-500/15 dark:bg-cyan-500/25',
    iconText: 'text-cyan-500 dark:text-cyan-400',
    borderActive: 'border-cyan-500/80',
    bgActive: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/15 border-cyan-500/80 text-cyan-900 dark:text-cyan-200 shadow-md shadow-cyan-500/15'
  },
  deep: {
    boxBg: 'bg-indigo-500/15 dark:bg-indigo-500/25',
    iconText: 'text-indigo-500 dark:text-indigo-400',
    borderActive: 'border-indigo-500/80',
    bgActive: 'bg-gradient-to-r from-indigo-500/20 to-violet-500/15 border-indigo-500/80 text-indigo-900 dark:text-indigo-200 shadow-md shadow-indigo-500/15'
  },
  verses_only: {
    boxBg: 'bg-rose-500/15 dark:bg-rose-500/25',
    iconText: 'text-rose-500 dark:text-rose-400',
    borderActive: 'border-rose-500/80',
    bgActive: 'bg-gradient-to-r from-rose-500/20 to-pink-500/15 border-rose-500/80 text-rose-900 dark:text-rose-200 shadow-md shadow-rose-500/15'
  }
};

const warmthPresetStyleMap: Record<number, {
  iconText: string,
  boxBg: string,
  activeClass: string,
  inactiveClass: string
}> = {
  0: {
    iconText: 'text-cyan-600 dark:text-cyan-400',
    boxBg: 'bg-cyan-500/20 dark:bg-cyan-500/30',
    activeClass: 'border-cyan-500/90 bg-cyan-500/15 dark:bg-cyan-500/25 text-cyan-900 dark:text-cyan-200 font-extrabold shadow-md shadow-cyan-500/20',
    inactiveClass: 'border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/80'
  },
  50: {
    iconText: 'text-teal-600 dark:text-teal-400',
    boxBg: 'bg-teal-500/20 dark:bg-teal-500/30',
    activeClass: 'border-teal-500/90 bg-teal-500/15 dark:bg-teal-500/25 text-teal-900 dark:text-teal-200 font-extrabold shadow-md shadow-teal-500/20',
    inactiveClass: 'border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/80'
  },
  80: {
    iconText: 'text-orange-600 dark:text-orange-400',
    boxBg: 'bg-orange-500/20 dark:bg-orange-500/30',
    activeClass: 'border-orange-500/90 bg-orange-500/15 dark:bg-orange-500/25 text-orange-950 dark:text-orange-200 font-extrabold shadow-md shadow-orange-500/20',
    inactiveClass: 'border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/80'
  },
  100: {
    iconText: 'text-purple-600 dark:text-purple-400',
    boxBg: 'bg-purple-500/20 dark:bg-purple-500/30',
    activeClass: 'border-purple-500/90 bg-purple-500/15 dark:bg-purple-500/25 text-purple-950 dark:text-purple-200 font-extrabold shadow-md shadow-purple-500/20',
    inactiveClass: 'border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/80'
  }
};

import { useTranslations, useLocale } from 'next-intl';

function ChatHeaderComponent({ chatTitle }: { chatTitle?: string }) {
  const locale = useLocale();
  const tHeader = useTranslations('Header');
  const tWarmth = useTranslations('WarmthModal');
  const tDetail = useTranslations('DetailModal');
  const tCommon = useTranslations('Common');

  const mcpConfigs = useSettingsStore(s => s.mcpConfigs);
  const mcpSettings = useSettingsStore(s => s.mcpSettings);
  const setMcpSetting = useSettingsStore(s => s.setMcpSetting);
  const initializeMcpSettings = useSettingsStore(s => s.initializeMcpSettings);
  
  const primaryConfig = mcpConfigs.find(c => c.isPrimary);
  const activeMcpId = useSettingsStore(s => s.activeMcpId);
  const activeWarmthMcpId = useSettingsStore(s => s.activeWarmthMcpId);
  const activeModeMcpId = useSettingsStore(s => s.activeModeMcpId);
  
  const mcpId = activeMcpId || primaryConfig?.id || 'default-mcp';
  const warmthMcpId = activeWarmthMcpId || mcpId;
  const modeMcpId = activeModeMcpId || mcpId;
  
  const warmthSettings = mcpSettings[warmthMcpId] || {};
  const modeSettings = mcpSettings[modeMcpId] || {};
  
  const warmth = warmthSettings.warmth ?? 80;
  const detailLevel = modeSettings.detailLevel ?? 'auto';
  
  const setWarmth = (v: number) => setMcpSetting(warmthMcpId, 'warmth', v);
  const setDetailLevel = (v: string) => setMcpSetting(modeMcpId, 'detailLevel', v);
  
  const isAuto = detailLevel === 'auto';
  const toggleMobileSidebar = useSettingsStore(s => s.toggleMobileSidebar);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isWarmthModalOpen, setIsWarmthModalOpen] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    // Always re-fetch on mount so removed MCP settings (e.g. bibleTranslations) are pruned
    fetch('/api/mcp/configs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          initializeMcpSettings(data);
        }
      })
      .catch(err => console.error("Failed to auto-fetch MCP capabilities:", err));
  }, [initializeMcpSettings]);

  // Apple-style content blur: blur page content when any modal is open
  useContentBlur(isWarmthModalOpen || isDetailModalOpen);
  const [tempWarmth, setTempWarmth] = useState(warmth);
  const [tempDetailLevel, setTempDetailLevel] = useState(detailLevel);
  const [lastManualDetail, setLastManualDetail] = useState<string>('minimal');

  if (!isMounted) return null;

  // Build dynamic map from MCP capabilities
  const detailLevelConfig = primaryConfig?.settings?.find((s: any) => s.id === 'modeKey' || s.id === 'detailLevel');
  const detailMap: Record<string, { label: string, iconName: string, desc: string }> = {};

  // Guarantee fallback coverage for all 7 modes
  const fallbackOptions: Record<string, { label: string, iconName: string, desc: string }> = {
    'auto': { label: tHeader('auto'), iconName: 'Bot', desc: 'Автоматичний вибір на основі складності' },
    'minimal': { label: tDetail('minimal'), iconName: 'Zap', desc: tDetail('minimalDesc') },
    'short': { label: tDetail('short'), iconName: 'Pencil', desc: tDetail('shortDesc') },
    'medium': { label: tDetail('medium'), iconName: 'Scale', desc: tDetail('mediumDesc') },
    'detailed': { label: tDetail('detailed'), iconName: 'Search', desc: tDetail('detailedDesc') },
    'deep': { label: tDetail('deep'), iconName: 'Landmark', desc: tDetail('deepDesc') },
    'verses_only': { label: tDetail('versesOnly'), iconName: 'Scroll', desc: tDetail('versesOnlyDesc') },
  };
  
  if (detailLevelConfig?.options && detailLevelConfig.options.length > 0) {
    detailLevelConfig.options.forEach((opt: any) => {
      detailMap[opt.value] = {
        label: opt.label?.[locale] || opt.label?.uk || opt.value,
        iconName: opt.iconName || fallbackOptions[opt.value]?.iconName || 'Settings',
        desc: opt.description?.[locale] || opt.description?.uk || fallbackOptions[opt.value]?.desc || ''
      };
    });
  }

  Object.keys(fallbackOptions).forEach(key => {
    if (!detailMap[key]) {
      detailMap[key] = fallbackOptions[key];
    }
  });

  const warmthConfig = primaryConfig?.settings?.find((s: any) => s.id === 'warmth');
  const warmthMinLabel = warmthConfig?.minLabel?.[locale] || tWarmth('dryAcademic');
  const warmthMaxLabel = warmthConfig?.maxLabel?.[locale] || tWarmth('deepEmpathy');
  const warmthIconName = warmthConfig?.iconName || 'Flame';
  const WarmthIcon = iconMap[warmthIconName] || Settings;

  const detailLevelIconName = detailLevelConfig?.iconName || 'Sliders';
  const DetailLevelIcon = iconMap[detailLevelIconName] || Settings;

  const warmthPresets = warmthConfig?.options ? warmthConfig.options.map((p: any) => ({ val: p.value, label: p.label?.[locale] || p.value, iconName: p.iconName })) : [
    { label: tWarmth('presetPrecise'), val: 0, iconName: 'Snowflake' },
    { label: tWarmth('presetBalanced'), val: 50, iconName: 'Scale' },
    { label: tWarmth('presetCreative'), val: 80, iconName: 'Flame' },
    { label: tWarmth('presetDeep'), val: 100, iconName: 'Sparkles' },
  ];

  const openWarmthModal = () => {
    setTempWarmth(warmth);
    setIsWarmthModalOpen(true);
  };

  const openDetailModal = () => {
    if (!isAuto) {
      setTempDetailLevel(detailLevel);
      setIsDetailModalOpen(true);
    }
  };


  return (
    <>
      <GlassBox style={{ transform: 'translateZ(0)', paddingTop: 'max(var(--tg-safe-area-inset-top, env(safe-area-inset-top)), 0.75rem)' }} variant="medium" intensity="md" className="flex items-center justify-between px-3 sm:px-5 rounded-none border-b border-x-0 border-t-0 border-white/20 dark:border-slate-800/60 sticky top-0 z-20 gap-2 sm:gap-3 shadow-sm h-[72px] sm:h-[80px] w-full">
        
        {/* Left: Menu Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            onClick={toggleMobileSidebar}
            className="md:hidden w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center flex-shrink-0 active:scale-95 shadow-sm"
          >
            <Menu className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>

        {/* Center: Title */}
        <div className="flex-1 min-w-0 text-center px-2">
          <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
            {chatTitle || 'Liquid AI'}
          </h2>
        </div>

        {/* Right: Liquid Glass Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          
          <button 
            onClick={openDetailModal}
            disabled={isAuto}
            className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border transition-all shadow-sm ${
              isAuto 
                ? 'bg-slate-200/40 dark:bg-slate-800/40 border-slate-300/30 dark:border-slate-700/30 text-slate-400 dark:text-slate-500 cursor-not-allowed grayscale opacity-60' 
                : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-600 dark:text-purple-300 active:scale-95'
            }`}
            title={isAuto ? tHeader('auto') : `${tHeader('mode')}: ${detailMap[detailLevel]?.label}`}
          >
            <span>
              {(() => {
                const IconComp = iconMap[detailMap[detailLevel]?.iconName] || Settings;
                return <IconComp size={24} />;
              })()}
            </span>
          </button>

          <button 
            onClick={() => setDetailLevel(isAuto ? (lastManualDetail || 'minimal') : 'auto')}
            className={`flex items-center justify-center gap-2 h-12 sm:h-14 px-4 sm:px-5 rounded-2xl text-[14px] sm:text-[16px] font-extrabold transition-all border ${isAuto ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 backdrop-blur-md text-white border-blue-500 shadow-md shadow-blue-500/25' : 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'}`}
          >
            <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <span>{isAuto ? tHeader('auto') : tHeader('native')}</span>
          </button>

          <button 
            onClick={openWarmthModal}
            className="flex items-center justify-center gap-2 h-12 sm:h-14 px-4 sm:px-5 rounded-2xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-[14px] sm:text-[16px] font-extrabold shadow-sm active:scale-95"
          >
            <WarmthIcon className="text-orange-500 w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <span>{warmth}%</span>
          </button>

        </div>

      </GlassBox>

      {/* 1. Warmth Selection Bottom Sheet Modal (Liquid Glass) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isWarmthModalOpen && (
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
                onClick={() => setIsWarmthModalOpen(false)}
              />
              <motion.div 
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                style={{ willChange: 'transform', transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}
                className={cn(
                  getGlassClasses("modal", "2xl"),
                  "relative w-full max-w-sm sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto no-scrollbar overscroll-none mx-auto border-t sm:border-t-0"
                )}
              >
              <div className="flex items-center justify-between border-b border-white/20 dark:border-slate-700/50 pb-5 mb-1 gap-2">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/15 flex items-center justify-center text-orange-500 shadow-inner flex-shrink-0">
                  <WarmthIcon size={22} />
                </div>
                <span className="flex-1 text-center text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100 px-1 truncate">
                  {warmthConfig?.label?.[locale] || tWarmth('title')}
                </span>
                <GlassButton 
                  variant="clear"
                  onClick={() => setIsWarmthModalOpen(false)}
                  className="w-10 h-10 rounded-2xl"
                >
                  <X size={22} />
                </GlassButton>
              </div>

              <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {tWarmth('subtitle')}
              </p>

              {/* Slider & Value Display */}
              <div className="flex flex-col gap-5 py-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{tWarmth('warmthScore')}:</span>
                  <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500/15 to-amber-500/15 px-3.5 py-1.5 rounded-xl border border-orange-500/30 shadow-sm focus-within:border-orange-500 transition-all">
                    <span className="text-xl">🔥</span>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={tempWarmth}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      onChange={(e) => {
                        let val = parseInt(e.target.value) || 0;
                        if (val > 100) val = 100;
                        if (val < 0) val = 0;
                        setTempWarmth(val);
                      }}
                      className="w-8 bg-transparent text-xl font-mono font-extrabold text-orange-600 dark:text-orange-400 text-right outline-none border-none p-0 m-0 focus:ring-0"
                    />
                    <span className="text-xl font-mono font-extrabold text-orange-600 dark:text-orange-400">%</span>
                  </div>
                </div>

                <div className="py-2.5 px-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={tempWarmth}
                    onChange={(e) => setTempWarmth(Number(e.target.value))}
                    style={{ touchAction: 'pan-x' }}
                    className="warmth-slider"
                  />
                  <div className="flex flex-row justify-between w-full space-x-2 mt-3 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <span className="truncate flex-1 text-left">0% ({warmthMinLabel})</span>
                    <span className="truncate flex-1 text-right">100% ({warmthMaxLabel})</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {warmthPresets.map((preset: any) => {
                    const isActive = 
                      (preset.val === 0 && tempWarmth <= 25) ||
                      (preset.val === 50 && tempWarmth > 25 && tempWarmth <= 65) ||
                      (preset.val === 80 && tempWarmth > 65 && tempWarmth <= 90) ||
                      (preset.val === 100 && tempWarmth > 90);

                    const style = warmthPresetStyleMap[preset.val] || {
                      iconText: 'text-orange-500 dark:text-orange-400',
                      boxBg: 'bg-orange-500/15',
                      activeClass: 'border-orange-500 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30',
                      inactiveClass: 'border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/80'
                    };
                      
                    const PresetIcon = iconMap[preset.iconName] || Settings;

                    return (
                      <button
                        key={preset.val}
                        onClick={() => setTempWarmth(preset.val)}
                        className={`py-3 px-3.5 text-[13px] font-bold rounded-2xl border transition-all flex items-center justify-between min-w-0 ${isActive ? style.activeClass : style.inactiveClass}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform",
                            style.boxBg,
                            style.iconText
                          )}>
                            <PresetIcon size={16} className="stroke-[2.2]" />
                          </span>
                          <span className="break-words whitespace-normal text-left font-extrabold">{preset.label}</span>
                        </div>
                        {isActive && (
                          <Check size={16} className={cn("flex-shrink-0 ml-1 font-bold", style.iconText)} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button 
                onClick={() => {
                  setWarmth(tempWarmth);
                  setIsWarmthModalOpen(false);
                }}
                className="w-full mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-bold text-[15px] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
              >
                {tWarmth('save')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}

      {/* 2. Detail Level Selection Bottom Sheet Modal (Liquid Glass) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isDetailModalOpen && (
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
                onClick={() => setIsDetailModalOpen(false)}
              />
              <motion.div 
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                style={{ willChange: 'transform', transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}
                className={cn(
                  getGlassClasses("modal", "2xl"),
                  "relative w-full max-w-sm sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto no-scrollbar overscroll-none mx-auto border-t sm:border-t-0"
                )}
              >
              <div className="flex items-center justify-between border-b border-white/20 dark:border-slate-700/50 pb-5 mb-1 gap-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner flex-shrink-0">
                  <DetailLevelIcon size={22} />
                </div>
                <span className="flex-1 text-center text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100 px-1 truncate">
                  {detailLevelConfig?.label?.[locale] || tDetail('title')}
                </span>
                <GlassButton 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-10 h-10 rounded-2xl"
                >
                  <X size={22} />
                </GlassButton>
              </div>

              <div className="flex flex-col gap-2.5 py-1">
                {(Object.keys(detailMap)).filter(dKey => dKey !== 'auto').map(dKey => {
                  const isSelected = tempDetailLevel === dKey;
                  const theme = optionStyleMap[dKey] || {
                    boxBg: 'bg-purple-500/15 dark:bg-purple-500/25',
                    iconText: 'text-purple-500 dark:text-purple-400',
                    borderActive: 'border-purple-500/80',
                    bgActive: 'bg-purple-500/15 border-purple-500/80 text-purple-700 dark:text-purple-300 shadow-md shadow-purple-500/20'
                  };

                  const IconComp = iconMap[detailMap[dKey].iconName] || Settings;

                  return (
                    <button
                      key={dKey}
                      onClick={() => setTempDetailLevel(dKey)}
                      className={`flex items-center gap-3.5 p-3 rounded-2xl border text-left transition-all min-w-0 ${
                        isSelected 
                          ? `${theme.bgActive}` 
                          : 'border-slate-200/80 dark:border-slate-700/60 hover:bg-white/80 dark:hover:bg-slate-700/80 bg-white/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className={cn(
                        "shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-transform duration-200",
                        theme.boxBg,
                        theme.iconText,
                        isSelected && "scale-105 shadow-sm"
                      )}>
                        <IconComp size={22} className="stroke-[2.2]" />
                      </span>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[14px] font-extrabold truncate">{detailMap[dKey].label}</span>
                        <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium break-words leading-tight">{detailMap[dKey].desc}</span>
                      </div>
                      {isSelected && <Check size={18} className={cn("shrink-0 font-bold", theme.iconText)} />}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => {
                  setLastManualDetail(tempDetailLevel);
                  setDetailLevel(tempDetailLevel);
                  setIsDetailModalOpen(false);
                }}
                className="w-full mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-bold text-[15px] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
              >
                {tWarmth('save')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </>
  );
}

export const ChatHeader = React.memo(ChatHeaderComponent);
