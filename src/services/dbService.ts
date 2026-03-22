import { supabase } from '../lib/supabase';
import { Profile, Transaction } from '../types';

export const DBService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async createTransactionRequest(seekerId: string, amount: number, listingTitle: string) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        seeker_id: seekerId,
        amount,
        listing_title: listingTitle,
        status: 'waiting-supporter',
      })
      .select()
      .single();

    if (error) throw error;
    return data as Transaction;
  },

  async getPendingTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select(`*, profiles!transactions_seeker_id_fkey(full_name, rating, avatar_url)`)
      .eq('status', 'waiting-supporter')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getUserTransactions(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`*, profiles!transactions_seeker_id_fkey(full_name, rating, avatar_url)`)
      .or(`seeker_id.eq.${userId},supporter_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getUserActiveTransaction(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`*, seeker:profiles!transactions_seeker_id_fkey(full_name), supporter:profiles!transactions_supporter_id_fkey(full_name)`)
      .or(`seeker_id.eq.${userId},supporter_id.eq.${userId}`)
      .in('status', ['waiting-supporter', 'waiting-cash-payment', 'cash-paid', 'qr-uploaded'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows returned
    return data || null;
  },

  async getTransactionById(transactionId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`*, seeker:profiles!transactions_seeker_id_fkey(full_name), supporter:profiles!transactions_supporter_id_fkey(full_name)`)
      .eq('id', transactionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async updateTransactionStatus(transactionId: string, status: Transaction['status'], updates: Partial<Transaction> = {}) {
    const { data, error } = await supabase
      .from('transactions')
      .update({ status, ...updates })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return data as Transaction;
  },

  async acceptTransaction(transactionId: string, supporterId: string, supportPercentage: number) {
    return this.updateTransactionStatus(transactionId, 'waiting-cash-payment', { supporter_id: supporterId, support_percentage: supportPercentage });
  }
};
