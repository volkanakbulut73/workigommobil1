import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';
import { Alert } from 'react-native';

interface BlockState {
  blockedUsers: string[];
  loading: boolean;
  fetchBlocks: () => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isBlocked: (userId: string) => boolean;
}

export const useBlockStore = create<BlockState>((set, get) => ({
  blockedUsers: [],
  loading: false,

  fetchBlocks: async () => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return;

    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', profile.id);

      if (error && error.code !== '42P01') { // Ignore relation does not exist error initially
        console.error('Error fetching blocks:', error);
      } else if (data) {
        set({ blockedUsers: data.map(b => b.blocked_id) });
      }
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  blockUser: async (userId: string) => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return;

    try {
      // Optimistic update
      set(state => ({ blockedUsers: [...new Set([...state.blockedUsers, userId])] }));
      
      const { error } = await supabase
        .from('user_blocks')
        .insert({ blocker_id: profile.id, blocked_id: userId });

      if (error) {
        console.error('Error blocking user:', error);
        // Revert on error
        get().fetchBlocks();
      } else {
        Alert.alert("Başarılı", "Kullanıcı engellendi.");
      }
    } catch (err) {
      console.error(err);
    }
  },

  unblockUser: async (userId: string) => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.id) return;

    try {
      // Optimistic update
      set(state => ({ blockedUsers: state.blockedUsers.filter(id => id !== userId) }));

      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .match({ blocker_id: profile.id, blocked_id: userId });

      if (error) {
        console.error('Error unblocking user:', error);
        get().fetchBlocks();
      } else {
        Alert.alert("Başarılı", "Kullanıcının engeli kaldırıldı.");
      }
    } catch (err) {
      console.error(err);
    }
  },

  isBlocked: (userId: string) => {
    return get().blockedUsers.includes(userId);
  }
}));
