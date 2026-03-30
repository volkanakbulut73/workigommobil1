import { supabase } from '../lib/supabase';

export const MessageService = {
  /**
   * Fetches threads for a user.
   */
  getUserThreads: async (userId: string) => {
    const { data, error } = await supabase
      .from('threads')
      .select(`
        *,
        buyer:profiles!buyer_id(full_name, avatar_url),
        seller:profiles!seller_id(full_name, avatar_url),
        listing:swap_listings(title, photo_url, required_balance)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Fetches a single thread detail with related data.
   */
  getThreadDetails: async (threadId: string) => {
    const { data, error } = await supabase
      .from('threads')
      .select(`
        *,
        buyer:profiles!buyer_id(full_name, avatar_url),
        seller:profiles!seller_id(full_name, avatar_url),
        listing:swap_listings(title, photo_url, required_balance)
      `)
      .eq('id', threadId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetches messages for a thread using cursor-based pagination.
   */
  getThreadMessages: async (threadId: string, lastCursor?: string) => {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (lastCursor) {
      query = query.lt('created_at', lastCursor);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Finds an existing thread or creates a new one.
   */
  findOrCreateThread: async (listingId: string | null, buyerId: string, sellerId: string, moduleType: string) => {
    // Try to find existing in both directions
    let query = supabase.from('threads').select('*').eq('buyer_id', buyerId).eq('seller_id', sellerId).eq('type', moduleType);
    if (listingId) query = query.eq('listing_id', listingId);
    else query = query.is('listing_id', null);

    const { data: existingData } = await query.maybeSingle();
    if (existingData) return existingData;

    // Try reverse direction
    let query2 = supabase.from('threads').select('*').eq('buyer_id', sellerId).eq('seller_id', buyerId).eq('type', moduleType);
    if (listingId) query2 = query2.eq('listing_id', listingId);
    else query2 = query2.is('listing_id', null);

    const { data: existingData2 } = await query2.maybeSingle();
    if (existingData2) return existingData2;

    // Create new
    const { data: newData, error: createError } = await supabase
      .from('threads')
      .insert({
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: sellerId,
        type: moduleType,
        last_message: null
      })
      .select()
      .single();

    if (createError) throw createError;
    return newData;
  },

  /**
   * Sends a message and triggers notification.
   */
  sendMessage: async (threadId: string, senderId: string, receiverId: string, content: string) => {
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({ thread_id: threadId, sender_id: senderId, receiver_id: receiverId, content })
      .select()
      .single();

    if (msgError) throw msgError;

    // Update thread
    await supabase
      .from('threads')
      .update({ last_message: content, updated_at: new Date().toISOString() })
      .eq('id', threadId);

    // Create notification for receiver (REMOVED - no longer using new_message for the bell icon)
    // Removed to prevent redundant notifications

    return message;
  },

  /**
   * Marks all messages in a thread as read for the viewer.
   */
  markThreadMessagesAsRead: async (threadId: string, viewerId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('thread_id', threadId)
      .eq('receiver_id', viewerId)
      .eq('read', false);

    if (error) throw error;
  },

  /**
   * Deletes a message and updates the thread's last message.
   */
  deleteMessage: async (messageId: string, senderId: string, threadId: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .match({ id: messageId, sender_id: senderId });

    if (error) throw error;

    // Fix: Update the thread's last_message so it doesn't show the deleted message
    const { data: lastMsgs } = await supabase
      .from('messages')
      .select('content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(1);

    const newLastMessage = lastMsgs && lastMsgs.length > 0 ? lastMsgs[0].content : '';
    await supabase.from('threads').update({ last_message: newLastMessage }).eq('id', threadId);
  },

  /**
   * Deletes an entire thread.
   */
  deleteThread: async (threadId: string) => {
    const { error } = await supabase
      .from('threads')
      .delete()
      .eq('id', threadId);

    if (error) {
      console.error('Thread delete error:', error);
      throw error;
    }
  }
};
