import { AppNotification, NotificationType, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { withTimeout } from '../lib/utils';

type NewNotification = {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  action?: string | null;
  dedupe_key?: string | null;
  sent_by?: string | null;
};

const storageKey = (userId: string) => `ironshape_notifications_${userId}`;

function readLocal(userId: string): AppNotification[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(userId: string, notifications: AppNotification[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(notifications.slice(0, 100)));
}

function toLocalNotification(input: NewNotification): AppNotification {
  return {
    id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    user_id: input.user_id,
    title: input.title,
    message: input.message,
    type: input.type,
    action: input.action ?? null,
    status: 'unread',
    created_at: new Date().toISOString(),
    read_at: null,
    dedupe_key: input.dedupe_key ?? null,
    sent_by: input.sent_by ?? null,
  };
}

async function createLocal(input: NewNotification) {
  const current = readLocal(input.user_id);
  if (input.dedupe_key && current.some(item => item.dedupe_key === input.dedupe_key)) {
    return null;
  }
  const notification = toLocalNotification(input);
  writeLocal(input.user_id, [notification, ...current]);
  return notification;
}

export const notificationService = {
  getUserNotifications: async (userId: string): Promise<AppNotification[]> => {
    try {
      const { data, error } = await withTimeout(() => supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100), 12000, 1) as any;

      if (error) throw error;
      return (data || []) as AppNotification[];
    } catch (error) {
      console.warn('Notifications table unavailable, using local fallback:', error);
      return readLocal(userId);
    }
  },

  createNotification: async (input: NewNotification): Promise<AppNotification | null> => {
    try {
      const { data, error } = await withTimeout(() => supabase
        .from('notifications')
        .insert([{
          user_id: input.user_id,
          title: input.title,
          message: input.message,
          type: input.type,
          action: input.action ?? null,
          status: 'unread',
          dedupe_key: input.dedupe_key ?? null,
          sent_by: input.sent_by ?? null,
        }])
        .select()
        .single(), 12000, 1) as any;

      if (error) throw error;
      return data as AppNotification;
    } catch (error: any) {
      if (error?.code === '23505') return null;
      return createLocal(input);
    }
  },

  createNotificationOnce: async (input: NewNotification): Promise<AppNotification | null> => {
    if (!input.dedupe_key) return notificationService.createNotification(input);
    try {
      const { data, error } = await withTimeout(() => supabase
        .from('notifications')
        .select('id')
        .eq('user_id', input.user_id)
        .eq('dedupe_key', input.dedupe_key)
        .maybeSingle(), 12000, 1) as any;

      if (error) throw error;
      if (data) return null;
      return notificationService.createNotification(input);
    } catch {
      return createLocal(input);
    }
  },

  markAsRead: async (userId: string, notificationId: string) => {
    const readAt = new Date().toISOString();
    if (notificationId.startsWith('local-')) {
      writeLocal(userId, readLocal(userId).map(item => item.id === notificationId ? { ...item, status: 'read', read_at: readAt } : item));
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read', read_at: readAt })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  markAllAsRead: async (userId: string) => {
    const readAt = new Date().toISOString();
    writeLocal(userId, readLocal(userId).map(item => ({ ...item, status: 'read', read_at: item.read_at || readAt })));
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read', read_at: readAt })
      .eq('user_id', userId)
      .eq('status', 'unread');

    if (error) console.warn('Could not mark remote notifications as read:', error);
  },

  getAdminNotifications: async (): Promise<AppNotification[]> => {
    const { data, error } = await withTimeout(() => supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500), 15000, 1) as any;

    if (error) throw error;
    return (data || []) as AppNotification[];
  },

  sendManual: async ({ users, title, message, action, sentBy }: {
    users: UserProfile[];
    title: string;
    message: string;
    action?: string | null;
    sentBy?: string | null;
  }) => {
    const rows = users.map(user => ({
      user_id: user.id,
      title,
      message,
      type: 'manual' as NotificationType,
      action: action || null,
      status: 'unread',
      dedupe_key: `manual-${Date.now()}-${user.id}`,
      sent_by: sentBy || null,
    }));

    const { data, error } = await withTimeout(() => supabase
      .from('notifications')
      .insert(rows)
      .select(), 15000, 1) as any;

    if (error) throw error;
    return (data || []) as AppNotification[];
  },
};
