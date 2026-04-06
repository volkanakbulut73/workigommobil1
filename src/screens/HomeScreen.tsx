import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Animated, FlatList } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { Zap, Landmark, ArrowRightLeft, Activity, CreditCard, Gift, Send, QrCode, ChevronRight, Trophy, ArrowRight } from 'lucide-react-native';
import { Layout } from '../components/Layout';

const { width } = Dimensions.get('window');

const mockLiveTransactions = [
  { id: 1, title: 'Market Alışverişi', amount: '₺450.00', status: 'TAMAMLANDI', icon: CreditCard, time: 'Şimdi' },
  { id: 2, title: 'Restoran Ödemesi', amount: '₺120.00', status: 'BEKLEMEDE', icon: Gift, time: '8 sn. önce' },
  { id: 3, title: 'Nakit Çekim', amount: '₺1,200.00', status: 'TAMAMLANDI', icon: Send, time: '16 sn. önce' },
  { id: 4, title: 'QR Kasa İşlemi', amount: '₺85.50', status: 'TAMAMLANDI', icon: QrCode, time: '24 sn. önce' },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();
  
  const [activeBanner, setActiveBanner] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const screenWidth = width - 28;

  const banners = [
    { id: 1, image: require('../../assets/ban1.png'), badge: 'CANLI İŞLEM', title: 'Hızlı & Güvenli QR Takas', subtitle: 'Saniyeler içinde eşleş, anında kazan.' },
    { id: 2, image: require('../../assets/ban2.png'), badge: 'SİBER GÜVENLİK', title: 'Sıfır Hata Güvencesi', subtitle: 'Tüm işlemler blok zinciri düzeyinde korunur.' },
    { id: 3, image: require('../../assets/ban3.png'), badge: 'P2P GÜCÜ', title: 'Topluluk İle Birlikte Kazan', subtitle: 'Binlerce kullanıcı ile hemen eşleş.' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeBanner + 1) % banners.length;
      setActiveBanner(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 5000);
    return () => clearInterval(timer);
  }, [activeBanner]);

  return (
    <Layout>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatarContainer} onPress={() => navigation.navigate('Profile')}>
            <Image source={{ uri: profile?.avatar_url || 'https://ui-avatars.com/api/?name=User&background=33f20d&color=0a0b1e' }} style={styles.avatar} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.greetingText}>Selam, </Text>
            <Text style={styles.userNameText}>{profile?.full_name?.split(' ')[0] || 'Dostum'}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroWrapper}>
          <FlatList
            ref={flatListRef}
            data={banners}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setActiveBanner(index);
            }}
            renderItem={({ item }) => (
              <View style={[styles.heroBanner, { width: screenWidth }]}>
                <Image source={item.image} style={styles.heroBackgroundImage} />
              </View>
            )}
          />
          <View style={styles.indicators}>
            {banners.map((_, i) => (
              <View key={i} style={[styles.indicator, activeBanner === i ? styles.indicatorActive : styles.indicatorInactive]} />
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          {/* Toplam Tasarruf */}
          <View style={[styles.statCard, styles.statCardGreen]}>
            <View style={styles.statGlow} />
            <View style={styles.statTop}>
              <View style={styles.statIconBox}>
                <Landmark color="#8eff71" size={16} />
              </View>
              <View style={styles.statBadge}>
                <View style={styles.statBadgeDot} />
                <Text style={styles.statBadgeLabel}>CANLI</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>TOPLAM TASARRUF</Text>
            <Text style={styles.statValue}>₺1,450</Text>
          </View>

          {/* Toplam İşlem */}
          <View style={[styles.statCard, styles.statCardIndigo]}>
            <View style={[styles.statGlow, { backgroundColor: 'rgba(99,102,241,0.12)' }]} />
            <View style={styles.statTop}>
              <View style={[styles.statIconBox, { borderColor: 'rgba(99,102,241,0.3)' }]}>
                <ArrowRightLeft color="#818cf8" size={16} />
              </View>
              <View style={[styles.statBadge, { backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.2)' }]}>
                <View style={[styles.statBadgeDot, { backgroundColor: '#818cf8' }]} />
                <Text style={[styles.statBadgeLabel, { color: '#818cf8' }]}>SENK</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>TOPLAM İŞLEM</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
              <Text style={styles.statValue}>42</Text>
              <Text style={styles.statUnit}>Adet</Text>
            </View>
          </View>
        </View>

        {/* Katkı Payı - Full Width */}
        <View style={[styles.statCardFull, styles.statCardCyan]}>
          <View style={[styles.statGlow, { backgroundColor: 'rgba(34,211,238,0.1)', right: -30 }]} />
          <View style={styles.statTop}>
            <View style={[styles.statIconBox, { borderColor: 'rgba(34,211,238,0.3)' }]}>
              <Activity color="#22d3ee" size={16} />
            </View>
            <View style={[styles.statBadge, { backgroundColor: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.2)' }]}>
              <View style={[styles.statBadgeDot, { backgroundColor: '#22d3ee' }]} />
              <Text style={[styles.statBadgeLabel, { color: '#22d3ee' }]}>AKTİF</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={styles.statLabel}>KATKI PAYI</Text>
              <Text style={styles.statValue}>₺340</Text>
            </View>
            <Zap color="#22d3ee" size={28} style={{ opacity: 0.2 }} />
          </View>
        </View>

        {/* === CANLI AKIŞ (Live Feed) === */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.liveDot} />
              <Text style={styles.sectionTitle}>Canlı Akış</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('MarketTab')} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>TÜMÜNÜ GÖR</Text>
              <ChevronRight color="#8eff71" size={14} />
            </TouchableOpacity>
          </View>

          <View style={styles.feedCard}>
            {mockLiveTransactions.map((tx, idx) => (
              <View key={tx.id} style={[styles.feedItem, idx < mockLiveTransactions.length - 1 && styles.feedItemBorder]}>
                <View style={styles.feedLeft}>
                  <View style={styles.feedIconBox}>
                    <tx.icon color="#8eff71" size={16} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.feedTitle}>{tx.title}</Text>
                    <Text style={styles.feedTime}>{tx.time}</Text>
                  </View>
                </View>
                <View style={styles.feedRight}>
                  <Text style={styles.feedAmount}>{tx.amount}</Text>
                  <View style={[styles.feedStatus, tx.status === 'BEKLEMEDE' && styles.feedStatusPending]}>
                    <View style={[styles.feedStatusDot, tx.status === 'BEKLEMEDE' && { backgroundColor: '#eab308' }]} />
                    <Text style={[styles.feedStatusText, tx.status === 'BEKLEMEDE' && { color: '#eab308' }]}>{tx.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* === LİDERLİK TABLOSU === */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sıralama</Text>
          </View>

          <View style={styles.leaderCard}>
            {/* Rank 1 - Gold */}
            <View style={styles.rank1}>
              <View style={styles.rank1Left}>
                <View style={styles.rank1NumBox}>
                  <Text style={styles.rank1Num}>1</Text>
                </View>
                <Image source={{ uri: 'https://ui-avatars.com/api/?name=Ahmet+Y&background=0a0b1e&color=eab308' }} style={styles.rank1Avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rankName}>Ahmet Yılmaz</Text>
                  <View style={styles.rank1Bar}>
                    <View style={styles.rank1BarFill} />
                  </View>
                  <Text style={styles.rank1Points}>12.4k Puan</Text>
                </View>
              </View>
              <Trophy color="#eab308" size={20} />
            </View>

            {/* Rank 2 */}
            <View style={styles.rankItem}>
              <View style={styles.rankLeft}>
                <View style={styles.rankNumBox}>
                  <Text style={styles.rankNum}>2</Text>
                </View>
                <Image source={{ uri: 'https://ui-avatars.com/api/?name=Selin+D&background=1e293b&color=fff' }} style={styles.rankAvatar} />
                <View>
                  <Text style={styles.rankName}>Selin Demir</Text>
                  <Text style={styles.rankPoints}>10.1k Puan</Text>
                </View>
              </View>
            </View>

            {/* Rank 3 */}
            <View style={styles.rankItem}>
              <View style={styles.rankLeft}>
                <View style={[styles.rankNumBox, { backgroundColor: 'rgba(249,115,22,0.15)' }]}>
                  <Text style={[styles.rankNum, { color: '#f97316' }]}>3</Text>
                </View>
                <Image source={{ uri: 'https://ui-avatars.com/api/?name=Caner+S&background=431407&color=fdba74' }} style={styles.rankAvatar} />
                <View>
                  <Text style={styles.rankName}>Caner Şahin</Text>
                  <Text style={styles.rankPoints}>8.9k Puan</Text>
                </View>
              </View>
            </View>

            {/* All Rankings Button */}
            <TouchableOpacity style={styles.allRankBtn}>
              <Text style={styles.allRankBtnText}>TÜM LİDERLİK TABLOSU</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0e16' },
  contentContainer: { paddingHorizontal: 14, paddingTop: 72, paddingBottom: 32, gap: 10 },

  // Header (Top bar)
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 60,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, backgroundColor: 'rgba(12,14,22,1)', zIndex: 50,
    borderBottomWidth: 1, borderBottomColor: 'rgba(142,255,113,0.1)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1d1f2a', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 30, height: 30, borderRadius: 15 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  greetingText: { fontSize: 14, fontWeight: '500', color: '#aaaab6' },
  userNameText: { fontSize: 14, fontWeight: 'bold', color: '#8eff71' },
  headerRight: { width: 36, height: 36 },

  // Hero Banner (Super Compact)
  heroWrapper: {
    position: 'relative',
    marginTop: 4,
  },
  heroBanner: {
    position: 'relative', overflow: 'hidden', borderRadius: 18,
    backgroundColor: '#0a0b1e', borderWidth: 1, borderColor: 'rgba(142,255,113,0.12)',
    minHeight: 160,
    shadowColor: '#8eff71', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 15,
  },
  heroBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 11, 30, 0.75)',
  },
  heroContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  heroGlowGreen: {
    position: 'absolute', top: -50, right: -30, width: 140, height: 140,
    backgroundColor: 'rgba(142,255,113,0.06)', borderRadius: 70,
  },
  heroGlowCyan: {
    position: 'absolute', bottom: -30, left: -20, width: 100, height: 100,
    backgroundColor: 'rgba(34,211,238,0.04)', borderRadius: 50,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: 'rgba(142,255,113,0.1)', borderWidth: 1, borderColor: 'rgba(142,255,113,0.2)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
    marginBottom: 2,
  },
  heroBadgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#8eff71' },
  heroBadgeText: { color: '#8eff71', fontSize: 8, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff', letterSpacing: -0.8, lineHeight: 26, zIndex: 2 },
  heroTitleGreen: { color: '#8eff71' },
  heroSubtitle: { fontSize: 11, color: 'rgba(203,213,225,0.7)', lineHeight: 16, maxWidth: '80%' as any, zIndex: 2 },
  heroCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: '#8eff71', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginTop: 4,
    shadowColor: '#8eff71', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  heroCtaText: { color: '#0a0b1e', fontSize: 11, fontWeight: '900' },
  heroQrWrapper: {
    position: 'absolute', right: 12, bottom: 12, width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
    opacity: 0.4,
  },
  heroQrBorder: {
    position: 'absolute', inset: 0, width: 44, height: 44,
    borderWidth: 1, borderColor: 'rgba(142,255,113,0.15)', borderRadius: 10,
  },
  indicators: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    gap: 4,
  },
  indicator: {
    height: 3,
    borderRadius: 2,
  },
  indicatorActive: {
    width: 14,
    backgroundColor: '#8eff71',
  },
  indicatorInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(22,23,45,0.8)', borderRadius: 14,
    padding: 12, justifyContent: 'space-between', overflow: 'hidden', minHeight: 90,
    borderWidth: 1,
  },
  statCardGreen: { borderColor: 'rgba(142,255,113,0.12)' },
  statCardIndigo: { borderColor: 'rgba(99,102,241,0.12)' },
  statCardCyan: { borderColor: 'rgba(34,211,238,0.12)' },
  statCardFull: {
    backgroundColor: 'rgba(22,23,45,0.8)', borderRadius: 14,
    padding: 12, overflow: 'hidden', borderWidth: 1, gap: 4,
  },
  statGlow: {
    position: 'absolute', top: -30, right: -15, width: 80, height: 80,
    backgroundColor: 'rgba(142,255,113,0.08)', borderRadius: 40,
  },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statIconBox: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#0a0b1e',
    borderWidth: 1, borderColor: 'rgba(142,255,113,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  statBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(142,255,113,0.1)', borderWidth: 1, borderColor: 'rgba(142,255,113,0.15)',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5,
  },
  statBadgeDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#8eff71' },
  statBadgeLabel: { color: '#8eff71', fontSize: 6, fontWeight: '900', letterSpacing: 1 },
  statLabel: { color: '#aaaab6', fontSize: 8, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' as any, marginBottom: 1 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5 },
  statUnit: { fontSize: 10, fontWeight: '700', color: '#64748b' },

  // Live Feed
  section: { gap: 8 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2,
    marginBottom: 2,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#ffffff', letterSpacing: -0.4 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: '#8eff71', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },

  feedCard: {
    backgroundColor: 'rgba(22,23,45,0.5)', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(142,255,113,0.06)',
  },
  feedItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  feedItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  feedLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  feedIconBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(142,255,113,0.06)',
    borderWidth: 1, borderColor: 'rgba(142,255,113,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  feedTitle: { fontSize: 12, fontWeight: '700', color: '#ffffff', marginBottom: 1 },
  feedTime: { fontSize: 8, fontWeight: '700', color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' as any },
  feedRight: { alignItems: 'flex-end', gap: 2 },
  feedAmount: { fontSize: 13, fontWeight: '900', color: '#ffffff' },
  feedStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(142,255,113,0.06)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(142,255,113,0.15)',
  },
  feedStatusPending: { backgroundColor: 'rgba(234,179,8,0.06)', borderColor: 'rgba(234,179,8,0.15)' },
  feedStatusDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#8eff71' },
  feedStatusText: { fontSize: 7, fontWeight: '900', color: '#8eff71', letterSpacing: 1 },

  // Leaderboard
  leaderCard: {
    backgroundColor: 'rgba(22,23,45,0.6)', borderRadius: 20, padding: 12, gap: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  rank1: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, backgroundColor: 'rgba(234,179,8,0.08)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(234,179,8,0.2)',
  },
  rank1Left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rank1NumBox: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#eab308',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#eab308', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 8,
  },
  rank1Num: { color: '#0a0b1e', fontSize: 12, fontWeight: '900' },
  rank1Avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#eab308' },
  rank1Bar: { height: 4, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  rank1BarFill: { width: '90%', height: '100%', backgroundColor: '#eab308', borderRadius: 2 },
  rank1Points: { fontSize: 9, color: '#eab308', fontWeight: '900', letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' as any },

  rankItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  rankLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rankNumBox: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(148,163,184,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  rankNum: { color: '#94a3b8', fontSize: 12, fontWeight: '900' },
  rankAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#222531' },
  rankName: { fontSize: 13, fontWeight: '700', color: '#ffffff', marginBottom: 2 },
  rankPoints: { fontSize: 9, color: '#64748b', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' as any },

  allRankBtn: {
    paddingVertical: 14, alignItems: 'center', borderTopWidth: 1,
    borderTopColor: 'rgba(142,255,113,0.06)', marginTop: 4,
  },
  allRankBtnText: { color: '#8eff71', fontSize: 10, fontWeight: '900', letterSpacing: 3, opacity: 0.5 },
});
