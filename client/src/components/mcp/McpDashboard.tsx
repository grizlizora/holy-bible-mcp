import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { GlassBox, getGlassClasses } from '@/components/ui/glass';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, Plus, Sparkles, Check, Activity, ShieldCheck, Layers, Server, Settings, X } from 'lucide-react';

export interface McpServerConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  enabled: boolean;
  status?: 'disconnected' | 'connecting' | 'working' | 'error';
}

export function McpDashboard() {
  const t = useTranslations('Settings');
  const [mounted, setMounted] = useState(false);
  const [servers, setServers] = useState<McpServerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settingsModalId, setSettingsModalId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [editJson, setEditJson] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const mcpConfigs = useSettingsStore(s => s.mcpConfigs);
  const activeWarmthMcpId = useSettingsStore(s => s.activeWarmthMcpId);
  const setActiveWarmthMcpId = useSettingsStore(s => s.setActiveWarmthMcpId);
  const activeModeMcpId = useSettingsStore(s => s.activeModeMcpId);
  const setActiveModeMcpId = useSettingsStore(s => s.setActiveModeMcpId);
  const mcpSettings = useSettingsStore(s => s.mcpSettings);
  const setMcpSetting = useSettingsStore(s => s.setMcpSetting);

  useEffect(() => {
    let isMounted = true;
    let timerId: NodeJS.Timeout;

    const pollServers = async () => {
      if (!isMounted) return;
      if (document.hidden) {
        if (isMounted) {
          timerId = setTimeout(pollServers, 5000);
        }
        return;
      }
      try {
        const res = await fetch('/api/mcp');
        if (res.ok && isMounted) {
          const data = await res.json();
          setServers(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) {
          setLoading(false);
          timerId = setTimeout(pollServers, 5000);
        }
      }
    };

    pollServers();

    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, []);

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    // Optimistic UI
    const previousServers = [...servers];
    setServers(s => s.map(svr => svr.id === id ? { ...svr, enabled: !currentEnabled, status: !currentEnabled ? 'connecting' : 'disconnected' } : svr));
    
    try {
      const res = await fetch('/api/mcp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !currentEnabled })
      });
      if (!res.ok) throw new Error("Failed to toggle");
    } catch (e) {
      console.error(e);
      setServers(previousServers); // Revert on failure
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this MCP?")) return;
    await fetch(`/api/mcp?id=${id}`, { method: 'DELETE' });
    // Next poll will clear it, or we can optimistcally remove it:
    setServers(s => s.filter(svr => svr.id !== id));
  };

  const handleSaveJson = async () => {
    try {
      const parsed = JSON.parse(editJson);
      if (isAdding) {
        await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
      } else {
        await fetch('/api/mcp', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...parsed })
        });
      }
      setEditingId(null);
      setIsAdding(false);
    } catch (e: any) {
      alert("Invalid JSON: " + e.message);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'working': return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {t('status_working')}
        </span>
      );
      case 'connecting': return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          {t('status_connecting')}
        </span>
      );
      case 'error': return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shrink-0">
          <span className="h-2 w-2 rounded-full bg-rose-500"></span>
          {t('status_error')}
        </span>
      );
      default: return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700/50 shrink-0">
          <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500"></span>
          {t('status_disconnected')}
        </span>
      );
    }
  };

  const getTierBadge = (svrId: string, status?: string) => {
    if (status !== 'working') return null;

    const config = mcpConfigs?.find(c => c.id === svrId);
    if (!config) return null;

    const settings = config.settings || [];
    const hasWarmth = settings.some((s: any) => s.id === 'warmth');
    const hasDetail = settings.some((s: any) => s.id === 'modeKey' || s.id === 'detailLevel');
    const isPrimary = config.isPrimary || (hasWarmth && hasDetail);

    if (isPrimary) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold shadow-md shadow-blue-500/20 uppercase tracking-wider border border-blue-400/30">
          <Sparkles size={11} className="text-amber-300" />
          {t('tier_full')}
        </span>
      );
    } else if (hasWarmth && !hasDetail) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[10px] font-extrabold uppercase tracking-wider">
          🔥 {t('tier_warmth_only')}
        </span>
      );
    } else if (!hasWarmth && hasDetail) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[10px] font-extrabold uppercase tracking-wider">
          ⚡ {t('tier_modes_only')}
        </span>
      );
    } else if (settings.length > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-[10px] font-extrabold uppercase tracking-wider">
          {t('tier_partial')}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700/50 text-[10px] font-extrabold uppercase tracking-wider">
          {t('tier_passive')}
        </span>
      );
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Server size={15} className="text-blue-500" />
          {t('mcpTitle')}
        </h3>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingId('new');
            setEditJson(JSON.stringify({
              id: "new-mcp-" + Date.now(),
              name: "New MCP",
              command: "npx",
              args: ["-y", "some-mcp-package"],
              enabled: false
            }, null, 2));
          }}
          className="px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-md shadow-blue-500/25 active:scale-95 cursor-pointer flex items-center gap-1"
        >
          <Plus size={14} />
          {t('addMcp')}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {servers.map((svr) => {
          return (
          <div 
            key={svr.id} 
            className={cn(
              getGlassClasses("medium", "xl"),
              "p-4 sm:p-5 rounded-2xl flex flex-col gap-3.5 transition-all duration-300 hover:border-blue-400/40 dark:hover:border-slate-700 hover:shadow-lg shadow-sm"
            )}
          >
            {/* Top Row: Title on Left, Badges on Right in 1 row */}
            <div className="flex items-center justify-between gap-3">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">{svr.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {getStatusBadge(svr.status)}
                {getTierBadge(svr.id, svr.status)}
              </div>
            </div>

            {/* Middle Row: Code block command */}
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono break-all bg-slate-100/90 dark:bg-slate-950/80 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-inner">
              {svr.command} {svr.args.join(' ')}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <button 
                  type="button"
                  role="switch"
                  aria-checked={svr.enabled}
                  onClick={() => handleToggle(svr.id, svr.enabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 cursor-pointer p-0.5 border shadow-inner select-none",
                    svr.enabled 
                      ? 'bg-blue-600 dark:bg-blue-500 border-blue-700 dark:border-blue-400 justify-end' 
                      : 'bg-slate-300 dark:bg-slate-700 border-slate-400/50 dark:border-slate-600 justify-start'
                  )}
                >
                  <span className="inline-block h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300" />
                </button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {svr.enabled ? (t('enabled') || 'Увімкнено') : (t('disabled') || 'Вимкнено')}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsModalId(svr.id);
                  }}
                  className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                  title={t('settings') || "Налаштування"}
                >
                  <Settings size={16} />
                </button>
                <button 
                  onClick={() => {
                    setEditingId(svr.id);
                    setIsAdding(false);
                    const { status, ...cfg } = svr;
                    setEditJson(JSON.stringify(cfg, null, 2));
                  }}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                  title={t('editMcp') || "Редагувати JSON"}
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(svr.id)}
                  className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                  title={t('delete') || "Видалити"}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        );
        })}
      </div>

      <AnimatePresence>
        {editingId && (
          <motion.div 
            key="edit-modal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isAdding ? t('addMcp') : t('editMcp')}
              </h3>
              <textarea 
                value={editJson}
                onChange={e => setEditJson(e.target.value)}
                className="w-full h-64 bg-slate-950 text-emerald-400 font-mono text-sm p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                spellCheck={false}
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={handleSaveJson}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mounted && createPortal(
        <AnimatePresence>
          {settingsModalId && (
            <motion.div 
              key="mcp-settings-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
              onClick={() => setSettingsModalId(null)}
            >
              {(() => {
                const svr = servers.find(s => s.id === settingsModalId);
                const config = mcpConfigs?.find(c => c.id === settingsModalId);
                const hasWarmth = config?.settings?.some((s: any) => s.id === 'warmth');
                const hasDetail = config?.settings?.some((s: any) => s.id === 'modeKey' || s.id === 'detailLevel');
                
                const isWarmthActive = activeWarmthMcpId === svr?.id;
                const isModeActive = activeModeMcpId === svr?.id;
                const anotherWarmthIsActive = Boolean(activeWarmthMcpId && activeWarmthMcpId !== svr?.id);
                const anotherModeIsActive = Boolean(activeModeMcpId && activeModeMcpId !== svr?.id);
                
                const showMetrics = mcpSettings[settingsModalId]?.showMetrics !== false;
                
                return (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl z-[10000] flex flex-col gap-6"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 truncate">
                        <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                          <Settings size={20} />
                        </div>
                        <div className="flex flex-col truncate">
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{svr?.name || settingsModalId}</h3>
                          <span className="text-xs text-slate-400 dark:text-slate-500">Налаштування MCP сервера</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettingsModalId(null)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    
                    {/* Settings Content */}
                    <div className="flex flex-col gap-4">
                      {/* showMetrics */}
                      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-sm">
                        <div className="flex flex-col gap-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('mcpMetricsTitle')}</span>
                            {showMetrics ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60">Увімкнено</span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-slate-600/60">Вимкнено</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('mcpMetricsDesc')}</span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={showMetrics}
                          onClick={() => setMcpSetting(settingsModalId, 'showMetrics', !showMetrics)}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 cursor-pointer p-0.5 border ${
                            showMetrics 
                              ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-700 dark:border-indigo-400 justify-end' 
                              : 'bg-slate-300 dark:bg-slate-700 border-slate-400/50 dark:border-slate-600 justify-start'
                          }`}
                        >
                          <span className="inline-block h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300" />
                        </button>
                      </div>
                      
                      {/* UI Warmth */}
                      {hasWarmth && (
                        <div className="flex flex-col gap-1.5">
                          <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl border shadow-sm transition-colors ${
                            anotherWarmthIsActive 
                              ? 'opacity-60 bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/60' 
                              : 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80'
                          }`}>
                            <div className="flex flex-col gap-1 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('mcpUiWarmthTitle')}</span>
                                {isWarmthActive ? (
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60">Увімкнено</span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-slate-600/60">Вимкнено</span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('mcpUiWarmthDesc')}</span>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              disabled={anotherWarmthIsActive}
                              aria-checked={isWarmthActive}
                              onClick={() => {
                                if (anotherWarmthIsActive) return;
                                setActiveWarmthMcpId(isWarmthActive ? null : settingsModalId);
                              }}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 cursor-pointer p-0.5 border ${
                                anotherWarmthIsActive
                                  ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 cursor-not-allowed justify-start'
                                  : isWarmthActive
                                  ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-700 dark:border-indigo-400 justify-end'
                                  : 'bg-slate-300 dark:bg-slate-700 border-slate-400/50 dark:border-slate-600 justify-start'
                              }`}
                            >
                              <span className="inline-block h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300" />
                            </button>
                          </div>
                          {anotherWarmthIsActive && (
                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 px-2 flex items-center gap-1">
                              {t('mcpAnotherActiveWarn')}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* UI Modes */}
                      {hasDetail && (
                        <div className="flex flex-col gap-1.5">
                          <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl border shadow-sm transition-colors ${
                            anotherModeIsActive 
                              ? 'opacity-60 bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/60' 
                              : 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80'
                          }`}>
                            <div className="flex flex-col gap-1 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('mcpUiModesTitle')}</span>
                                {isModeActive ? (
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60">Увімкнено</span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-slate-600/60">Вимкнено</span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('mcpUiModesDesc')}</span>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              disabled={anotherModeIsActive}
                              aria-checked={isModeActive}
                              onClick={() => {
                                if (anotherModeIsActive) return;
                                setActiveModeMcpId(isModeActive ? null : settingsModalId);
                              }}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 cursor-pointer p-0.5 border ${
                                anotherModeIsActive
                                  ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 cursor-not-allowed justify-start'
                                  : isModeActive
                                  ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-700 dark:border-indigo-400 justify-end'
                                  : 'bg-slate-300 dark:bg-slate-700 border-slate-400/50 dark:border-slate-600 justify-start'
                              }`}
                            >
                              <span className="inline-block h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300" />
                            </button>
                          </div>
                          {anotherModeIsActive && (
                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 px-2 flex items-center gap-1">
                              {t('mcpAnotherActiveWarn')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Footer */}
                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={() => setSettingsModalId(null)} 
                        className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        {t('close')}
                      </button>
                    </div>
                  </motion.div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
