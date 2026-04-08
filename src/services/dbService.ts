import { supabase } from '../lib/supabase';
import { Profile, Transaction } from '../types';

export const generateListingId = (prefix: string) => {
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${randomStr}${timestamp}`;
};

export const DBService = {
  supabase,
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Profile | null;
  },

  async ensureUserProfile(userId: string, fullName: string = 'Kullanıcı') {
    try {
      const profile = await this.getProfile(userId);
      if (profile) return profile;

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          avatar_url: `https://ui-avatars.com/api/?name=${fullName.replace(' ', '+')}&background=random&color=fff`,
          rating: 5.0,
          wallet_balance: 0
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return await this.getProfile(userId);
        }
        throw error;
      }
      return data as Profile;
    } catch (err) {
      console.error('ensureUserProfile error:', err);
      return null;
    }
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
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        seeker_id: seekerId,
        amount,
        listing_title: listingTitle,
        status: 'waiting-supporter',
        listing_id: generateListingId('REQ'),
        expiry_date: expiryDate.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as Transaction;
  },

  async renewTransaction(transactionId: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    return this.updateTransactionStatus(transactionId, 'waiting-supporter', {
      created_at: new Date().toISOString(),
      expiry_date: expiryDate.toISOString()
    });
  },

  async renewListing(listingId: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const { data, error } = await supabase
      .from('swap_listings')
      .update({ 
        status: 'active',
        created_at: new Date().toISOString(),
        expiry_date: expiryDate.toISOString()
      })
      .eq('id', listingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPendingTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select(`*, profiles!seeker_id(full_name, rating, avatar_url)`)
      .eq('status', 'waiting-supporter')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getUserTransactions(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`*, profiles!seeker_id(full_name, rating, avatar_url)`)
      .or(`seeker_id.eq.${userId},supporter_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getUserActiveTransaction(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`*, seeker:profiles!seeker_id(full_name), supporter:profiles!supporter_id(full_name)`)
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
      .select(`*, seeker:profiles!seeker_id(full_name), supporter:profiles!supporter_id(full_name)`)
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
    // Ensure profile exists for supporter
    await this.ensureUserProfile(supporterId);
    
    return this.updateTransactionStatus(transactionId, 'waiting-cash-payment', { 
      supporter_id: supporterId, 
      support_percentage: supportPercentage 
    });
  },

  async uploadImage(base64: string, bucket: string = 'images') {
    const { decode } = require('base64-arraybuffer');
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
      });
      
    if (error) throw error;
    
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
      
    return publicUrlData.publicUrl;
  }
};
