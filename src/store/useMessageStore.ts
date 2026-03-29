import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Thread, Message } from '../types';
import { RealtimeService } from '../services/realtimeService';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useNotificationStore } from './useNotificationStore';
import { AnalyticsService } from '../services/analyticsService';

interface MessageState {
  threads: Thread[];
  activeThread: Thread | null;
  messages: Message[];
  loading: boolean;
  page: number;
  hasMore: boolean;
  currentChannel: RealtimeChannel | null;
  retryQueue: Array<{ id: string, threadId: string, senderId: string, receiverId: string, content: string }>;
  realtimeBuffer: Message[];
  realtimeFlushTimeout: NodeJS.Timeout | null;
  
  fetchThreads: (userId: string) => Promise<void>;
  fetchMessages: (threadId: string, lastCursor?: string) => Promise<void>;
  sendMessage: (threadId: string, senderId: string, receiverId: string, content: string) => Promise<void>;
  subscribeToThread: (threadId: string, userId: string) => void;
  unsubscribe: () => void;
  addMessageOptimistically: (message: Message) => void;
  markThreadAsRead: (threadId: string, userId: string) => Promise<void>;
}

export const useMessageStore = create<MessageState>()((set, get) => ({
  threads: [],
  activeThread: null,
  messages: [],
  loading: false,
  page: 0,
  hasMore: true,
  currentChannel: null,
  retryQueue: [],
  realtimeBuffer: [],
  realtimeFlushTimeout: null,

  fetchThreads: async (userId) => {
    set({ loading: true });
    const { data: threads } = await supabase
      .from('threads')
      .select(`
        *,
        buyer:profiles!buyer_id(full_name, avatar_url),
        seller:profiles!seller_id(full_name, avatar_url),
        listing:swap_listings(title, photo_url, required_balance)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    set({ threads: threads || [], loading: false });
  },

  fetchMessages: async (threadId, lastCursor) => {
    if (get().loading) return; // Prevent duplicate requests
    set({ loading: true });
    
    let query = supabase
      .from('messages')
      .select(`*`)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (lastCursor) {
      query = query.lt('created_at', lastCursor);
    }

    const { data: messages, error } = await query;

    if (!error && messages) {
      // Sort DESCENDING (newest first) for inverted FlatList
      const sortedNew = messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      if (lastCursor) {
        // Append older messages to the end
        set(state => ({
          messages: [...state.messages, ...sortedNew],
          hasMore: messages.length === 20,
        }));
      } else {
        // Initial load
        set({ 
          messages: sortedNew,
          hasMore: messages.length === 20,
        });
      }
    }
    set({ loading: false });
  },

  addMessageOptimistically: (message: Message) => {
    set((state: MessageState) => ({
      // Newest messages go to index 0 for inverted FlatList
      messages: [message, ...state.messages]
    }));
  },

  sendMessage: async (threadId, senderId, receiverId, content) => {
    const tempId = Math.random().toString();
    const optimisticMessage: Message = {
      id: tempId,
      thread_id: threadId,
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      read: false,
      created_at: new Date().toISOString(),
      status: 'sending'
    } as any;

    get().addMessageOptimistically(optimisticMessage);

    try {
      const { data: sent, error } = await supabase
        .from('messages')
        .insert({ thread_id: threadId, sender_id: senderId, receiver_id: receiverId, content })
        .select()
        .single();

      if (error) throw error;

      AnalyticsService.trackEvent('message_sent', { threadId, receiverId });

      set((state: MessageState) => ({
        messages: state.messages.map((m: Message) => m.id === tempId ? { ...sent, status: 'sent' } as any : m)
      }));
    } catch (error) {
      set((state: MessageState) => ({
        messages: state.messages.map((m: Message) => m.id === tempId ? { ...m, status: 'error' } as any : m),
        retryQueue: [...state.retryQueue, { id: tempId, threadId, senderId, receiverId, content }]
      }));
    }
  },

  subscribeToThread: (threadId: string, userId: string) => {
    const { currentChannel, unsubscribe, markThreadAsRead } = get();
    if (currentChannel) unsubscribe();
    
    // Clear once on subscribe
    markThreadAsRead(threadId, userId);

    const channel = RealtimeService.subscribeToThread(threadId, (payload: any) => {
      const newMessage = payload.new as Message;
      const state = get();

      // If we are actively viewing this thread and receive a message from others, mark as read
      if (newMessage.sender_id !== userId) {
        markThreadAsRead(threadId, userId);
      }
      
      // Prevent optimistic duplication
      const isAlreadyInState = state.messages.some(m => m.id === newMessage.id);
      if (isAlreadyInState) return;

      const newBuffer = [...state.realtimeBuffer, newMessage];
      set({ realtimeBuffer: newBuffer });

      if (state.realtimeFlushTimeout) {
        clearTimeout(state.realtimeFlushTimeout);
      }

      // Batch Realtime updates (debounce 300ms)
      const timeout = setTimeout(() => {
        const buffer = get().realtimeBuffer;
        if (buffer.length > 0) {
          set(currState => {
            const existingIds = new Set(currState.messages.map(m => m.id));
            const trulyNew = buffer
              .filter(m => !existingIds.has(m.id))
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              
            return {
              // Prepend to array meaning they appear at the bottom on inverted list
              messages: [...trulyNew, ...currState.messages],
              realtimeBuffer: []
            };
          });
        }
      }, 300);

      set({ realtimeFlushTimeout: timeout });
    });

    set({ currentChannel: channel });
  },

  unsubscribe: () => {
    const { currentChannel, realtimeFlushTimeout } = get();
    if (currentChannel) {
      RealtimeService.unsubscribe(currentChannel);
    }
    if (realtimeFlushTimeout) {
      clearTimeout(realtimeFlushTimeout);
    }
    set({ currentChannel: null, realtimeFlushTimeout: null, realtimeBuffer: [] });
  },

  markThreadAsRead: async (threadId: string, userId: string) => {
    // 1. Clear notifications (identifying them by the threadId in the link column)
    const { error: notifError } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('type', 'new_message')
      .like('link', `%${threadId}%`)
      .eq('read', false);

    // 2. Clear messages read status
    const { error: msgError } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('thread_id', threadId)
      .eq('receiver_id', userId)
      .eq('read', false);

    if (!notifError || !msgError) {
      useNotificationStore.getState().fetchCounts(userId);
    }
  },
}));
