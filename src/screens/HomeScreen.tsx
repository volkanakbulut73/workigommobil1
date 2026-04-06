import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { Zap, Landmark, ArrowRightLeft, Activity, CreditCard, Gift, Send, QrCode, ChevronRight, Trophy, Store, Utensils, ArrowRight } from 'lucide-react-native';
import { Layout } from '../components/Layout';

const { width } = Dimensions.get('window');

const mockLiveTransactions = [
  { id: 1, title: 'Market Alışverişi', amount: '₺450.00', status: 'TAMAMLANDI', icon: CreditCard, time: 'Şimdi' },
  { id: 2, title: 'Restoran Ödemesi', amount: '₺120.00', status: 'BEKLEMEDE', icon: Gift, time: '8 sn. önce' },
  { id: 3, title: 'Nakit Çekim', amount: '₺1,200.00', status: 'TAMAMLANDI', icon: Send, time: '16 sn. önce' },
  { id: 4, title: 'QR Kasa İşlemi', amount: '₺85.50', status: 'TAMAMLANDI', icon: QrCode, time: '24 sn. önce' },
];

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const navigation = useNavigation<any>();

  return (
    <Layout>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: profile?.avatar_url || 'https://ui-avatars.com/api/?name=User&background=33f20d&color=0a0b1e' }}
              style={styles.avatar}
            />
          </View>
        </View>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.greetingText}>Selam, </Text>
          <Text style={styles.userNameText}>{profile?.full_name?.split(' ')[0] || 'Dostum'}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

        {/* === CYBERPUNK HERO BANNER === */}
        <TouchableOpacity style={styles.heroBanner} activeOpacity={0.9} onPress={() => navigation.navigate('TaleplerCreate')}>
          {/* Glow orbs */}
          <View style={styles.heroGlowGreen} />
          <View style={styles.heroGlowCyan} />

          {/* Badge */}
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text style={styles.heroBadgeText}>CANLI İŞLEM AĞI</Text>
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>
            Hızlı ve Güvenli{' '}
            <Text style={styles.heroTitleGreen}>QR Takas</Text>
          </Text>

          {/* Subtitle */}
          <Text style={styles.heroSubtitle}>
            Sistem sürekli aktif. Saniyeler içinde eşleş, hesabını öde ve anında kazanmaya başla.
          </Text>

          {/* CTA Button */}
          <TouchableOpacity style={styles.heroCta} activeOpacity={0.8} onPress={() => navigation.navigate('TaleplerCreate')}>
            <Text style={styles.heroCtaText}>Tüm İşlemleri Keşfet</Text>
            <ArrowRight color="#0a0b1e" size={16} />
          </TouchableOpacity>

          {/* QR icon decorative */}
          <View style={styles.heroQrWrapper}>
            <View style={styles.heroQrBorder} />
            <QrCode color="#8eff71" size={36} style={{ opacity: 0.6 }} />
          </View>
        </TouchableOpacity>

        {/* === STAT CARDS === */}
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
  contentContainer: { paddingHorizontal: 16, paddingTop: 76, paddingBottom: 40, gap: 12 },

  // Header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 64,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, backgroundColor: 'rgba(12,14,22,0.98)', zIndex: 50,
    borderBottomWidth: 1, borderBottomColor: 'rgba(142,255,113,0.08)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1d1f2a', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  greetingText: { fontSize: 16, fontWeight: '500', color: '#aaaab6' },
  userNameText: { fontSize: 16, fontWeight: 'bold', color: '#8eff71' },
  headerRight: { width: 40, height: 40 },

  // Hero Banner
  heroBanner: {
    position: 'relative', overflow: 'hidden', borderRadius: 20,
    backgroundColor: '#0a0b1e', borderWidth: 1, borderColor: 'rgba(142,255,113,0.15)',
    padding: 20, paddingBottom: 22, gap: 8, marginTop: 12,
    shadowColor: '#8eff71', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 20,
  },
  heroGlowGreen: {
    position: 'absolute', top: -60, right: -40, width: 160, height: 160,
    backgroundColor: 'rgba(142,255,113,0.08)', borderRadius: 80,
  },
  heroGlowCyan: {
    position: 'absolute', bottom: -40, left: -30, width: 120, height: 120,
    backgroundColor: 'rgba(34,211,238,0.06)', borderRadius: 60,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: 'rgba(142,255,113,0.1)', borderWidth: 1, borderColor: 'rgba(142,255,113,0.25)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  heroBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#8eff71' },
  heroBadgeText: { color: '#8eff71', fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#ffffff', letterSpacing: -1, lineHeight: 30, zIndex: 2 },
  heroTitleGreen: { color: '#8eff71' },
  heroSubtitle: { fontSize: 12, color: 'rgba(203,213,225,0.8)', lineHeight: 18, maxWidth: '85%' as any, zIndex: 2 },
  heroCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: '#8eff71', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, marginTop: 4,
    shadowColor: '#8eff71', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
  },
  heroCtaText: { color: '#0a0b1e', fontSize: 13, fontWeight: '900' },
  heroQrWrapper: {
    position: 'absolute', right: 16, bottom: 16, width: 60, height: 60,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  heroQrBorder: {
    position: 'absolute', inset: 0, width: 60, height: 60,
    borderWidth: 1, borderColor: 'rgba(142,255,113,0.2)', borderRadius: 14,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(22,23,45,0.8)', borderRadius: 16,
    padding: 14, justifyContent: 'space-between', overflow: 'hidden', minHeight: 110,
    borderWidth: 1,
  },
  statCardGreen: { borderColor: 'rgba(142,255,113,0.15)' },
  statCardIndigo: { borderColor: 'rgba(99,102,241,0.15)' },
  statCardCyan: { borderColor: 'rgba(34,211,238,0.15)' },
  statCardFull: {
    backgroundColor: 'rgba(22,23,45,0.8)', borderRadius: 16,
    padding: 14, overflow: 'hidden', borderWidth: 1, gap: 6,
  },
  statGlow: {
    position: 'absolute', top: -40, right: -20, width: 100, height: 100,
    backgroundColor: 'rgba(142,255,113,0.1)', borderRadius: 50,
  },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statIconBox: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#0a0b1e',
    borderWidth: 1, borderColor: 'rgba(142,255,113,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  statBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(142,255,113,0.1)', borderWidth: 1, borderColor: 'rgba(142,255,113,0.2)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  statBadgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#8eff71' },
  statBadgeLabel: { color: '#8eff71', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  statLabel: { color: '#aaaab6', fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' as any, marginBottom: 2 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#ffffff', letterSpacing: -1 },
  statUnit: { fontSize: 11, fontWeight: '700', color: '#64748b' },

  // Live Feed
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: '#8eff71', fontSize: 10, fontWeight: '900', letterSpacing: 2 },

  feedCard: {
    backgroundColor: 'rgba(22,23,45,0.6)', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(142,255,113,0.08)',
  },
  feedItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  feedItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  feedLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  feedIconBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(142,255,113,0.08)',
    borderWidth: 1, borderColor: 'rgba(142,255,113,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  feedTitle: { fontSize: 13, fontWeight: '700', color: '#ffffff', marginBottom: 2 },
  feedTime: { fontSize: 9, fontWeight: '700', color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' as any },
  feedRight: { alignItems: 'flex-end', gap: 4 },
  feedAmount: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  feedStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(142,255,113,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(142,255,113,0.2)',
  },
  feedStatusPending: { backgroundColor: 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.2)' },
  feedStatusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#8eff71' },
  feedStatusText: { fontSize: 8, fontWeight: '900', color: '#8eff71', letterSpacing: 1 },

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
