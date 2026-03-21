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
        buyer:profiles!threads_buyer_id_fkey(full_name, avatar_url),
        seller:profiles!threads_seller_id_fkey(full_name, avatar_url),
        listing:swap_listings(title, photo_url)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

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
  findOrCreateThread: async (listingId: string, buyerId: string, sellerId: string, moduleType: string) => {
    // Try to find existing
    const { data: existingData, error: findError } = await supabase
      .from('threads')
      .select('*')
      .eq('listing_id', listingId)
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .maybeSingle();
      
    if (existingData) return existingData;

    // Create new
    const { data: newData, error: createError } = await supabase
      .from('threads')
      .insert({
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: sellerId,
        module_type: moduleType,
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

    // Create notification for receiver
    await supabase.from('notifications').insert({
      user_id: receiverId,
      type: 'new_message',
      title: 'Yeni Mesaj',
      content: content.substring(0, 50),
      thread_id: threadId,
      read: false
    });

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
  }
};
