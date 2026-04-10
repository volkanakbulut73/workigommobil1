export type Profile = {
    id: string;
    full_name: string;
    avatar_url: string | null;
    rating: number;
    location: string | null;
    city: string | null;
    wallet_balance: number;
    total_earnings: number;
    iban: string | null;
    referral_code: string | null;
    role: string | null;
    created_at: string;
};

export type TransactionStatus =
    | 'pending'
    | 'waiting-supporter'
    | 'waiting-cash-payment'
    | 'cash-paid'
    | 'qr-uploaded'
    | 'completed'
    | 'cancelled'
    | 'dismissed';

export type Transaction = {
    id: string;
    listing_id: string | null;
    seeker_id: string;
    supporter_id: string | null;
    amount: number;
    listing_title: string;
    status: TransactionStatus;
    support_percentage: number;
    qr_url: string | null;
    city: string | null;
    district: string | null;
    created_at: string;
    expiry_date: string | null;
    profiles?: Partial<Profile>;
};

export type SwapListingStatus = 'active' | 'pending' | 'completed' | 'rejected' | 'expired';

export type SwapListing = {
    id: string;
    listing_id: string | null;
    owner_id: string;
    title: string;
    description: string | null;
    required_balance: number;
    photo_url: string | null;
    location?: string | null;
    city: string | null;
    district: string | null;
    status: SwapListingStatus;
    created_at: string;
    expiry_date: string | null;
    profiles?: Partial<Profile>;
};

export type MessageThreadType = 'market' | 'task' | 'private';

export type MessageThread = {
    id: string;
    listing_id: string | null;
    buyer_id: string;
    seller_id: string;
    type: MessageThreadType;
    last_message: string | null;
    updated_at: string;
    created_at: string;
    buyer?: Partial<Profile>;
    seller?: Partial<Profile>;
    listing?: Partial<SwapListing>;
};

export type Message = {
    id: string;
    thread_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    read: boolean;
    created_at: string;
    sender?: Partial<Profile>;
    receiver?: Partial<Profile>;
};

export type Notification = {
    id: string;
    user_id: string;
    type: 'new_message' | 'system' | 'transaction';
    title: string;
    content: string;
    link?: string;
    read: boolean;
    created_at: string;
};

export type SupportTicket = {
    id: string;
    owner_id: string;
    category: 'payment' | 'swap' | 'account' | 'bug' | 'other';
    message: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    created_at: string;
};
