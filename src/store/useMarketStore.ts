import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { SwapListing } from '../types';

interface MarketStore {
  listings: SwapListing[];
  myListings: SwapListing[];
  loading: boolean;
  error: string | null;
  fetchListings: (userId?: string) => Promise<void>;
}

export const useMarketStore = create<MarketStore>((set) => ({
  listings: [],
  myListings: [],
  loading: false,
  error: null,
  
  fetchListings: async (userId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('swap_listings')
        .select('*, profiles(full_name, avatar_url, rating)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const allListings = (data || []) as unknown as SwapListing[];
      
      // Pazar sekmesi: Sadece 'active' statüsündeki ve süresi dolmamış ilanlar (Web ile aynı mantık)
      const now = new Date();
      const marketListings = allListings.filter(item => {
        if (item.status !== 'active') return false;
        if (item.expiry_date && new Date(item.expiry_date) < now) return false;
        return true;
      });
      
      // İlanlarım sekmesi: Kullanıcının kendi ilanları (completed hariç, pending dahil)
      const myListings = userId 
        ? allListings.filter(item => (item as any).owner_id === userId && item.status !== 'completed') 
        : [];

      set({ listings: marketListings, myListings, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
