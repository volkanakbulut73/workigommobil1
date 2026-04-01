import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AnalyticsService } from '../services/analyticsService';
import { DBService } from '../services/dbService';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: any | null) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  signOut: async () => {
    await supabase.auth.signOut();
    AnalyticsService.resetUser();
    set({ session: null, user: null, profile: null });
  },
  initialize: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log('Session fetch error (expected if token expired):', error.message);
      }
      
      const session = data?.session || null;
      set({ session, user: session?.user ?? null, loading: false });

      if (session?.user) {
        const profile = await DBService.ensureUserProfile(
          session.user.id, 
          session.user.user_metadata?.full_name || 'Kullanıcı'
        );
        set({ profile });
        if (profile) {
          AnalyticsService.identifyUser(session.user.id, profile);
        }
      }
    } catch (e: any) {
      console.log('Auth error:', e?.message || e);
      set({ session: null, user: null, loading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        const profile = await DBService.ensureUserProfile(
          session.user.id, 
          session.user.user_metadata?.full_name || 'Kullanıcı'
        );
        set({ profile });
        if (profile) {
          AnalyticsService.identifyUser(session.user.id, profile);
        }
      } else {
        set({ profile: null });
        AnalyticsService.resetUser();
      }
    });
  },
}));
