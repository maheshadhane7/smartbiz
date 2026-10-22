'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  changePercent?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple';
  isAiForecast?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  changePercent,
  changeLabel = 'vs last month',
  icon: Icon,
  iconColor = 'indigo',
  isAiForecast,
}: MetricCardProps) {
  const colorMap = {
    indigo: 'bg-zinc-900 border-zinc-700 text-white',
    emerald: 'bg-zinc-900 border-zinc-700 text-emerald-400',
    amber: 'bg-zinc-900 border-zinc-700 text-amber-400',
    rose: 'bg-zinc-900 border-zinc-700 text-rose-400',
    cyan: 'bg-zinc-900 border-zinc-700 text-white',
    purple: 'bg-zinc-900 border-zinc-700 text-white',
  };

  const isPositive = changePercent !== undefined ? changePercent >= 0 : true;

  return (
    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition shadow-sm hover:shadow-md group flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">{title}</span>
            {isAiForecast && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-200 border border-zinc-700 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-white" /> AI
              </span>
            )}
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</h3>
        </div>

        <div className={`p-3 rounded-2xl border ${colorMap[iconColor]} transition-transform group-hover:scale-110 shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
        {changePercent !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded text-[11px] ${
                isPositive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
              {isPositive ? `+${changePercent}%` : `${changePercent}%`}
            </span>
            <span className="text-zinc-400">{changeLabel}</span>
          </div>
        ) : (
          <span className="text-zinc-400">{subtitle || 'Updated real-time'}</span>
        )}
      </div>
    </div>
  );
}
