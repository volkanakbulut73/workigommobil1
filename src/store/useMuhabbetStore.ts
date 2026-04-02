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
  imageUrl?: string;
  audioUrl?: string;
}

interface MuhabbetPrivateChat {
  id: string; // the other user's id
  name: string;
}

interface MuhabbetState {
  messages: MuhabbetMessage[];
  onlineUsers: number;
  presenceList: any[];
  currentBroadcastChannel: RealtimeChannel | null;
  currentPresenceChannel: RealtimeChannel | null;
  
  // Private Room (Ephemeral)
  myProfile: any;
  activePrivateTab: MuhabbetPrivateChat | null;
  privateMessages: Record<string, MuhabbetMessage[]>;
  unreadPrivate: string[];
  incomingInvite: { id: string, name: string } | null;

  initializeRoom: (roomName: string, userId: string, profile: any) => void;
  sendMessage: (roomName: string, message: Omit<MuhabbetMessage, 'id' | 'created_at'>) => Promise<void>;
  leaveRoom: () => void;
  addMessage: (msg: MuhabbetMessage) => void;
  
  // Private Room Actions
  openPrivateChat: (targetUser: MuhabbetPrivateChat) => void;
  closePrivateChat: () => void;
  sendPrivateMessage: (targetId: string, content: string, targetName: string, imageUrl?: string, audioUrl?: string) => Promise<void>;
  acceptInvite: () => void;
  declineInvite: () => void;
}

export const useMuhabbetStore = create<MuhabbetState>()((set, get) => ({
  messages: [],
  onlineUsers: 0,
  presenceList: [],
  currentBroadcastChannel: null,
  currentPresenceChannel: null,

  myProfile: null,
  activePrivateTab: null,
  privateMessages: {},
  unreadPrivate: [],
  incomingInvite: null,

  initializeRoom: (roomName, userId, profile) => {
    // 1. Leave if already in a room
    get().leaveRoom();

    set({ myProfile: profile });

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
        created_at: data.timestamp ? new Date().toISOString() : data.created_at || new Date().toISOString(),
        imageUrl: data.imageUrl,
        audioUrl: data.audioUrl
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
        content: `[Görsel] ${data.text || ''}`, // Fallback
        created_at: data.timestamp ? new Date().toISOString() : data.created_at || new Date().toISOString(),
        imageUrl: data.imageUrl
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
        content: `[Ses Dosyası] ${data.text || ''}`, // Fallback
        created_at: data.timestamp ? new Date().toISOString() : data.created_at || new Date().toISOString(),
        audioUrl: data.audioUrl
      };
      get().addMessage(msg);
    });

    // Handle Private Invites
    channel.on('broadcast', { event: 'private_invite' }, (payload) => {
      const data = payload.payload;
      const myId = get().myProfile?.id;
      
      const { useBlockStore } = require('./useBlockStore');
      if (data.inviter?.id && useBlockStore.getState().isBlocked(data.inviter.id)) return;

      if (myId && data.targetId === myId) {
        set({ incomingInvite: data.inviter });
      }
    });

    // Handle Private Messages
    channel.on('broadcast', { event: 'private_message' }, (payload) => {
      const data = payload.payload;
      const myId = get().myProfile?.id;
      
      const { useBlockStore } = require('./useBlockStore');
      if (data.message?.sender_id && useBlockStore.getState().isBlocked(data.message.sender_id)) return;

      const isMeTarget = data.targetId === myId;
      const isMeSender = data.message.sender_id === myId;
      
      if (isMeTarget || isMeSender) {
        const otherId = isMeTarget ? data.message.sender_id : data.targetId;
        
        set((state) => {
          const currentMsgs = state.privateMessages[otherId] || [];
          const newMsgs = [data.message, ...currentMsgs];
          
          let updatedUnread = state.unreadPrivate;
          // If I am the target, and I am not currently looking at this tab, mark unread
          if (isMeTarget && state.activePrivateTab?.id !== otherId && !state.unreadPrivate.includes(otherId)) {
            updatedUnread = [...state.unreadPrivate, otherId];
          }

          return {
            privateMessages: {
              ...state.privateMessages,
              [otherId]: newMsgs
            },
            unreadPrivate: updatedUnread
          };
        });
      }
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
    const { useBlockStore } = require('./useBlockStore');
    if (useBlockStore.getState().isBlocked(msg.sender_id)) {
      return; // Do not add message from blocked user
    }

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
      roomId: roomName === 'genel' ? 'public-chat' : roomName,
      imageUrl: fullMsg.imageUrl,
      audioUrl: fullMsg.audioUrl
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
      messages: [],
      activePrivateTab: null,
      incomingInvite: null,
      myProfile: null
    });
  },

  openPrivateChat: (targetUser) => {
    set((state) => ({ 
      activePrivateTab: targetUser,
      unreadPrivate: state.unreadPrivate.filter(id => id !== targetUser.id)
    }));
    
    const { currentBroadcastChannel, myProfile } = get();
    if (currentBroadcastChannel && myProfile) {
      currentBroadcastChannel.send({
        type: 'broadcast',
        event: 'private_invite',
        payload: {
          targetId: targetUser.id,
          inviter: { id: myProfile.id, name: myProfile.full_name }
        }
      });
    }
  },

  closePrivateChat: () => set({ activePrivateTab: null }),

  acceptInvite: () => {
    const invite = get().incomingInvite;
    if (invite) {
      set({ 
        activePrivateTab: invite, 
        incomingInvite: null 
      });
    }
  },

  declineInvite: () => set({ incomingInvite: null }),

  sendPrivateMessage: async (targetId, content, targetName, imageUrl, audioUrl) => {
    const { currentBroadcastChannel, myProfile } = get();
    if (!currentBroadcastChannel || !myProfile) return;

    const fullMsg: MuhabbetMessage = {
      id: Math.random().toString(),
      sender_id: myProfile.id,
      sender_name: myProfile.full_name || 'Anonim',
      avatar_url: myProfile.avatar_url || '',
      content: content,
      created_at: new Date().toISOString(),
      imageUrl,
      audioUrl
    };

    const webPrivMsg = {
        id: fullMsg.id,
        text: fullMsg.content,
        senderId: fullMsg.sender_id,
        senderName: fullMsg.sender_name,
        senderAvatar: fullMsg.avatar_url || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        imageUrl,
        audioUrl
    };

    // Broadcast only works because both users are on the same channel
    await currentBroadcastChannel.send({
      type: 'broadcast',
      event: 'private_message',
      payload: {
        targetId,
        targetName,
        message: { ...fullMsg, ...webPrivMsg } // Keep both schemas
      }
    });
    
    // Optimistic addition is handled by our own broadcast listener (since isMeSender applies),
    // but sometimes the client doesn't receive its own broadcast. We should add it manually just in case.
    set((state) => {
        const currentMsgs = state.privateMessages[targetId] || [];
        // Prevent duplicate if broadcast listener already caught it
        if (currentMsgs.some(m => m.id === fullMsg.id)) return state;
        return {
          privateMessages: {
            ...state.privateMessages,
            [targetId]: [fullMsg, ...currentMsgs]
          }
        };
    });
  }
}));
