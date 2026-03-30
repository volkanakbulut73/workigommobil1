import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const RealtimeService = {
  /**
   * Subscribes to Postgres changes for a specific user.
   */
  subscribeToUserChanges(userId: string, table: string, onUpdate: (payload: any) => void): RealtimeChannel {
    const channel = supabase
      .channel(`user-${table}-${userId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: table, 
          filter: table === 'notifications' ? `user_id=eq.${userId}` : undefined 
        },
        (payload) => onUpdate(payload)
      )
      .subscribe();
    
    return channel;
  },

  /**
   * Subscribes to a specific message thread.
   */
  subscribeToThread(threadId: string, onEvent: (payload: any) => void): RealtimeChannel {
    return supabase
      .channel(`thread-${threadId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
        (payload) => onEvent(payload)
      )
      .subscribe();
  },

  /**
   * Subscribes to global broadcast (Muhabbet).
   */
  subscribeToBroadcast(channelName: string, onEvent: (payload: any) => void): RealtimeChannel {
    return supabase
      .channel(`broadcast-${channelName}`)
      .on('broadcast', { event: '*' }, (payload) => onEvent(payload))
      .subscribe();
  },

  /**
   * Presence: Sync online status with room-based support and throttling.
   */
  trackPresence(roomName: string, userId: string, profile: any): RealtimeChannel {
    const channelId = `presence-${roomName}`;
    const channel = supabase.channel(channelId, {
      config: {
        presence: {
          key: userId,
        },
      },
    });
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Presence sync:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handle join with throttling logic in the UI layer if needed
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            ...profile
          });
        }
      });

    return channel;
  },

  /**
   * Lifecycle management.
   */
  unsubscribe(channel: RealtimeChannel) {
    supabase.removeChannel(channel);
  }
};
