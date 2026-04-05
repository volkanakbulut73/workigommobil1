import { supabase } from '../lib/supabase';
import { Profile, Transaction } from '../types';

const withTimeout = <T>(promise: PromiseLike<T>, ms: number = 10000): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('İstek zaman aşımına uğradı, lütfen bağlantınızı kontrol edin.')), ms)
    )
  ]);
};

export const DBService = {
  supabase,
  async getProfile(userId: string) {
    const { data: qData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .limit(1);
    const data = qData?.[0];

    if (error && error.code !== 'PGRST116') throw error;
    return data as Profile | null;
  },

  async ensureUserProfile(userId: string, fullName: string = 'Kullanıcı') {
    try {
      const profile = await this.getProfile(userId);
      if (profile) return profile;

      const { data: iData, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff`,
          rating: 5.0,
          location: 'İSTANBUL',
          referral_code: 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          wallet_balance: 0,
          total_earnings: 0
        })
        .select()
        .limit(1);
      const data = iData?.[0];

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
    const { data: uData, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .limit(1);
    const data = uData?.[0];

    if (error) throw error;
    return data as Profile;
  },

  async createTransactionRequest(seekerId: string, amount: number, listingTitle: string, city?: string, district?: string) {
    const { data: tData, error } = await supabase
      .from('transactions')
      .insert({
        seeker_id: seekerId,
        amount,
        listing_title: listingTitle,
        status: 'waiting-supporter',
        city: city || null,
        district: district || null,
      })
      .select()
      .limit(1);
    const data = tData?.[0];

    if (error) throw error;
    return data as Transaction;
  },

  async getPendingTransactions() {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('transactions')
          .select(`*, profiles!seeker_id(full_name, rating, avatar_url)`)
          .eq('status', 'waiting-supporter')
          .order('created_at', { ascending: false }),
        15000
      ) as any;

      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Pending fetch failed:', e);
      return [];
    }
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
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  },

  async getTransactionById(transactionId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`*, seeker:profiles!seeker_id(full_name), supporter:profiles!supporter_id(full_name)`)
      .eq('id', transactionId)
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  },

  async updateTransactionStatus(transactionId: string, status: Transaction['status'], updates: Partial<Transaction> = {}) {
    const { data, error } = await supabase
      .from('transactions')
      .update({ status, ...updates })
      .eq('id', transactionId)
      .select();

    if (error) throw error;
    const tx = data?.[0];
    if (!tx) throw new Error('Güncelleme yapılamadı. RLS yetkisi yok veya kayıt bulunamadı.');
    
    // Broadcast to public-chat to trigger Realtime UI updates
    const channel = supabase.channel('public-chat');
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'transaction_updated',
          payload: { transactionId }
        });
        supabase.removeChannel(channel);
      }
    });

    return tx as Transaction;
  },

  async acceptTransaction(transactionId: string, supporterId: string, supportPercentage: number) {
    // Ensure profile exists for supporter
    await this.ensureUserProfile(supporterId);
    
    return withTimeout(
      this.updateTransactionStatus(transactionId, 'waiting-cash-payment', { 
        supporter_id: supporterId, 
        support_percentage: supportPercentage 
      }),
      10000
    );
  },

  // Seeker iptal ederse → talep tamamen iptal olur
  async cancelTransactionBySeeker(transactionId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .update({ status: 'cancelled' })
      .eq('id', transactionId)
      .select();

    if (error) throw error;

    const channel = supabase.channel('public-chat');
    channel.subscribe(async (s: string) => {
      if (s === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'transaction_updated',
          payload: { transactionId }
        });
        supabase.removeChannel(channel);
      }
    });

    return data?.[0] || null;
  },

  // Supporter iptal ederse → talep listeye geri döner, başka supporter aranır
  async cancelTransactionBySupporter(transactionId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status: 'waiting-supporter',
        supporter_id: null,
        support_percentage: 12,
      })
      .eq('id', transactionId)
      .select();

    if (error) throw error;

    const channel = supabase.channel('public-chat');
    channel.subscribe(async (s: string) => {
      if (s === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'transaction_updated',
          payload: { transactionId }
        });
        supabase.removeChannel(channel);
      }
    });

    return data?.[0] || null;
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
