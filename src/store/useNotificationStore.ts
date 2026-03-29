import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { RealtimeService } from '../services/realtimeService';
import { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationState {
  unreadCount: number;
  unreadMessageCount: number;
  unreadThreadIds: string[];
  notifications: any[];
  currentChannel: RealtimeChannel | null;
  setUnreadCount: (count: number) => void;
  setUnreadMessageCount: (count: number) => void;
  fetchCounts: (userId: string) => Promise<void>;
  subscribe: (userId: string) => void;
  unsubscribe: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  unreadCount: 0,
  unreadMessageCount: 0,
  unreadThreadIds: [],
  notifications: [],
  currentChannel: null,
  setUnreadCount: (count) => set({ unreadCount: count }),
  setUnreadMessageCount: (count) => set({ unreadMessageCount: count }),
  fetchCounts: async (userId) => {
    const { count: notifCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    const { data: notifications, count: msgCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('type', 'new_message')
      .eq('read', false);

    const unreadThreadIds = notifications?.map(n => {
      if (n.thread_id) return n.thread_id;
      // Fallback: parse from link /app/messages/:id or messages/:id
      if (n.link?.includes('/messages/')) {
        return n.link.split('/messages/').pop();
      }
      return null;
    }).filter(Boolean) || [];
    
    set({ 
      unreadCount: notifCount || 0, 
      unreadMessageCount: msgCount || 0,
      unreadThreadIds: Array.from(new Set(unreadThreadIds)),
      notifications: notifications || []
    });
  },
  subscribe: (userId) => {
    // Unsubscribe if exists
    get().unsubscribe();

    const channel = RealtimeService.subscribeToUserChanges(userId, 'notifications', () => {
      get().fetchCounts(userId);
    });

    set({ currentChannel: channel });
  },
  unsubscribe: () => {
    const { currentChannel } = get();
    if (currentChannel) {
      RealtimeService.unsubscribe(currentChannel);
      set({ currentChannel: null });
    }
  },
}));
