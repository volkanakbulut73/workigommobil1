import { create } from 'zustand';
import { RealtimeChannel } from '@supabase/supabase-js';
import { RealtimeService } from '../services/realtimeService';

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

    // 2. Setup Broadcast Channel for incoming messages
    const bChannel = RealtimeService.subscribeToBroadcast(roomName, (payload) => {
      // payload structure depends on how we send it
      const msg = payload.payload as MuhabbetMessage;
      get().addMessage(msg);
    });

    // 3. Setup Presence Channel
    const pChannel = RealtimeService.trackPresence(roomName, userId, profile);
    
    // Update presence counts when state changes
    pChannel.on('presence', { event: 'sync' }, () => {
      const state = pChannel.presenceState();
      // Calculate total online users and exact list
      const users = Object.values(state).map((entries: any) => entries[0]);
      set({ 
        onlineUsers: Object.keys(state).length,
        presenceList: users
      });
    });

    set({ 
      currentBroadcastChannel: bChannel,
      currentPresenceChannel: pChannel,
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

    const fullMsg: MuhabbetMessage = {
      ...message,
      id: Math.random().toString(), // Temp ID for broadcast
      created_at: new Date().toISOString()
    };

    // Broadcast the message to all connected clients
    await currentBroadcastChannel.send({
      type: 'broadcast',
      event: 'message',
      payload: fullMsg
    });

    // Optimistically add to our own list
    get().addMessage(fullMsg);
  },

  leaveRoom: () => {
    const { currentBroadcastChannel, currentPresenceChannel } = get();
    
    if (currentBroadcastChannel) {
      currentBroadcastChannel.unsubscribe();
    }
    if (currentPresenceChannel) {
      currentPresenceChannel.unsubscribe();
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
