import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { RealtimeService } from '../services/realtimeService';
import { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationState {
  unreadCount: number;
  unreadMessageCount: number;
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

    const { count: msgCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'new_message')
      .eq('read', false);

    set({ unreadCount: notifCount || 0, unreadMessageCount: msgCount || 0 });
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
