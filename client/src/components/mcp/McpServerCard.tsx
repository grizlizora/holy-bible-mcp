import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Pause, Play, Download, ShieldCheck, FolderOpen, Pencil, Trash2, Settings, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGlassClasses } from '@/components/ui/glass';
import { McpServerConfig, getPackageSizeFormatted } from './types';
import { useTranslations } from 'next-intl';

interface McpServerCardProps {
  svr: McpServerConfig;
  mcpConfigs: any[];
  pkgDownloadProgress: Record<string, any>;
  dbDownloadStates: Record<string, any>;
  openingFolderId: string | null;
  onToggle: (id: string, enabled: boolean) => void;
  onInstallCode: (id: string) => void;
  onPausePkgDownload: (id: string) => void;
  onResumePkgDownload: (id: string) => void;
  onCancelPkgDownload: (id: string) => void;
  onDeleteCode: (id: string) => void;
  onStartDbDownload: (action: 'start' | 'pause' | 'resume' | 'cancel', mcpId?: string) => void;
  onDeleteDb: (mcpId: string) => void;
  onOpenSettings: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onEditJson: (svr: McpServerConfig) => void;
  onDeleteServer: (id: string) => void;
}

export const McpServerCard: React.FC<McpServerCardProps> = ({
  svr,
  mcpConfigs,
  pkgDownloadProgress,
  dbDownloadStates,
  openingFolderId,
  onToggle,
  onInstallCode,
  onPausePkgDownload,
  onResumePkgDownload,
  onCancelPkgDownload,
  onDeleteCode,
  onStartDbDownload,
  onDeleteDb,
  onOpenSettings,
  onOpenFolder,
  onEditJson,
  onDeleteServer
}) => {
  const t = useTranslations('Settings');

  const getStatusBadge = () => {
    const { status, codeInstalled, dbDownloaded, hasDedicatedDb, enabled } = svr;

    if (pkgDownloadProgress[svr.id] && (pkgDownloadProgress[svr.id].isDownloading || (pkgDownloadProgress[svr.id].progressPercent < 100 && pkgDownloadProgress[svr.id].phase !== 'ready'))) {
      const isPaused = pkgDownloadProgress[svr.id].isPaused;
      return (
        <span className={cn(
          "inline-flex items-center gap-1.5 h-6 px-2.5 text-[11px] font-bold rounded-full border shrink-0",
          isPaused
            ? "bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-300/50 dark:border-slate-700/50"
            : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
        )}>
          {isPaused ? (
            <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
          ) : (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          )}
          <span>{isPaused ? (t('pkg_stage_paused') || 'Пауза') : (t('status_downloading') || 'Скачування...')}</span>
        </span>
      );
    }

    if (!enabled || status === 'disconnected') {
      return (
        <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-[11px] font-bold rounded-full bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700/50 shrink-0">
          <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
          {t('status_disconnected') || 'Вимкнено'}
        </span>
      );
    }

    if (status === 'working') {
      if (hasDedicatedDb) {
        if (codeInstalled && dbDownloaded) {
          return (
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-[11px] font-extrabold rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 shrink-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{t('status_full_local') || 'Working (Local Code & DB)'}</span>
            </span>
          );
        }
        if (!codeInstalled && dbDownloaded) {
          return (
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-[11px] font-extrabold rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/35 shrink-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span>{t('status_hybrid_db') || 'Working (Cloud Code, Local DB)'}</span>
            </span>
          );
        }
      }

      const isLocal = Boolean(svr.codeInstalled || svr.command === 'node' || svr.command === 'python3');
      return (
        <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-[11px] font-extrabold rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 shrink-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{isLocal ? (t('status_working_local') || 'Working (Local)') : (t('status_working_online') || 'Working (NPX)')}</span>
        </span>
      );
    }

    if (status === 'connecting') {
      return (
        <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-[11px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          {t('status_connecting') || 'Connecting...'}
        </span>
      );
    }

    if (status === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-[11px] font-bold rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shrink-0">
          <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0"></span>
          {t('status_error') || 'Error'}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 h-6 px-2.5 text-[11px] font-bold rounded-full bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700/50 shrink-0">
        <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
        {t('status_disconnected') || 'Disconnected'}
      </span>
    );
  };

  const getTierBadge = () => {
    if (!svr.enabled || svr.status !== 'working') return null;

    const config = mcpConfigs?.find(c => c.id === svr.id);
    const settings = svr.settings || config?.settings || [];
    const hasWarmth = svr.hasWarmth ?? settings.some((s: any) => s.id === 'warmth');
    const hasDetail = svr.hasModes ?? settings.some((s: any) => s.id === 'modeKey' || s.id === 'detailLevel');
    const isPrimary = svr.isPrimary ?? (hasWarmth && hasDetail);

    if (isPrimary) {
      return (
        <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25 text-[11px] font-extrabold uppercase tracking-wider shrink-0">
          ✨ {t('tier_full') || 'FULL'}
        </span>
      );
    } else if (hasWarmth && !hasDetail) {
      return (
        <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/25 text-[11px] font-extrabold uppercase tracking-wider shrink-0">
          🔥 {t('tier_warmth_only') || 'WARMTH'}
        </span>
      );
    } else if (!hasWarmth && hasDetail) {
      return (
        <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 text-[11px] font-extrabold uppercase tracking-wider shrink-0">
          ⚡ {t('tier_modes_only') || 'MODES'}
        </span>
      );
    } else if (settings.length > 0) {
      return (
        <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 text-[11px] font-extrabold uppercase tracking-wider shrink-0">
          ⚙️ {t('tier_partial') || 'CUSTOM'}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25 text-[11px] font-extrabold uppercase tracking-wider shrink-0">
          🛠️ {t('tier_tools') || 'TOOLS'}
        </span>
      );
    }
  };

  return (
    <div 
      className={cn(
        getGlassClasses("medium", "xl"),
        "p-4 sm:p-5 rounded-2xl flex flex-col gap-3.5 transition-all duration-300 hover:border-blue-400/40 dark:hover:border-slate-700 hover:shadow-lg shadow-sm"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">{svr.name}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {getStatusBadge()}
          {getTierBadge()}
        </div>
      </div>

      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-medium truncate bg-slate-100/90 dark:bg-slate-950/80 px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-inner w-full">
        {svr.command} {svr.args.join(' ')}
      </div>

      {/* Storage Indicators: Code & DB */}
      <div className="flex items-center gap-2 pt-1.5 px-0.5 border-t border-slate-100 dark:border-slate-800/60 text-xs overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300/80 dark:scrollbar-thumb-slate-700/80 scrollbar-track-transparent scroll-smooth w-full pb-1 touch-pan-x">
        <AnimatePresence mode="wait" initial={false}>
          {Boolean(
            pkgDownloadProgress[svr.id] &&
            (pkgDownloadProgress[svr.id].isDownloading ||
             pkgDownloadProgress[svr.id].isPaused ||
             (pkgDownloadProgress[svr.id].phase === 'ready' && !svr.codeInstalled))
          ) ? (
            <motion.div
              key={`pkg-progress-${svr.id}`}
              initial={{ opacity: 0, scale: 0.96, y: 2 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -2 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex flex-col gap-2 p-3 rounded-2xl border font-bold min-w-[285px] sm:min-w-[310px] shrink-0 shadow-xs backdrop-blur-sm transform-gpu will-change-transform",
                pkgDownloadProgress[svr.id].phase === 'ready'
                  ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-900 dark:text-emerald-100"
                  : "bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/30 text-blue-900 dark:text-blue-100"
              )}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className={cn(
                  "flex items-center gap-1.5 font-extrabold min-w-0",
                  pkgDownloadProgress[svr.id].phase === 'ready' ? "text-emerald-700 dark:text-emerald-300" : "text-blue-700 dark:text-blue-300"
                )}>
                  {pkgDownloadProgress[svr.id].phase === 'ready' ? (
                    <Check size={14} className="text-emerald-500 shrink-0" />
                  ) : pkgDownloadProgress[svr.id].isDownloading ? (
                    <svg className="animate-spin w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <Pause size={13} className="text-blue-500 shrink-0" />
                  )}
                  <span className="truncate font-bold text-[11.5px] sm:text-xs">
                    {pkgDownloadProgress[svr.id].phase === 'ready' || pkgDownloadProgress[svr.id].progressPercent >= 100
                      ? (t('pkg_stage_ready') || 'Перевірено та встановлено')
                      : pkgDownloadProgress[svr.id].isDownloading 
                        ? (
                            pkgDownloadProgress[svr.id].progressPercent < 35
                              ? (t('pkg_stage_repo') || 'Завантаження репозиторію...')
                              : pkgDownloadProgress[svr.id].progressPercent < 70
                                ? (t('pkg_stage_deps') || 'Встановлення node_modules...')
                                : pkgDownloadProgress[svr.id].progressPercent < 88
                                  ? (t('pkg_stage_build') || 'Компіляція TypeScript...')
                                  : (t('pkg_stage_verify') || 'Перевірка цілісності AST...')
                          )
                        : (t('pkg_stage_paused') || t('downloadPaused') || 'Призупинено')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn(
                    "font-mono font-extrabold text-[11px]",
                    pkgDownloadProgress[svr.id].phase === 'ready' ? "text-emerald-700 dark:text-emerald-300" : "text-blue-700 dark:text-blue-300"
                  )}>{pkgDownloadProgress[svr.id].progressPercent}%</span>
                  {pkgDownloadProgress[svr.id].phase !== 'ready' && (
                    <>
                      {pkgDownloadProgress[svr.id].isDownloading ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPausePkgDownload(svr.id);
                          }}
                          className="p-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/35 text-blue-800 dark:text-blue-200 transition-all active:scale-95 cursor-pointer"
                          title="Поставити на паузу"
                        >
                          <Pause size={12} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResumePkgDownload(svr.id);
                          }}
                          className="p-1 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-800 dark:text-emerald-200 transition-all active:scale-95 cursor-pointer"
                          title="Продовжити"
                        >
                          <Play size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelPkgDownload(svr.id);
                        }}
                        className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-700 dark:text-rose-300 transition-all active:scale-95 cursor-pointer"
                        title="Скасувати"
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="w-full bg-blue-950/10 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden border border-blue-500/20">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-150 ease-out shadow-xs transform-gpu will-change-transform",
                    pkgDownloadProgress[svr.id].phase === 'ready'
                      ? "bg-emerald-500"
                      : pkgDownloadProgress[svr.id].isDownloading
                        ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 animate-pulse"
                        : "bg-blue-400 opacity-80"
                  )}
                  style={{ width: `${Math.max(5, pkgDownloadProgress[svr.id].progressPercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10.5px] text-slate-600 dark:text-slate-400 font-mono font-medium leading-none">
                <span>{getPackageSizeFormatted(svr)}</span>
                {pkgDownloadProgress[svr.id].phase === 'ready' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Готово до роботи</span>
                ) : pkgDownloadProgress[svr.id].isDownloading ? (
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{t('offlineCaching') || 'Офлайн кешування'}</span>
                ) : (
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Пауза</span>
                )}
              </div>
            </motion.div>
          ) : svr.codeInstalled ? (
            <motion.div
              key={`pkg-installed-${svr.id}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="group relative inline-flex items-center gap-1.5 h-6 pl-2.5 pr-1.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-[11px] font-extrabold shrink-0 hover:border-blue-500/40 transition-all transform-gpu will-change-transform"
            >
              <Check size={13} className="text-blue-500 shrink-0" />
              <span>{svr.command === 'npx' ? (t('packageNpx') || 'NPX Package (Локально)') : (t('codeLocal') || 'MCP Code (Local)')}</span>
              {getPackageSizeFormatted(svr) ? (
                <>
                  <span className="opacity-40">•</span>
                  <span className="font-mono text-[10px] opacity-80">{getPackageSizeFormatted(svr)}</span>
                </>
              ) : null}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCode(svr.id);
                }}
                className="ml-0.5 p-0.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all cursor-pointer"
                title={t('deleteLocalCode', { size: getPackageSizeFormatted(svr) || 'Local' })}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={`pkg-btn-${svr.id}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0"
            >
              <button
                type="button"
                onClick={() => onInstallCode(svr.id)}
                className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-[11px] shadow-sm hover:shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0 transform-gpu will-change-transform"
              >
                <Download size={13} className="shrink-0" />
                <span>{svr.command === 'npx' ? (t('downloadPackage') || 'Скачати пакет') : (t('installCode') || 'Скачати код')}</span>
                {getPackageSizeFormatted(svr) ? (
                  <>
                    <span className="opacity-60">•</span>
                    <span className="font-mono text-[10px] opacity-90">{getPackageSizeFormatted(svr)}</span>
                  </>
                ) : null}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {Boolean(svr.hasDedicatedDb) && (
          <AnimatePresence mode="wait" initial={false}>
            {(svr.dbDownloaded && svr.dbSizeBytes && svr.dbSizeBytes > 1_000_000) ? (
              <motion.div
                key={`db-installed-${svr.id}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="group relative inline-flex items-center gap-1.5 h-6 pl-2.5 pr-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-extrabold shrink-0 hover:border-emerald-500/40 transition-all transform-gpu will-change-transform"
              >
                <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                <span>{t('dbReady') || 'Database (Local)'}</span>
                {svr.dbSizeFormatted ? (
                  <>
                    <span className="opacity-40">•</span>
                    <span className="font-mono text-[10px] opacity-80">{svr.dbSizeFormatted}</span>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDb(svr.id);
                  }}
                  className="ml-0.5 p-0.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all cursor-pointer"
                  title={t('deleteLocalDb', { size: svr.dbSizeFormatted || 'DB' })}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </motion.div>
            ) : (() => {
              const dl = dbDownloadStates[svr.id] || (
                (svr as any).dbTempSizeBytes && (svr as any).dbTempSizeBytes > 0
                  ? {
                      isDownloading: true,
                      isPaused: false,
                      progressPercent: Math.min(99, Math.round(((svr as any).dbTempSizeBytes / 5881192448) * 100)),
                      downloadedBytes: (svr as any).dbTempSizeBytes,
                      totalBytes: 5881192448,
                      speedBytesPerSec: 0,
                      isComplete: false,
                      error: null
                    }
                  : null
              );

              if (!dl || (!dl.isDownloading && !dl.isPaused && dl.progressPercent === 0)) {
                return (
                  <motion.div
                    key={`db-btn-${svr.id}`}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="shrink-0"
                  >
                    <button
                      type="button"
                      onClick={() => onStartDbDownload('start', svr.id)}
                      className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-[11px] shadow-sm hover:shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0 transform-gpu will-change-transform"
                    >
                      <Download size={13} className="shrink-0" />
                      <span>{t('downloadDb') || 'Скачати базу'}</span>
                      {svr.dbSizeFormatted ? (
                        <>
                          <span className="opacity-60">•</span>
                          <span className="font-mono text-[10px] opacity-90">{svr.dbSizeFormatted}</span>
                        </>
                      ) : null}
                    </button>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={`db-progress-${svr.id}`}
                  initial={{ opacity: 0, scale: 0.96, y: 2 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -2 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-2 p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-100 font-bold min-w-[285px] sm:min-w-[310px] shrink-0 shadow-xs backdrop-blur-sm transform-gpu will-change-transform"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 font-extrabold text-amber-700 dark:text-amber-300 min-w-0">
                      {dl.isDownloading ? (
                        <svg className="animate-spin w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      ) : (
                        <Pause size={13} className="text-amber-500 shrink-0" />
                      )}
                      <span className="truncate font-bold text-[11.5px] sm:text-xs">
                        {dl.isDownloading ? (t('downloadingDb') || 'Скачування...') : (t('downloadPaused') || 'Призупинено')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-amber-700 dark:text-amber-300 font-extrabold text-[11px]">{dl.progressPercent}%</span>
                      {dl.isDownloading ? (
                        <button
                          type="button"
                          onClick={() => onStartDbDownload('pause', svr.id)}
                          className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-800 dark:text-amber-200 transition-all active:scale-95 cursor-pointer"
                          title="Поставити на паузу"
                        >
                          <Pause size={12} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onStartDbDownload('resume', svr.id)}
                          className="p-1 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-800 dark:text-emerald-200 transition-all active:scale-95 cursor-pointer"
                          title="Продовжити скачування"
                        >
                          <Play size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onStartDbDownload('cancel', svr.id)}
                        className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-700 dark:text-rose-300 transition-all active:scale-95 cursor-pointer"
                        title="Скасувати скачування"
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-amber-950/10 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden border border-amber-500/20">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 transition-all duration-150 ease-out shadow-xs transform-gpu will-change-transform"
                      style={{ width: `${Math.max(5, dl.progressPercent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-slate-600 dark:text-slate-400 font-mono font-medium leading-none">
                    <span>
                      {dl.totalBytes > 0 ? (
                        `${(dl.downloadedBytes / (1024 * 1024)).toFixed(0)} MB / ${(dl.totalBytes / (1024 * 1024)).toFixed(0)} MB`
                      ) : (
                        svr.dbSizeFormatted || 'Database'
                      )}
                    </span>
                    <span>
                      {(dl.smoothSpeedBytesPerSec || dl.speedBytesPerSec) > 0 && dl.isDownloading ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          {`${((dl.smoothSpeedBytesPerSec || dl.speedBytesPerSec) / (1024 * 1024)).toFixed(1)} MB/s`}
                          {dl.etaFormatted ? ` • ~${dl.etaFormatted}` : ''}
                        </span>
                      ) : dl.isDownloading ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{t('downloading') || 'Завантаження...'}</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">Пауза</span>
                      )}
                    </span>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            role="switch"
            aria-checked={svr.enabled}
            disabled={Boolean((svr.requiresLocalCode && !svr.codeInstalled && svr.command === 'npx') || (pkgDownloadProgress[svr.id] && (pkgDownloadProgress[svr.id].isDownloading || (pkgDownloadProgress[svr.id].progressPercent < 100 && pkgDownloadProgress[svr.id].phase !== 'ready'))))}
            onClick={() => ((svr.requiresLocalCode && !svr.codeInstalled && svr.command === 'npx') || (pkgDownloadProgress[svr.id]?.isDownloading)) ? undefined : onToggle(svr.id, svr.enabled)}
            title={(svr.requiresLocalCode && !svr.codeInstalled && svr.command === 'npx') ? (t('downloadPackage') || 'Спочатку скачайте пакет') : undefined}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 p-0.5 border shadow-inner select-none",
              ((svr.requiresLocalCode && !svr.codeInstalled && svr.command === 'npx') || (pkgDownloadProgress[svr.id] && (pkgDownloadProgress[svr.id].isDownloading || (pkgDownloadProgress[svr.id].progressPercent < 100 && pkgDownloadProgress[svr.id].phase !== 'ready'))))
                ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 justify-start opacity-40 cursor-not-allowed'
                : svr.enabled 
                  ? 'bg-blue-600 dark:bg-blue-500 border-blue-700 dark:border-blue-400 justify-end cursor-pointer' 
                  : 'bg-slate-300 dark:bg-slate-700 border-slate-400/50 dark:border-slate-600 justify-start cursor-pointer'
            )}
          >
            <span className="inline-block h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300" />
          </button>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {pkgDownloadProgress[svr.id] && (pkgDownloadProgress[svr.id].isDownloading || (pkgDownloadProgress[svr.id].progressPercent < 100 && pkgDownloadProgress[svr.id].phase !== 'ready'))
              ? (pkgDownloadProgress[svr.id].isPaused ? (t('pkg_stage_paused') || 'Пауза') : (t('status_downloading') || 'Скачування...'))
              : (svr.requiresLocalCode && !svr.codeInstalled && svr.command === 'npx')
                ? (t('downloadPackage') || 'Скачати пакет')
                : svr.enabled ? (t('enabled') || 'Увімкнено') : (t('disabled') || 'Вимкнено')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings(svr.id);
            }}
            className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            title={t('settings') || "Налаштування"}
          >
            <Settings size={16} />
          </button>

          {Boolean(svr.codeInstalled || svr.dbDownloaded) && (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFolder(svr.id);
              }}
              className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
              title={t('openFolder') || "Відкрити папку з файлами"}
            >
              <FolderOpen size={16} className={cn(openingFolderId === svr.id && "animate-bounce text-amber-500")} />
            </button>
          )}

          <button 
            onClick={() => onEditJson(svr)}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            title={t('editMcp') || "Редагувати JSON"}
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={() => onDeleteServer(svr.id)}
            className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            title={t('delete') || "Видалити"}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
