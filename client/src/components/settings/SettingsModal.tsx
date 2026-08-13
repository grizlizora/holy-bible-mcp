"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Monitor, Server, Code } from 'lucide-react';
import { getGlassClasses } from "@/components/ui/glass";
import { cn } from "@/lib/utils";
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { McpDashboard } from '@/components/mcp/McpDashboard';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SegmentOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

function SegmentedControl({
  options,
  selectedValue,
  onChange,
  groupName
}: {
  options: SegmentOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  groupName: string;
}) {
  return (
    <div className="flex p-1 bg-slate-200/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl w-full overflow-hidden">
      {options.map((option) => {
        const isActive = selectedValue === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
              onChange(option.value);
            }}
            className={cn(
              "relative flex-1 min-w-0 flex items-center justify-center gap-2 py-2.5 px-2 sm:px-3 text-xs sm:text-sm font-semibold rounded-xl transition-colors duration-200 select-none outline-none",
              isActive 
                ? "text-slate-900 dark:text-slate-100 font-extrabold" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={`highlight-${groupName}`}
                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm"
                initial={false}
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5 min-w-0">
              <span className="shrink-0 flex items-center justify-center">{option.icon}</span>
              <span className="truncate leading-tight">{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ToggleSwitch({ 
  checked, 
  onChange 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
        onChange(!checked);
      }}
      className={cn(
        "relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none select-none",
        checked 
          ? "bg-blue-600 dark:bg-blue-500 shadow-xs" 
          : "bg-slate-300/90 dark:bg-slate-700 border border-slate-300/80 dark:border-slate-600/50"
      )}
    >
      <motion.span
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0 shrink-0"
      />
    </button>
  );
}

function McpSettingsPanel() {
  const [configs, setConfigs] = useState<any[]>([]);
  const currentLocale = useLocale() as 'uk' | 'en' | 'ru';
  
  const mcpSettings = useSettingsStore(s => s.mcpSettings);
  const activeMcpId = useSettingsStore(s => s.activeMcpId);
  const setActiveMcpId = useSettingsStore(s => s.setActiveMcpId);
  const setMcpSetting = useSettingsStore(s => s.setMcpSetting);
  const initializeMcpSettings = useSettingsStore(s => s.initializeMcpSettings);

  useEffect(() => {
    fetch('/api/mcp/configs')
      .then(res => res.json())
      .then(data => {
        const primaryConfigs = data.filter((c: any) => c.isPrimary === true);
        setConfigs(primaryConfigs);
        initializeMcpSettings(data);
      })
      .catch(console.error);
  }, []);

  if (configs.length === 0) return null;

  const activeConfig = configs.find(c => c.id === activeMcpId) || configs[0];

  return (
    <div className="space-y-6">
      {configs.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Select MCP Config</h3>
          <SegmentedControl 
            groupName="mcpSelect"
            options={configs.map(c => ({ value: c.id, label: c.name || c.id }))}
            selectedValue={activeMcpId || configs[0].id}
            onChange={(val) => setActiveMcpId(val)}
          />
        </div>
      )}

      {activeConfig?.settings
        ?.filter((setting: any) => !['warmth', 'modeKey', 'detailLevel', 'bibleTranslations', 'strongsEnabled', 'includeStrongs'].includes(setting.id))
        .map((setting: any) => (
        <div key={setting.id} className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            {setting.label?.[currentLocale] || setting.id}
          </h3>
          
          {setting.type === 'slider' && (
            <div className="py-2.5 px-1">
              <input 
                type="range" 
                min={setting.min} 
                max={setting.max}
                step={setting.step || 1}
                value={mcpSettings[activeConfig.id]?.[setting.id] ?? setting.defaultValue ?? 0}
                onChange={(e) => setMcpSetting(activeConfig.id, setting.id, Number(e.target.value))}
                className="warmth-slider w-full"
              />
              <div className="text-right mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                {mcpSettings[activeConfig.id]?.[setting.id] ?? setting.defaultValue ?? 0}
              </div>
            </div>
          )}

          {setting.type === 'select' && (
            <select
              value={mcpSettings[activeConfig.id]?.[setting.id] ?? setting.defaultValue}
              onChange={(e) => setMcpSetting(activeConfig.id, setting.id, e.target.value)}
              className="w-full bg-slate-200/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-300/80 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
            >
              {setting.options.map((opt: any) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {opt.label?.[currentLocale] || opt.value}
                </option>
              ))}
            </select>
          )}
          {setting.type === 'toggle' && (
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {setting.description?.[currentLocale] || ''}
              </span>
              <ToggleSwitch
                checked={mcpSettings[activeConfig.id]?.[setting.id] ?? setting.defaultValue ?? false}
                onChange={(checked) => setMcpSetting(activeConfig.id, setting.id, checked)}
              />
            </div>
          )}

          {setting.type === 'multi-select' && (
            <div className="flex flex-wrap gap-2 pt-1">
              {setting.options?.map((opt: any) => {
                const currentVals: string[] = mcpSettings[activeConfig.id]?.[setting.id] ?? setting.defaultValue ?? [];
                const isSelected = Array.isArray(currentVals) && currentVals.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      const nextVals = isSelected
                        ? currentVals.filter(v => v !== opt.value)
                        : [...(Array.isArray(currentVals) ? currentVals : []), opt.value];
                      setMcpSetting(activeConfig.id, setting.id, nextVals);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                      isSelected
                        ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                        : "bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-300/60 dark:border-slate-700/60 hover:bg-slate-300/60 dark:hover:bg-slate-700/60"
                    )}
                  >
                    {opt.label?.[currentLocale] || opt.value}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const tSettings = useTranslations('Settings');

  const setLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as any });
  };
  
  const [activeTab, setActiveTab] = useState<'general' | 'mcp'>('general');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
              onClose();
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 dark:bg-black/60 backdrop-blur-md p-3 sm:p-4 pointer-events-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            style={{ willChange: 'transform, opacity', transform: 'translate3d(0,0,0)', backfaceVisibility: 'hidden' }}
            className={cn(
              "w-full max-w-2xl rounded-3xl flex flex-col max-h-[85vh] pointer-events-auto overflow-hidden",
              "bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] text-slate-900 dark:text-slate-100"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">{tSettings('title')}</h2>
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                  onClose();
                }}
                className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-500 transition-colors active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
              {/* Top Tab Bar (Mobile) / Left Sidebar (Desktop) */}
              <div className="w-full sm:w-48 p-1 sm:p-2 flex flex-row sm:flex-col gap-1 shrink-0 bg-slate-200/60 dark:bg-slate-900/60 sm:bg-transparent sm:dark:bg-transparent rounded-2xl sm:rounded-none backdrop-blur-md relative z-20 sm:border-r border-slate-200/30 dark:border-slate-800/30">
                {[
                  { id: 'general', label: tSettings('general'), icon: <Monitor size={16} /> },
                  { id: 'mcp', label: tSettings('mcpHub'), icon: <Server size={16} /> }
                ].map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                        setActiveTab(tab.id as 'general' | 'mcp');
                      }}
                      className={cn(
                        "relative flex-1 sm:flex-none min-w-0 flex items-center justify-center sm:justify-start gap-2 p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-200 select-none outline-none",
                        isActive 
                          ? "text-slate-900 dark:text-slate-100 font-extrabold" 
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-tab-pill"
                          className="absolute inset-0 bg-white dark:bg-slate-800 shadow-sm rounded-xl"
                          initial={false}
                          transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center justify-center gap-2 min-w-0">
                        <span className="shrink-0">{tab.icon}</span>
                        <span className="truncate">{tab.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Content Area */}
              <div className="flex-1 p-4 sm:p-6 pb-8 sm:pb-12 overflow-y-auto overscroll-contain">
                <AnimatePresence mode="wait">
                  {activeTab === 'general' ? (
                    <motion.div 
                      key="general"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6 sm:space-y-8"
                    >
                      {/* Theme Settings */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{tSettings('appearance')}</h3>
                        <SegmentedControl 
                          groupName="theme"
                          options={[
                            { value: 'light', label: tSettings('themeLight'), icon: <Sun size={16} /> },
                            { value: 'dark', label: tSettings('themeDark'), icon: <Moon size={16} /> },
                            { value: 'system', label: tSettings('themeSystem'), icon: <Monitor size={16} /> }
                          ]}
                          selectedValue={theme || 'system'}
                          onChange={(val) => setTheme(val)}
                        />
                      </div>

                      {/* Locale Settings */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{tSettings('language')}</h3>
                        <SegmentedControl 
                          groupName="locale"
                          options={[
                            { value: 'uk', label: tSettings('ukrainian'), icon: <span className="text-sm">🇺🇦</span> },
                            { value: 'en', label: tSettings('english'), icon: <span className="text-sm">🇬🇧</span> },
                            { value: 'ru', label: tSettings('russian'), icon: <span className="text-sm">🗑️</span> }
                          ]}
                          selectedValue={currentLocale}
                          onChange={(val) => setLocale(val)}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="mcp"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-6"
                    >
                      <div className="space-y-6">
                        <McpSettingsPanel />
                        <McpDashboard />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
