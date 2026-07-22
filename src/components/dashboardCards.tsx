import type { ReactNode } from 'react';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardMetricCardProps {
  label: string;
  value: string;
  subValue: string;
  icon: ReactNode;
  trend?: 'up' | 'down';
  onClick?: () => void;
  actionLabel?: string;
}

export function DashboardMetricCard({ label, value, subValue, icon, trend, onClick, actionLabel }: DashboardMetricCardProps) {
  return (
    <motion.div
      whileHover={onClick ? { y: -4, scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.985 } : {}}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        onClick();
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick && actionLabel ? `${actionLabel}: ${value}` : undefined}
      className={`bg-surface min-h-[132px] sm:min-h-[166px] lg:min-h-[210px] p-3 sm:p-5 md:p-6 lg:p-8 rounded-[20px] sm:rounded-[28px] lg:rounded-[32px] border transition-all duration-300 group relative overflow-hidden outline-none ${
        onClick
          ? 'cursor-pointer border-white/10 hover:border-primary/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 active:border-primary/50'
          : 'border-white/5'
      }`}
    >
      <div className="absolute -right-4 -bottom-4 opacity-0 sm:opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700">
        {icon}
      </div>
      <div className="relative z-10 flex h-full min-h-[108px] sm:min-h-[128px] lg:min-h-[160px] flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-text-muted text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.12em] sm:tracking-[0.16em] lg:tracking-[0.2em]">{label}</span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-white/5 text-text-muted group-hover:text-primary group-hover:bg-primary/10 transition-all duration-500 shrink-0">
            {icon}
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4 lg:mt-5 min-w-0">
          <div className="text-base sm:text-xl lg:text-3xl font-black tracking-tight leading-tight truncate sm:line-clamp-2 sm:whitespace-normal group-hover:translate-x-1 transition-transform duration-500">{value}</div>
          <div className={`mt-1 text-[9px] sm:text-xs font-bold flex items-center gap-1 leading-snug line-clamp-1 sm:line-clamp-2 ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-text-muted'}`}>
            {trend === 'up' && <TrendingUp size={12} />}
            {subValue}
          </div>
        </div>
        {onClick && actionLabel && (
          <div className="mt-auto pt-2 sm:pt-4 lg:pt-5">
            <div className="hidden sm:block h-px bg-white/[0.07] group-hover:bg-primary/20 transition-colors" />
            <div className="flex items-center justify-between gap-2 pt-1 sm:pt-3 lg:pt-4">
              <span className="min-w-0 truncate text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.14em] lg:tracking-[0.16em] text-primary">{actionLabel}</span>
              <span className="w-7 h-7 lg:w-8 lg:h-8 rounded-full border border-primary/20 bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white group-hover:translate-x-0.5 transition-all">
                <ArrowRight size={13} strokeWidth={2.8} />
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function QuickAction({ icon, label, color }: { icon: ReactNode, label: string, color: string }) {
  return (
    <button className="flex items-center gap-4 p-6 bg-surface rounded-[24px] border border-white/5 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden">
      <div className={`p-3 rounded-xl ${color} text-text-primary group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-black/20`}>
        {icon}
      </div>
      <span className="font-black text-xs uppercase tracking-widest">{label}</span>
      <div className="absolute -right-2 -bottom-2 opacity-0 group-hover:opacity-5 transition-opacity duration-500">
        {icon}
      </div>
    </button>
  );
}
