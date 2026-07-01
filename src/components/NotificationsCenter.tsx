import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BellRing, CheckCircle2, ChevronRight, Dumbbell, Flame, Gift, Loader2, Target, Trophy, Utensils, X } from 'lucide-react';
import { AppNotification } from '../types';
import { notificationService } from '../services/notificationService';

const notificationIcons: Record<string, ReactNode> = {
  onboarding: <Target size={18} />,
  workout: <Dumbbell size={18} />,
  nutrition: <Utensils size={18} />,
  progress: <Target size={18} />,
  streak: <Flame size={18} />,
  achievement: <Trophy size={18} />,
  premium: <Gift size={18} />,
  challenge: <Trophy size={18} />,
  return: <BellRing size={18} />,
  manual: <BellRing size={18} />,
};

function formatNotificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Agora';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function NotificationsCenter({ userId, onOpenAction }: {
  userId: string;
  onOpenAction: (action: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const unreadCount = useMemo(() => notifications.filter(item => item.status === 'unread').length, [notifications]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      setNotifications(await notificationService.getUserNotifications(userId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const onRefresh = () => loadNotifications();
    window.addEventListener('ironshape:notifications-refresh', onRefresh);
    return () => window.removeEventListener('ironshape:notifications-refresh', onRefresh);
  }, [userId]);

  const openNotification = async (notification: AppNotification) => {
    if (notification.status === 'unread') {
      await notificationService.markAsRead(userId, notification.id);
      setNotifications(current => current.map(item => item.id === notification.id ? { ...item, status: 'read', read_at: new Date().toISOString() } : item));
    }
    setOpen(false);
    onOpenAction(notification.action);
  };

  const markAll = async () => {
    await notificationService.markAllAsRead(userId);
    setNotifications(current => current.map(item => ({ ...item, status: 'read' })));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ''}`}
        className="fixed z-[55] w-11 h-11 rounded-2xl border border-white/10 bg-surface/90 text-text-primary shadow-xl shadow-black/10 backdrop-blur-xl flex items-center justify-center active:scale-95 transition-all md:right-8"
        style={{ top: 'calc(12px + env(safe-area-inset-top))', right: 'calc(120px + env(safe-area-inset-right))' }}
      >
        <BellRing size={20} className={unreadCount ? 'text-primary' : 'text-text-muted'} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center border-2 border-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-background/88 backdrop-blur-md"
            />
            <motion.section
              initial={{ opacity: 0, y: 36, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 36, scale: 0.98 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="notifications-title"
              className="relative w-full sm:max-w-xl max-h-[88vh] overflow-hidden bg-zinc-950 border border-white/10 border-b-0 sm:border-b rounded-t-[32px] sm:rounded-[32px] shadow-2xl"
            >
              <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.22em] text-primary">IronShape</span>
                  <h2 id="notifications-title" className="mt-1 text-2xl font-black uppercase tracking-tight">Notificações</h2>
                  <p className="text-xs text-text-muted mt-1">{unreadCount} não lidas</p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAll}
                      className="min-h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Ler tudo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Fechar notificações"
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-text-primary flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="max-h-[68vh] overflow-y-auto p-3 sm:p-4">
                {loading ? (
                  <div className="py-16 flex flex-col items-center gap-3 text-text-muted">
                    <Loader2 className="animate-spin text-primary" size={28} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Carregando histórico...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-16 text-center text-text-muted">
                    <BellRing size={32} className="mx-auto mb-3 text-primary" />
                    <p className="text-sm font-bold">Nenhuma notificação ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map(notification => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => openNotification(notification)}
                        className={`w-full text-left rounded-2xl border p-4 flex items-start gap-3 transition-all ${
                          notification.status === 'unread'
                            ? 'bg-primary/10 border-primary/20'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                          notification.status === 'unread' ? 'bg-primary/15 border-primary/25 text-primary' : 'bg-white/5 border-white/10 text-text-muted'
                        }`}>
                          {notificationIcons[notification.type] || <BellRing size={18} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-black leading-tight">{notification.title}</span>
                            {notification.status === 'unread' && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                          </span>
                          <span className="block mt-1 text-xs text-text-secondary leading-relaxed">{notification.message}</span>
                          <span className="block mt-2 text-[10px] text-text-muted font-bold">{formatNotificationDate(notification.created_at)}</span>
                        </span>
                        {notification.action && <ChevronRight size={16} className="text-text-muted mt-2 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
