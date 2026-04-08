export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  rating: number;
  balance: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  listing_id: string | null;
  seeker_id: string;
  supporter_id: string | null;
  amount: number;
  status: 'pending' | 'waiting-supporter' | 'waiting-cash-payment' | 'cash-paid' | 'qr-uploaded' | 'completed' | 'cancelled';
  listing_title: string;
  support_percentage: number;
  created_at: string;
  expiry_date: string | null;
}

export interface SwapListing {
  id: string;
  listing_id: string | null;
  user_id: string;
  title: string;
  description: string;
  photo_url: string;
  required_balance: number;
  status: 'active' | 'pending' | 'completed' | 'rejected' | 'expired';
  created_at: string;
  expiry_date: string | null;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Thread {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  type: 'market' | 'task' | 'private';
  updated_at: string;
  seller?: any;
  listing?: any;
}
