import React from 'react';
import { X, FileText, Video, Music, FileCode, Loader2 } from 'lucide-react';
import { Attachment, UploadProgress } from '@/hooks/useFileUpload';
import { formatDuration } from '@/lib/media';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

interface AttachmentDockProps {
  attachments: Attachment[];
  uploads: Map<string, UploadProgress>;
  onRemoveAttachment: (id: string) => void;
  onCancelUpload: (tempId: string) => void;
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function AttachmentDock({ attachments, uploads, onRemoveAttachment, onCancelUpload }: AttachmentDockProps) {
  const tDock = useTranslations('AttachmentDock');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (attachments.length === 0 && uploads.size === 0) return null;

  const totalCount = attachments.length + uploads.size;

  const getFileIcon = (filename: string, type: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (type === 'image') return null;
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
      return <Video className="w-4 h-4 text-purple-400" />;
    }
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      return <Music className="w-4 h-4 text-amber-400" />;
    }
    if (['js', 'ts', 'py', 'cpp', 'html', 'css', 'json', 'jsx', 'tsx'].includes(ext)) {
      return <FileCode className="w-4 h-4 text-emerald-400" />;
    }
    return <FileText className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div 
      className={`w-full flex flex-col gap-2 p-2.5 rounded-2xl border transition-all ${
        isDark 
          ? 'bg-slate-900/90 border-slate-700/60 text-slate-100' 
          : 'bg-slate-100/90 border-slate-300/80 text-slate-900'
      }`}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {tDock('title')} ({totalCount})
          </span>
        </div>
        <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {tDock('scrollRight')}
        </span>
      </div>

      {/* Horizontal Carousel Track */}
      <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-500/40 scrollbar-track-transparent pb-1 flex items-center gap-2 flex-nowrap scroll-smooth">
        <AnimatePresence>
          {attachments.map(att => (
            <motion.div
              key={att.id}
              initial={{ opacity: 0, scale: 0.9, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              className={`flex-shrink-0 min-w-[180px] max-w-[220px] h-[48px] relative flex items-center gap-2.5 px-3 py-1.5 border rounded-xl shadow-sm transition-all group ${
                isDark 
                  ? 'bg-slate-800/95 border-slate-700 text-slate-100 hover:border-blue-500/60' 
                  : 'bg-white border-slate-300 text-slate-900 hover:border-blue-500/60'
              }`}
            >
              {/* Image Preview or File Icon */}
              {att.type === 'image' ? (
                <div className="w-8 h-8 flex-shrink-0 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-black/10">
                  <img src={att.url} alt={att.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              ) : (
                <div className={`w-8 h-8 flex-shrink-0 rounded-lg border flex items-center justify-center ${
                  isDark ? 'bg-slate-700/60 border-slate-600' : 'bg-slate-100 border-slate-200'
                }`}>
                  {getFileIcon(att.filename, att.type)}
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="flex flex-col min-w-0 flex-1 pr-6">
                <span className={`text-[12px] font-bold truncate leading-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  {att.filename}
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {att.duration ? formatDuration(att.duration) : formatFileSize(att.size)} • {att.filename.includes('.') ? att.filename.split('.').pop()?.toUpperCase() : 'FILE'}
                </span>
              </div>
              
              {/* Clear Button on the Right */}
              <button
                onClick={() => onRemoveAttachment(att.id)}
                title={tDock('deleteFile')}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/20' 
                    : 'text-slate-400 hover:text-red-600 hover:bg-red-500/10'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}

          {/* Currently uploading files */}
          {Array.from(uploads.entries()).map(([tempId, upload]) => (
            <motion.div
              key={tempId}
              initial={{ opacity: 0, scale: 0.9, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              className={`flex-shrink-0 min-w-[180px] max-w-[220px] h-[48px] relative flex items-center gap-2.5 px-3 py-1.5 border border-blue-500/60 rounded-xl shadow-sm overflow-hidden ${
                isDark ? 'bg-slate-800/95 text-slate-100' : 'bg-white text-slate-900'
              }`}
            >
              <div 
                className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300"
                style={{ width: `${upload.progress}%` }}
              />
              
              <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center">
                 <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
              
              <div className="flex flex-col min-w-0 flex-1 pr-6">
                <span className={`text-[12px] font-bold truncate leading-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  {upload.file.name}
                </span>
                <span className="text-[10px] font-bold text-blue-500">
                  {upload.error ? upload.error : upload.progress >= 100 ? tDock('processing') : `${upload.progress}%`}
                </span>
              </div>
              
              <button
                onClick={() => onCancelUpload(tempId)}
                title={tDock('cancelUpload')}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/20' 
                    : 'text-slate-400 hover:text-red-600 hover:bg-red-500/10'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
