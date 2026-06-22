import type { ReactNode } from 'react';
import { TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardMetricCardProps {
  label: string;
  value: string;
  subValue: string;
  icon: ReactNode;
  trend?: 'up' | 'down';
  onClick?: () => void;
}

export function DashboardMetricCard({ label, value, subValue, icon, trend, onClick }: DashboardMetricCardProps) {
  return (
    <motion.div
      whileHover={onClick ? { y: -5, scale: 1.02 } : {}}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        onClick();
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-surface p-6 md:p-8 rounded-[32px] border border-white/5 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700">
        {icon}
      </div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
          <div className="p-2 rounded-xl bg-white/5 text-text-muted group-hover:text-primary group-hover:bg-primary/10 transition-all duration-500">
            {icon}
          </div>
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-black tracking-tight group-hover:translate-x-1 transition-transform duration-500">{value}</div>
          <div className={`mt-1 text-xs font-bold flex items-center gap-1 ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-text-muted'}`}>
            {trend === 'up' && <TrendingUp size={12} />}
            {subValue}
          </div>
        </div>
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
