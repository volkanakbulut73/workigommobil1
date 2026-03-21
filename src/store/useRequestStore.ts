import { create } from 'zustand';
import { DBService } from '../services/dbService';
import { AnalyticsService } from '../services/analyticsService';

interface RequestStore {
  otherTransactions: any[];
  myTransactions: any[];
  loading: boolean;
  error: string | null;
  fetchTransactions: (userId?: string) => Promise<void>;
  acceptTransaction: (transactionId: string, supporterId: string, supportPercentage: number) => Promise<void>;
  cancelTransaction: (transactionId: string, userId: string) => Promise<void>;
}

export const useRequestStore = create<RequestStore>((set) => ({
  otherTransactions: [],
  myTransactions: [],
  loading: false,
  error: null,
  
  fetchTransactions: async (userId) => {
    set({ loading: true, error: null });
    try {
      const data = await DBService.getPendingTransactions();
      
      const allTxs = data || [];
      const myTxs = userId ? allTxs.filter((tx: any) => tx.seeker_id === userId) : [];
      const otherTxs = userId ? allTxs.filter((tx: any) => tx.seeker_id !== userId) : allTxs;

      set({ otherTransactions: otherTxs, myTransactions: myTxs, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  acceptTransaction: async (transactionId: string, supporterId: string, supportPercentage: number) => {
    set({ loading: true, error: null });
    try {
      await DBService.acceptTransaction(transactionId, supporterId, supportPercentage);
      AnalyticsService.trackEvent('talep_accepted', { transactionId, supportPercentage });
      // Re-fetch to update lists
      const data = await DBService.getPendingTransactions();
      const allTxs = data || [];
      const myTxs = allTxs.filter((tx: any) => tx.seeker_id === supporterId);
      const otherTxs = allTxs.filter((tx: any) => tx.seeker_id !== supporterId);
      set({ otherTransactions: otherTxs, myTransactions: myTxs, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  cancelTransaction: async (transactionId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      await DBService.updateTransactionStatus(transactionId, 'cancelled');
      AnalyticsService.trackEvent('talep_cancelled', { transactionId });
      // Re-fetch to update lists
      const data = await DBService.getPendingTransactions();
      const allTxs = data || [];
      const myTxs = allTxs.filter((tx: any) => tx.seeker_id === userId);
      const otherTxs = allTxs.filter((tx: any) => tx.seeker_id !== userId);
      set({ otherTransactions: otherTxs, myTransactions: myTxs, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
