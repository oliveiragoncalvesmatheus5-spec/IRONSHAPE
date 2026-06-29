import type { ReactNode } from 'react';
import { motion } from 'motion/react';

interface NavItemProps {
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}

export function NavItem({ icon, active, onClick, label }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 transition-all duration-500 group relative flex-1 md:flex-none ${active ? 'text-primary' : 'text-text-muted hover:text-text-primary'}`}
    >
      <div className={`p-2.5 md:p-3 rounded-2xl transition-all duration-500 relative ${active ? 'bg-primary/10 shadow-[0_0_20px_rgba(255,106,0,0.1)]' : 'group-hover:bg-white/5'}`}>
        {icon}
        {active && (
          <motion.div
            layoutId="nav-glow"
            className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10"
          />
        )}
      </div>
      <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.15em] transition-all duration-500 ${active ? 'opacity-100' : 'opacity-50'}`}>
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute -right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full hidden md:block"
        />
      )}
    </button>
  );
}

export function MobileNavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-[5px] relative h-full"
      style={{ minHeight: 44 }}
    >
      {active && (
        <span
          className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
          style={{ width: 28, height: 3, background: 'var(--color-primary)' }}
        />
      )}
      <span style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>{icon}</span>
      <span
        className="text-[11px] leading-none"
        style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: active ? 700 : 500 }}
      >
        {label}
      </span>
    </button>
  );
}
