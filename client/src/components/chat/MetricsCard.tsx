import React from 'react';
import * as LucideIcons from 'lucide-react';
import { GlassBox } from "@/components/ui/glass";
import { useLocale } from 'next-intl';

interface MetricItem {
  id: string;
  type: 'score' | 'percentage' | 'badge' | string;
  label?: Record<string, string> | string;
  value?: any;
  val?: any;
  max?: number;
  iconName?: string;
}

interface MetricsCardProps {
  metrics: MetricItem[];
}

export function MetricsCard({ metrics }: MetricsCardProps) {
  const locale = useLocale();
  if (!metrics || metrics.length === 0) return null;

  const isCyrillic = /[а-яєіїґ]/i.test(JSON.stringify(metrics));
  const activeLangKey = isCyrillic ? 'uk' : (locale || 'uk').slice(0, 2);

  return (
    <GlassBox variant="medium" intensity="md" className="mt-3 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl shadow-sm overflow-hidden transition-all duration-200">
      {metrics.map((metric, index) => {
        const langKey = activeLangKey;
        const labelText = typeof metric.label === 'object' 
          ? (metric.label[langKey] || metric.label.uk || metric.label.en || metric.id) 
          : (metric.label || metric.id);
        const valRaw = metric.value ?? metric.val;
        const displayValue = (typeof valRaw === 'object' && valRaw !== null)
          ? (valRaw[langKey] || valRaw.uk || valRaw.en || String(valRaw))
          : String(valRaw ?? '');
        const hasSeparator = index < metrics.length - 1;

        let content = null;

        if (metric.type === 'score') {
          const score = Number(valRaw) || 0;
          const max = metric.max || 100;
          const percentage = Math.min(100, Math.max(0, (score / max) * 100));
          
          const isPositiveMetric = /accuracy|confidence|empathy|точніс|емпаті|душевн/i.test(metric.id + ' ' + labelText);
          
          const scoreColor = isPositiveMetric
            ? (percentage > 75 ? 'text-emerald-500 dark:text-emerald-400' : percentage > 40 ? 'text-amber-500 dark:text-amber-400' : 'text-blue-500 dark:text-blue-400')
            : (percentage > 80 ? 'text-red-500 dark:text-red-400' : percentage > 50 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400');

          const scoreBg = isPositiveMetric
            ? (percentage > 75 ? 'bg-emerald-500' : percentage > 40 ? 'bg-amber-500' : 'bg-blue-500')
            : (percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-amber-500' : 'bg-emerald-500');

          const MetricIcon = (LucideIcons as any)[metric.iconName || 'Activity'] || LucideIcons.Activity;

          content = (
            <div className="flex items-center gap-3 flex-1 min-w-[150px]">
              <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 ${scoreColor}`}>
                <MetricIcon size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {labelText}
                  </span>
                  <span className={`text-sm font-bold ${scoreColor}`}>
                    {score}/{max}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${percentage}%` }}
                    className={`h-full ${scoreBg} rounded-full transition-all duration-300 ease-out`}
                  />
                </div>
              </div>
            </div>
          );
        } else if (metric.type === 'percentage') {
          const MetricIcon = (LucideIcons as any)[metric.iconName || 'ShieldCheck'] || LucideIcons.ShieldCheck;
          content = (
            <div className="flex items-center gap-2 flex-1 sm:justify-center">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400">
                <MetricIcon size={18} />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs break-words font-bold text-slate-400 uppercase tracking-widest">{labelText}</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{displayValue}</span>
              </div>
            </div>
          );
        } else if (metric.type === 'badge') {
          const MetricIcon = (LucideIcons as any)[metric.iconName || 'Zap'] || LucideIcons.Zap;
          content = (
            <div className="flex items-center gap-2 flex-1 sm:justify-center">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400">
                <MetricIcon size={18} />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs break-words font-bold text-slate-400 uppercase tracking-widest">{labelText}</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{displayValue}</span>
              </div>
            </div>
          );
        } else {
          const MetricIcon = (LucideIcons as any)[metric.iconName || 'Info'] || LucideIcons.Info;
          content = (
            <div className="flex items-center gap-2 flex-1 sm:justify-center">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                <MetricIcon size={18} />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs break-words font-bold text-slate-400 uppercase tracking-widest">{labelText}</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{displayValue}</span>
              </div>
            </div>
          );
        }

        return (
          <React.Fragment key={metric.id || index}>
            {content}
            {hasSeparator && <div className="hidden sm:block w-px h-10 bg-slate-200 dark:bg-slate-700/50"></div>}
          </React.Fragment>
        );
      })}
    </GlassBox>
  );
}
