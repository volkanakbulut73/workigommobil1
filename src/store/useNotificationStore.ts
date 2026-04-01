import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { RealtimeService } from '../services/realtimeService';
import { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationState {
  unreadCount: number;
  unreadMessageCount: number;
  unreadThreadIds: string[];
  unreadSenderIds: string[];
  notifications: any[];
  currentChannels: RealtimeChannel[];
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
  unreadSenderIds: [],
  notifications: [],

  currentChannels: [],
  setUnreadCount: (count) => set({ unreadCount: count }),
  setUnreadMessageCount: (count) => set({ unreadMessageCount: count }),
  fetchCounts: async (userId) => {
    const { count: notifCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    // Changed: Query `messages` table directly for unread messages instead of `notifications`.
    const { count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('read', false);

    const { data: messagesData } = await supabase
      .from('messages')
      .select('thread_id, sender_id')
      .eq('receiver_id', userId)
      .eq('read', false);

    const unreadThreadIds = messagesData?.map(m => m.thread_id).filter(Boolean) || [];
    const unreadSenderIds = messagesData?.map(m => m.sender_id).filter(Boolean) || [];
    
    set({ 
      unreadCount: notifCount || 0, 
      unreadMessageCount: msgCount || 0,
      unreadThreadIds: Array.from(new Set(unreadThreadIds)),
      unreadSenderIds: Array.from(new Set(unreadSenderIds)),
      notifications: [] 
    });

  },
  subscribe: (userId) => {
    // Unsubscribe if exists
    get().unsubscribe();

    const notifChannel = RealtimeService.subscribeToUserChanges(userId, 'notifications', () => {
      get().fetchCounts(userId);
    });

    const msgChannel = supabase
      .channel(`user-messages-${userId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages', 
          filter: `receiver_id=eq.${userId}` 
        },
        () => get().fetchCounts(userId)
      )
      .subscribe();

    set({ currentChannels: [notifChannel, msgChannel] });
  },
  unsubscribe: () => {
    const { currentChannels } = get();
    currentChannels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    set({ currentChannels: [] });
  },
}));
