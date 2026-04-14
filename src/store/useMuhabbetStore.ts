import { create } from 'zustand';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useBlockStore } from './useBlockStore';

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
  joinedRooms: MuhabbetPrivateChat[];
  privateMessages: Record<string, MuhabbetMessage[]>;
  unreadPrivate: string[];
  incomingInvite: { id: string, name: string } | null;
  privateChannels: Record<string, RealtimeChannel>;

  initializeRoom: (roomName: string, userId: string, profile: any) => void;
  sendMessage: (roomName: string, message: Omit<MuhabbetMessage, 'id' | 'created_at'>) => Promise<void>;
  leaveRoom: () => void;
  addMessage: (msg: MuhabbetMessage) => void;
  
  // Private Room Actions
  openPrivateChat: (targetUser: MuhabbetPrivateChat) => void;
  closePrivateChat: (targetId: string) => void;
  switchToGlobal: () => void;
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
  joinedRooms: [],
  privateMessages: {},
  unreadPrivate: [],
  incomingInvite: null,
  privateChannels: {},

  initializeRoom: (roomName, userId, profile) => {
    // 1. Leave if already in a room
    get().leaveRoom();

    set({ myProfile: profile });

    const channelId = roomName === 'genel' ? 'public-chat' : roomName;
    const channel = supabase.channel(channelId, {
      config: {
        presence: { key: userId },
        broadcast: { ack: false }
      }
    });

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
      // Only process global messages
      if (!data.roomId || data.roomId === 'public-chat' || data.roomId === channelId) {
        get().addMessage(msg);
      }
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
      if (!data.roomId || data.roomId === 'public-chat' || data.roomId === channelId) {
        get().addMessage(msg);
      }
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
      if (!data.roomId || data.roomId === 'public-chat' || data.roomId === channelId) {
        get().addMessage(msg);
      }
    });

    // Handle Private Invites
    channel.on('broadcast', { event: 'private_invite' }, (payload) => {
      const data = payload.payload;
      const myId = get().myProfile?.id;
      
      if (data.inviter?.id && useBlockStore.getState().isBlocked(data.inviter.id)) return;

      if (myId && data.targetId === myId) {
        // Automatically add to joined rooms if not there
        const rooms = get().joinedRooms;
        if (!rooms.find(r => r.id === data.inviter.id)) {
            set({ joinedRooms: [...rooms, data.inviter] });
        }
        
        // Add to unread to pulse it
        const unread = get().unreadPrivate;
        if (!unread.includes(data.inviter.id)) {
            set({ unreadPrivate: [...unread, data.inviter.id] });
        }
      }
    });

    // Handle Private Messages
    channel.on('broadcast', { event: 'private_message' }, (payload) => {
      const data = payload.payload;
      const myId = get().myProfile?.id;
      
      if (data.message?.sender_id && useBlockStore.getState().isBlocked(data.message.sender_id)) return;
      if (data.message?.senderId && useBlockStore.getState().isBlocked(data.message.senderId)) return;

      const isMeTarget = data.targetId === myId;
      const isMeSender = data.message?.sender_id === myId || data.message?.senderId === myId;
      
      if (isMeTarget || isMeSender) {
        const otherId = isMeTarget ? (data.message.senderId || data.message.sender_id) : data.targetId;
        
        // Normalize schema
        const rawMsg = data.message;
        const msg: MuhabbetMessage = {
            id: rawMsg.id,
            sender_id: rawMsg.senderId || rawMsg.sender_id,
            sender_name: rawMsg.senderName || rawMsg.sender_name,
            avatar_url: rawMsg.senderAvatar || rawMsg.avatar_url,
            content: rawMsg.text || rawMsg.content,
            created_at: rawMsg.timestamp ? new Date().toISOString() : rawMsg.created_at || new Date().toISOString(),
            imageUrl: rawMsg.imageUrl,
            audioUrl: rawMsg.audioUrl
        };

        set((state) => {
          const currentMsgs = state.privateMessages[otherId] || [];
          if (currentMsgs.some(m => m.id === msg.id)) return state;
          const newMsgs = [msg, ...currentMsgs];
          
          let updatedUnread = state.unreadPrivate;
          let updatedJoinedRooms = state.joinedRooms;

          // Add to joined rooms if not present
          if (!updatedJoinedRooms.find(r => r.id === otherId)) {
               updatedJoinedRooms = [...updatedJoinedRooms, { id: otherId, name: msg.sender_name }];
          }

          if (isMeTarget && state.activePrivateTab?.id !== otherId && !state.unreadPrivate.includes(otherId)) {
            updatedUnread = [...state.unreadPrivate, otherId];
          }

          return {
            privateMessages: {
              ...state.privateMessages,
              [otherId]: newMsgs
            },
            unreadPrivate: updatedUnread,
            joinedRooms: updatedJoinedRooms
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
          const uid = presence.userId || presence.user_id || id;
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
      joinedRooms: [],
      incomingInvite: null,
      myProfile: null,
      unreadPrivate: []
    });
  },

  openPrivateChat: (targetUser) => {
    set((state) => {
       const isJoined = state.joinedRooms.find(r => r.id === targetUser.id);
       let newJoined = state.joinedRooms;
       if (!isJoined) {
           newJoined = [...state.joinedRooms, targetUser];
       }
       return { 
         joinedRooms: newJoined,
         activePrivateTab: targetUser,
         unreadPrivate: state.unreadPrivate.filter(id => id !== targetUser.id)
       };
    });
    
    // Broadcast invite blindly to update their UI
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

  closePrivateChat: (targetId) => {
    set((state) => {
      const newJoined = state.joinedRooms.filter(r => r.id !== targetId);
      return {
          joinedRooms: newJoined,
          activePrivateTab: state.activePrivateTab?.id === targetId ? null : state.activePrivateTab
      };
    });
  },

  switchToGlobal: () => set({ activePrivateTab: null }),

  acceptInvite: () => {
    const invite = get().incomingInvite;
    if (invite) {
      set((state) => {
         const isJoined = state.joinedRooms.find(r => r.id === invite.id);
         let newJoined = state.joinedRooms;
         if (!isJoined) {
             newJoined = [...state.joinedRooms, invite];
         }
         return {
            joinedRooms: newJoined,
            activePrivateTab: invite, 
            incomingInvite: null,
            unreadPrivate: state.unreadPrivate.filter(id => id !== invite.id)
         }
      });
    }
  },

  declineInvite: () => set({ incomingInvite: null }),

  sendPrivateMessage: async (targetId, content, targetName, imageUrl, audioUrl) => {
    const { myProfile, currentBroadcastChannel } = get();

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
        roomId: targetId,
        imageUrl,
        audioUrl
    };

    // Send using unified broadcast payload format over the public channel
    await currentBroadcastChannel.send({
      type: 'broadcast',
      event: 'private_message',
      payload: {
          targetId: targetId,
          message: { ...fullMsg, ...webPrivMsg }
      }
    });
    
    set((state) => {
        const currentMsgs = state.privateMessages[targetId] || [];
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
