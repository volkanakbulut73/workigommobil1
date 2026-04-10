import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import {
  ChevronLeft, Shield, ShieldCheck, BarChart3, ShoppingBag,
  User, MapPin, Calendar, ExternalLink, Ban
} from 'lucide-react-native';

/* ═══ Types ═══ */
interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  location: string | null;
  role: string | null;
  wallet_balance: number;
  total_earnings: number;
  rating: number;
  iban: string | null;
  referral_code: string | null;
  created_at: string;
}

interface UserTransaction {
  id: string;
  listing_id: string | null;
  listing_title: string;
  amount: number;
  status: string;
  support_percentage: number;
  seeker_id: string;
  supporter_id: string | null;
  created_at: string;
}

interface UserListing {
  id: string;
  listing_id: string | null;
  title: string;
  required_balance: number;
  status: string;
  city: string | null;
  created_at: string;
}

type TabKey = 'overview' | 'transactions' | 'listings' | 'activity';
type RootStackParamList = { UserDetail: { userId: string } };

/* ═══ Helpers ═══ */
const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    'completed': '#39ff14', 'cancelled': '#c50015', 'dismissed': '#94a3b8',
    'pending': '#f59e0b', 'waiting-supporter': '#facc15', 'waiting-cash-payment': '#3b82f6',
    'cash-paid': '#06b6d4', 'qr-uploaded': '#a855f7', 'active': '#39ff14',
    'expired': '#94a3b8', 'rejected': '#c50015',
  };
  return map[status] || '#baccb0';
};

const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    'completed': 'TAMAMLANDI', 'cancelled': 'İPTAL', 'dismissed': 'RED',
    'pending': 'ONAY_BEKLİYOR', 'waiting-supporter': 'YAYINDA',
    'waiting-cash-payment': 'ÖDEME_BEKLENİYOR', 'cash-paid': 'NAKİT_ÖDEME',
    'qr-uploaded': 'QR_YÜKLEME', 'active': 'AKTİF', 'expired': 'SÜRESİ_DOLDU',
    'rejected': 'RED',
  };
  return map[status] || status.toUpperCase();
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatCurrency = (v: number) =>
  v.toLocaleString('tr-TR', { minimumFractionDigits: 0 });

/* ═══ Main Component ═══ */
export function UserDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'UserDetail'>>();
  const insets = useSafeAreaInsets();
  const userId = route.params.userId;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [listings, setListings] = useState<UserListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => {
    if (userId) fetchUserData(userId);
  }, [userId]);

  const fetchUserData = async (uid: string) => {
    setLoading(true);
    try {
      const [profileRes, txRes, listingRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase.from('transactions').select('*').or(`seeker_id.eq.${uid},supporter_id.eq.${uid}`).order('created_at', { ascending: false }),
        supabase.from('swap_listings').select('*').eq('owner_id', uid).order('created_at', { ascending: false }),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (txRes.error) throw txRes.error;
      if (listingRes.error) throw listingRes.error;

      setProfile(profileRes.data);
      setTransactions(txRes.data || []);
      setListings(listingRes.data || []);
    } catch (err) {
      console.error('UserDetail fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ═══ Derived Data ═══ */
  const completedCount = useMemo(() =>
    transactions.filter(t => t.status === 'completed').length, [transactions]);

  const trustScore = useMemo(() => {
    if (transactions.length === 0) return 0;
    return Math.round((completedCount / transactions.length) * 100);
  }, [completedCount, transactions.length]);

  const totalVolume = useMemo(() =>
    transactions.filter(t => t.status === 'completed').reduce((s, t) => s + Number(t.amount), 0), [transactions]);

  const trustColor = trustScore >= 80 ? '#39ff14' : trustScore >= 50 ? '#facc15' : '#c50015';

  /* ═══ Tab Config ═══ */
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview', label: 'GENEL' },
    { key: 'transactions', label: 'İŞLEMLER', count: transactions.length },
    { key: 'listings', label: 'İLANLAR', count: listings.length },
    { key: 'activity', label: 'AKTİVİTE' },
  ];

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color="#39ff14" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[s.center, { paddingTop: insets.top + 60 }]}>
        <Text style={s.emptyText}>Kullanıcı bulunamadı</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#39ff14', fontSize: 14 }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>

        {/* ═══ HEADER ═══ */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft size={18} color="#39ff14" />
          <Text style={s.backText}>KULLANICI_LİSTESİ</Text>
        </TouchableOpacity>

        {/* ═══ PROFILE CARD ═══ */}
        <View style={s.profileCard}>
          <View style={s.avatarBox}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={s.avatar} />
            ) : (
              <User size={28} color="#baccb0" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.nameText}>{profile.full_name}</Text>
            <View style={s.metaRow}>
              {profile.city && (
                <View style={s.metaItem}>
                  <MapPin size={10} color="#baccb0" />
                  <Text style={s.metaText}>{profile.city}</Text>
                </View>
              )}
              <View style={s.metaItem}>
                <Calendar size={10} color="#baccb0" />
                <Text style={s.metaText}>{formatDate(profile.created_at)}</Text>
              </View>
            </View>
            {profile.role === 'admin' && (
              <View style={s.adminBadge}>
                <ShieldCheck size={10} color="#39ff14" />
                <Text style={s.adminText}>ADMİN</Text>
              </View>
            )}
          </View>
        </View>

        {/* ═══ GÜVEN_SKORU ═══ */}
        <View style={s.trustCard}>
          <Text style={s.trustLabel}>GÜVEN_SKORU</Text>
          <Text style={[s.trustScore, { color: trustColor, textShadowColor: `${trustColor}40` }]}>
            {trustScore}
          </Text>
          <Text style={s.trustSubtext}>/ 100</Text>
          <View style={s.trustBar}>
            <View style={[s.trustBarFill, { width: `${trustScore}%`, backgroundColor: trustColor }]} />
          </View>
          <View style={s.trustLabelRow}>
            {trustScore >= 80 ? <ShieldCheck size={12} color={trustColor} /> :
             trustScore >= 50 ? <Shield size={12} color={trustColor} /> :
             <Ban size={12} color={trustColor} />}
            <Text style={[s.trustStatusText, { color: trustColor }]}>
              {trustScore >= 80 ? 'GÜVENİLİR' : trustScore >= 50 ? 'ORTA_RİSK' : 'YÜKSEK_RİSK'}
            </Text>
          </View>
        </View>

        {/* ═══ MINI STATS ═══ */}
        <View style={s.statsRow}>
          {[
            { label: 'İŞLEM', value: `${transactions.length}`, color: '#e1e2e7' },
            { label: 'BAŞARILI', value: `${completedCount}`, color: '#39ff14' },
            { label: 'HACİM', value: `${formatCurrency(totalVolume)}₺`, color: '#e1e2e7' },
            { label: 'İLAN', value: `${listings.length}`, color: '#e1e2e7' },
          ].map((stat) => (
            <View key={stat.label} style={s.statBox}>
              <Text style={s.statLabel}>{stat.label}</Text>
              <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* ═══ TABS ═══ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabContainer}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[s.tabBtn, activeTab === tab.key && s.tabBtnActive]}
            >
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
                {tab.label}
                {tab.count !== undefined ? ` (${tab.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ═══ TAB CONTENT ═══ */}

        {/* Tab 1: Genel Bakış */}
        {activeTab === 'overview' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>PROFİL_VERİLERİ</Text>
            {[
              ['KULLANICI_ID', profile.id.slice(0, 12) + '...'],
              ['TAM_AD', profile.full_name],
              ['KONUM', profile.city || profile.location || '—'],
              ['ROL', profile.role?.toUpperCase() || 'USER'],
              ['IBAN', profile.iban || '—'],
              ['REFERANS', profile.referral_code || '—'],
              ['KAYIT_TARİHİ', formatDate(profile.created_at)],
            ].map(([label, value]) => (
              <View key={label} style={s.dataRow}>
                <Text style={s.dataLabel}>{label}</Text>
                <Text style={s.dataValue}>{value}</Text>
              </View>
            ))}

            <Text style={[s.sectionTitle, { marginTop: 20 }]}>FİNANSAL_ÖZET</Text>
            {[
              ['CÜZDAN', `${formatCurrency(profile.wallet_balance)} ₺`],
              ['TOPLAM_KAZANÇ', `${formatCurrency(profile.total_earnings)} ₺`],
              ['İŞLEM_HACMİ', `${formatCurrency(totalVolume)} ₺`],
              ['BAŞARI_ORANI', `${trustScore}%`],
              ['PUAN', `${profile.rating}`],
            ].map(([label, value]) => (
              <View key={label} style={s.dataRow}>
                <Text style={s.dataLabel}>{label}</Text>
                <Text style={s.dataValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tab 2: İşlemler */}
        {activeTab === 'transactions' && (
          <View style={s.section}>
            {transactions.length === 0 ? (
              <Text style={s.emptyText}>İşlem bulunamadı</Text>
            ) : transactions.map((t) => {
              const statusColor = getStatusColor(t.status);
              return (
                <TouchableOpacity
                  key={t.id}
                  style={s.listCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Tracker', { transactionId: t.id })}
                >
                  <View style={s.listCardHeader}>
                    {t.listing_id ? (
                      <View style={s.idBadge}>
                        <Text style={s.idBadgeText}>{t.listing_id}</Text>
                      </View>
                    ) : (
                      <Text style={s.idShort}>{t.id.slice(0, 8)}</Text>
                    )}
                    <View style={{
                      borderWidth: 1,
                      borderColor: t.seeker_id === userId ? 'rgba(6,182,212,0.3)' : 'rgba(168,85,247,0.3)',
                      backgroundColor: t.seeker_id === userId ? 'rgba(6,182,212,0.05)' : 'rgba(168,85,247,0.05)',
                      paddingHorizontal: 6, paddingVertical: 2,
                    }}>
                      <Text style={{
                        color: t.seeker_id === userId ? '#06b6d4' : '#a855f7',
                        fontSize: 8, fontWeight: '900', letterSpacing: 1,
                      }}>
                        {t.seeker_id === userId ? 'SEEKER' : 'SUPPORTER'}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.listTitle} numberOfLines={1}>{t.listing_title || '—'}</Text>
                  <View style={s.listCardFooter}>
                    <Text style={s.amountText}>{Number(t.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                    <View style={s.statusRow}>
                      <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[s.statusText, { color: statusColor }]}>{getStatusLabel(t.status)}</Text>
                    </View>
                  </View>
                  <Text style={s.dateText}>{formatDate(t.created_at)}</Text>
                  <View style={s.gotoRow}>
                    <ExternalLink size={10} color="#39ff14" />
                    <Text style={s.gotoText}>TRACKER'A GİT</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Tab 3: İlanlar */}
        {activeTab === 'listings' && (
          <View style={s.section}>
            {listings.length === 0 ? (
              <Text style={s.emptyText}>İlan bulunamadı</Text>
            ) : listings.map((l) => {
              const statusColor = getStatusColor(l.status);
              return (
                <TouchableOpacity
                  key={l.id}
                  style={s.listCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('MarketDetail', { listingId: l.id })}
                >
                  <View style={s.listCardHeader}>
                    {l.listing_id ? (
                      <View style={s.idBadge}>
                        <Text style={s.idBadgeText}>{l.listing_id}</Text>
                      </View>
                    ) : null}
                    <View style={s.statusRow}>
                      <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[s.statusText, { color: statusColor }]}>{getStatusLabel(l.status)}</Text>
                    </View>
                  </View>
                  <Text style={s.listTitle} numberOfLines={1}>{l.title}</Text>
                  <View style={s.listCardFooter}>
                    <Text style={s.amountText}>{Number(l.required_balance).toLocaleString('tr-TR')} ₺</Text>
                    <Text style={s.cityText}>{l.city || '—'}</Text>
                  </View>
                  <Text style={s.dateText}>{formatDate(l.created_at)}</Text>
                  <View style={s.gotoRow}>
                    <ExternalLink size={10} color="#39ff14" />
                    <Text style={s.gotoText}>İLAN DETAY</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Tab 4: Aktivite */}
        {activeTab === 'activity' && (
          <View style={s.section}>
            {transactions.length === 0 && listings.length === 0 ? (
              <Text style={s.emptyText}>Aktivite bulunamadı</Text>
            ) : (
              [...transactions.map(t => ({ ...t, _type: 'tx' as const })),
               ...listings.map(l => ({ ...l, amount: l.required_balance, listing_title: l.title, _type: 'listing' as const, seeker_id: userId, supporter_id: null }))]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 20)
                .map((item, i) => {
                  const statusColor = getStatusColor(item.status);
                  return (
                    <View key={`${item.id}-${i}`} style={s.timelineItem}>
                      <View style={{ width: 24, height: 24, backgroundColor: '#191c1f', borderWidth: 1, borderColor: 'rgba(60,75,53,0.3)', alignItems: 'center', justifyContent: 'center' }} >
                        {item._type === 'tx' ? <BarChart3 size={10} color="#39ff14" /> : <ShoppingBag size={10} color="#06b6d4" />}
                      </View>
                      <View style={s.timelineContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={s.timelineLabel}>{item._type === 'tx' ? 'İşlem' : 'İlan'}</Text>
                          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                          <Text style={[s.statusText, { color: statusColor, fontSize: 9 }]}>{getStatusLabel(item.status)}</Text>
                        </View>
                        <Text style={s.timelineTitle} numberOfLines={1}>
                          {'listing_title' in item ? item.listing_title : ''}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                          <Text style={s.dateText}>{formatDate(item.created_at)}</Text>
                          <Text style={{ color: '#baccb0', fontSize: 10, fontWeight: '700' }}>{formatCurrency(Number(item.amount))} ₺</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

/* ═══ Styles ═══ */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0e16' },
  center: { flex: 1, backgroundColor: '#0c0e16', alignItems: 'center', justifyContent: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: '#39ff14', fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },

  // Profile card
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, padding: 16,
    backgroundColor: 'rgba(29,32,35,0.6)', borderWidth: 1, borderColor: 'rgba(60,75,53,0.15)',
  },
  avatarBox: {
    width: 56, height: 56, backgroundColor: '#191c1f', borderWidth: 1,
    borderColor: 'rgba(60,75,53,0.4)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  nameText: { color: '#fff', fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: 'rgba(186,204,176,0.6)', fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
    backgroundColor: 'rgba(57,255,20,0.1)', borderWidth: 1, borderColor: 'rgba(57,255,20,0.3)',
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start',
  },
  adminText: { color: '#39ff14', fontSize: 9, fontWeight: '900' },

  // Trust score
  trustCard: {
    marginHorizontal: 16, marginTop: 12, padding: 20,
    backgroundColor: 'rgba(29,32,35,0.6)', borderWidth: 1, borderColor: 'rgba(60,75,53,0.15)',
    alignItems: 'center',
  },
  trustLabel: { color: '#baccb0', fontSize: 10, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase' },
  trustScore: { fontSize: 52, fontWeight: '900', marginTop: 4, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  trustSubtext: { color: 'rgba(186,204,176,0.5)', fontSize: 12, fontWeight: '600', marginTop: -4 },
  trustBar: { width: '100%', height: 6, backgroundColor: '#323539', borderRadius: 3, overflow: 'hidden', marginTop: 16 },
  trustBarFill: { height: '100%', borderRadius: 3 },
  trustLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  trustStatusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },

  // Stats
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 8 },
  statBox: {
    flex: 1, backgroundColor: 'rgba(29,32,35,0.6)', borderWidth: 1,
    borderColor: 'rgba(60,75,53,0.15)', padding: 10, alignItems: 'center',
  },
  statLabel: { color: 'rgba(186,204,176,0.5)', fontSize: 8, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '900', marginTop: 4 },

  // Tabs
  tabScroll: { marginTop: 16 },
  tabContainer: { paddingHorizontal: 16, gap: 0 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#39ff14', backgroundColor: 'rgba(57,255,20,0.05)' },
  tabText: { color: 'rgba(186,204,176,0.5)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  tabTextActive: { color: '#39ff14' },

  // Section
  section: { paddingHorizontal: 16, marginTop: 12, gap: 8 },
  sectionTitle: { color: 'rgba(57,255,20,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 8, marginTop: 4 },

  // Data rows
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(60,75,53,0.08)' },
  dataLabel: { color: 'rgba(186,204,176,0.5)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  dataValue: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // List cards
  listCard: {
    backgroundColor: 'rgba(29,32,35,0.6)', borderWidth: 1, borderColor: 'rgba(60,75,53,0.15)',
    padding: 14, marginBottom: 4,
  },
  listCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  listCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  listTitle: { color: '#fff', fontSize: 13, fontWeight: '700' },
  amountText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  cityText: { color: 'rgba(186,204,176,0.5)', fontSize: 11 },
  dateText: { color: 'rgba(186,204,176,0.3)', fontSize: 9, fontFamily: 'monospace', marginTop: 4 },

  // ID badge
  idBadge: {
    backgroundColor: 'rgba(57,255,20,0.1)', borderWidth: 1, borderColor: 'rgba(57,255,20,0.3)',
    paddingHorizontal: 8, paddingVertical: 2,
  },
  idBadgeText: { color: '#39ff14', fontSize: 9, fontWeight: '900' as const, letterSpacing: 1 },
  idShort: { color: '#baccb0', fontSize: 10, fontFamily: 'monospace' },

  // Status
  statusRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 9, fontWeight: '800' as const, letterSpacing: 0.5 },

  // Goto
  gotoRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, marginTop: 8 },
  gotoText: { color: '#39ff14', fontSize: 9, fontWeight: '800' as const, letterSpacing: 1 },

  // Empty
  emptyText: { color: 'rgba(186,204,176,0.4)', fontSize: 13, textAlign: 'center' as const, paddingVertical: 40, textTransform: 'uppercase' as const },

  // Timeline
  timelineItem: { flexDirection: 'row' as const, gap: 12, paddingVertical: 10 },
  timelineContent: { flex: 1 },
  timelineLabel: { color: '#fff', fontSize: 11, fontWeight: '800' as const },
  timelineTitle: { color: 'rgba(186,204,176,0.6)', fontSize: 11, marginTop: 2 },
});

export default UserDetailScreen;
