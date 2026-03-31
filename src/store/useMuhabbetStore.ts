import { create } from 'zustand';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface MuhabbetMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

interface MuhabbetState {
  messages: MuhabbetMessage[];
  onlineUsers: number;
  presenceList: any[];
  currentBroadcastChannel: RealtimeChannel | null;
  currentPresenceChannel: RealtimeChannel | null;
  
  initializeRoom: (roomName: string, userId: string, profile: any) => void;
  sendMessage: (roomName: string, message: Omit<MuhabbetMessage, 'id' | 'created_at'>) => Promise<void>;
  leaveRoom: () => void;
  addMessage: (msg: MuhabbetMessage) => void;
}

export const useMuhabbetStore = create<MuhabbetState>()((set, get) => ({
  messages: [],
  onlineUsers: 0,
  presenceList: [],
  currentBroadcastChannel: null,
  currentPresenceChannel: null,

  initializeRoom: (roomName, userId, profile) => {
    // 1. Leave if already in a room
    get().leaveRoom();

    const channelId = roomName === 'genel' ? 'public-chat' : roomName;
    const channel = supabase.channel(channelId);

    // 2. Setup Broadcast Channel for incoming messages
    channel.on('broadcast', { event: 'message' }, (payload) => {
      // Handle both Web (ChatMessage) and Mobile (MuhabbetMessage) schemas
      const data = payload.payload;
      const msg: MuhabbetMessage = {
        id: data.id,
        sender_id: data.senderId || data.sender_id,
        sender_name: data.senderName || data.sender_name,
        avatar_url: data.senderAvatar || data.avatar_url,
        content: data.text || data.content,
        created_at: data.timestamp ? new Date().toISOString() : data.created_at || new Date().toISOString()
      };
      get().addMessage(msg);
    });

    // Handle image-share from Web
    channel.on('broadcast', { event: 'image-share' }, (payload) => {
      const data = payload.payload;
      const msg: MuhabbetMessage = {
        id: data.id,
        sender_id: data.senderId || data.sender_id,
        sender_name: data.senderName || data.sender_name,
        avatar_url: data.senderAvatar || data.avatar_url,
        content: `[Görsel] ${data.text || ''}`, // Mobile doesn't render imageUrl natively yet, fallback text
        created_at: data.timestamp ? new Date().toISOString() : data.created_at || new Date().toISOString()
      };
      get().addMessage(msg);
    });

    // Handle audio-share from Web
    channel.on('broadcast', { event: 'audio-share' }, (payload) => {
      const data = payload.payload;
      const msg: MuhabbetMessage = {
        id: data.id,
        sender_id: data.senderId || data.sender_id,
        sender_name: data.senderName || data.sender_name,
        avatar_url: data.senderAvatar || data.avatar_url,
        content: `[Ses Dosyası] ${data.text || ''}`, // Mobile doesn't render audio natively yet, fallback text
        created_at: data.timestamp ? new Date().toISOString() : data.created_at || new Date().toISOString()
      };
      get().addMessage(msg);
    });

    // 3. Setup Presence Channel
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const usersMap = new Map<string, any>();

      for (const id in state) {
        const presences = state[id] as any[];
        if (presences.length > 0) {
          const presence = presences[0];
          // Handle both Web (userId) and Mobile (user_id) schemas
          const uid = presence.userId || presence.user_id;
          if (uid) {
            usersMap.set(uid, {
              id: uid,
              name: presence.name || presence.full_name || 'Kullanıcı',
              avatar: presence.avatar || presence.avatar_url
            });
          }
        }
      }

      const users = Array.from(usersMap.values());
      set({ 
        onlineUsers: users.length,
        presenceList: users
      });
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence using both schemas to ensure web compatibility
        await channel.track({
          userId: userId, 
          user_id: userId,
          name: profile.full_name || 'Kullanıcı',
          full_name: profile.full_name || 'Kullanıcı',
          avatar: profile.avatar_url,
          avatar_url: profile.avatar_url,
          onlineAt: new Date().toISOString()
        });
      }
    });

    set({ 
      currentBroadcastChannel: channel,
      currentPresenceChannel: channel,
      messages: [] // Clear previous room messages
    });
  },

  addMessage: (msg) => {
    // Keep only the last 100 messages for performance in broadcast
    set((state) => {
      const newMessages = [msg, ...state.messages];
      if (newMessages.length > 100) newMessages.pop();
      return { messages: newMessages };
    });
  },

  sendMessage: async (roomName, message) => {
    const { currentBroadcastChannel } = get();
    if (!currentBroadcastChannel) return;

    // Mobile specific message structure
    const fullMsg: MuhabbetMessage = {
      ...message,
      id: Math.random().toString(), // Temp ID for broadcast
      created_at: new Date().toISOString()
    };

    // Web compat message structure (sent alongside so Web can parse it)
    const webMsg = {
      id: fullMsg.id,
      text: fullMsg.content,
      senderId: fullMsg.sender_id,
      senderName: fullMsg.sender_name,
      senderAvatar: fullMsg.avatar_url || null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBot: fullMsg.sender_id === 'bot-1',
      roomId: roomName === 'genel' ? 'public-chat' : roomName
    };

    // Merge both to handle any client
    const broadcastPayload = { ...fullMsg, ...webMsg };

    // Broadcast the message to all connected clients
    await currentBroadcastChannel.send({
      type: 'broadcast',
      event: 'message',
      payload: broadcastPayload
    });

    // Optimistically add to our own list
    get().addMessage(fullMsg);
  },

  leaveRoom: () => {
    const { currentBroadcastChannel } = get();
    
    // We only have one channel now
    if (currentBroadcastChannel) {
      currentBroadcastChannel.unsubscribe();
      supabase.removeChannel(currentBroadcastChannel);
    }

    set({ 
      currentBroadcastChannel: null, 
      currentPresenceChannel: null,
      onlineUsers: 0,
      presenceList: [],
      messages: []
    });
  }
}));
