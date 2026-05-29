import { useState } from 'react';
import { ChevronRight, ShieldCheck, X } from 'lucide-react';
import { Plan } from '../types';

export function PlanSimulator({ currentPlan, onPlanChange }: { currentPlan: Plan, onPlanChange: (plan: Plan | null) => void }) {
  const [open, setOpen] = useState(false);

  const plans: { value: Plan; label: string }[] = [
    { value: 'Iniciante', label: 'FREE' },
    { value: 'Pro', label: 'PRO' },
    { value: 'Elite', label: 'ELITE' },
  ];

  const selected = plans.find(p => p.value === currentPlan);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-fit">
      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="bg-surface/80 backdrop-blur-xl border border-primary/30 px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-2xl hover:border-primary/60 transition-all"
        >
          <ShieldCheck size={14} className="text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
            Admin {selected ? `· ${selected.label}` : ''}
          </span>
          <ChevronRight
            size={12}
            className={`text-primary transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[140px]">
              {plans.map(p => (
                <button
                  key={p.value}
                  onClick={() => { onPlanChange(p.value); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-colors
                    ${currentPlan === p.value
                      ? 'bg-primary/15 text-primary'
                      : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
                    }`}
                >
                  {p.label}
                  {currentPlan === p.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              ))}
              <div className="border-t border-white/5">
                <button
                  onClick={() => { onPlanChange(null); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-error hover:bg-error/5 transition-colors"
                >
                  <X size={12} /> Resetar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
