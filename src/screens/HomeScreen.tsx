import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { Bell, Rocket, RefreshCcw, Zap, Store, Utensils, CreditCard, Award, ChevronRight } from 'lucide-react-native';
import { Layout } from '../components/Layout';

const { width } = Dimensions.get('window');

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
        
        {/* Hero/Banner */}
        <TouchableOpacity style={styles.heroSection} activeOpacity={0.9} onPress={() => navigation.navigate('TaleplerCreate')}>
          <View style={styles.heroGlow} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Birlikte Paylaş,{'\n'}
              <Text style={styles.heroTitleHighlight}>Daha Fazla Kazan</Text>
            </Text>
            <TouchableOpacity style={styles.heroBtn} activeOpacity={0.8} onPress={() => navigation.navigate('TaleplerCreate')}>
              <Text style={styles.heroBtnText}>Hemen Başla</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroIconWrapper}>
            <Rocket color="#8eff71" size={72} strokeWidth={1} style={{ opacity: 0.3 }} />
          </View>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Total Savings */}
          <View style={[styles.statCard, styles.statCardWide]}>
            <View style={styles.statHeaderRow}>
              <Text style={styles.statLabel}>TOPLAM TASARRUF</Text>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>+12%</Text>
              </View>
            </View>
            <Text style={styles.statValueBig}>₺1,450.00</Text>
            <View style={styles.statGlowRight} />
          </View>

          <View style={styles.statsRow}>
            {/* Transactions */}
            <View style={[styles.statCard, styles.statCardHalf]}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(142, 255, 113, 0.1)' }]}>
                <RefreshCcw color="#8eff71" size={16} />
              </View>
              <View style={styles.statBottomText}>
                <Text style={styles.statLabel}>İŞLEMLER</Text>
                <Text style={styles.statValueSmall}>42 işlem</Text>
              </View>
            </View>

            {/* Active Balance */}
            <View style={[styles.statCard, styles.statCardHalf]}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(142, 255, 113, 0.1)' }]}>
                <Zap color="#8eff71" size={16} />
              </View>
              <View style={styles.statBottomText}>
                <Text style={styles.statLabel}>AKTİF BAKİYE</Text>
                <Text style={styles.statValueSmall}>₺340.50</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Paylaşım Taleplerin</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Talepler')}>
              <Text style={styles.seeAllText}>TÜMÜNÜ GÖR</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionList}>
            {/* Item 1 */}
            <TouchableOpacity style={styles.transactionItem} activeOpacity={0.7}>
              <View style={styles.txLeft}>
                <View style={styles.txIconBox}>
                  <Store color="#8eff71" size={24} />
                </View>
                <View>
                  <Text style={styles.txTitle}>Getir Market</Text>
                  <Text style={styles.txSubtitle}>Bugün, 14:20</Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>₺124.50</Text>
                <View style={styles.txStatusBadge}>
                  <Text style={styles.txStatusText}>TAMAMLANDI</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Item 2 */}
            <TouchableOpacity style={styles.transactionItem} activeOpacity={0.7}>
              <View style={styles.txLeft}>
                <View style={styles.txIconBox}>
                  <Utensils color="#8eff71" size={24} />
                </View>
                <View>
                  <Text style={styles.txTitle}>Yemeksepeti</Text>
                  <Text style={styles.txSubtitle}>Dün, 20:15</Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>₺85.00</Text>
                <View style={styles.txStatusBadge}>
                  <Text style={styles.txStatusText}>TAMAMLANDI</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Item 3 */}
            <TouchableOpacity style={styles.transactionItem} activeOpacity={0.7}>
              <View style={styles.txLeft}>
                <View style={styles.txIconBox}>
                  <CreditCard color="#8eff71" size={24} />
                </View>
                <View>
                  <Text style={styles.txTitle}>Cüzdan Yükleme</Text>
                  <Text style={styles.txSubtitle}>12 Eki, 11:30</Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>₺200.00</Text>
                <View style={[styles.txStatusBadge, { backgroundColor: 'rgba(255, 115, 81, 0.1)' }]}>
                  <Text style={[styles.txStatusText, { color: '#ff7351' }]}>BEKLEMEDE</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Leaderboard */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Liderlik Tablosu</Text>
          </View>

          <View style={styles.leaderboardCard}>
            {/* Rank 1 */}
            <View style={styles.rank1Container}>
              <View style={styles.rankLeft}>
                <View style={styles.rank1Badge}>
                  <Text style={styles.rank1BadgeText}>1</Text>
                </View>
                <Image source={{ uri: 'https://ui-avatars.com/api/?name=Caner+D&background=33f20d&color=0a0b1e' }} style={styles.rank1Avatar} />
                <View>
                  <Text style={styles.rankName}>Caner D.</Text>
                  <Text style={styles.rankPoints1}>4.2k Puan</Text>
                </View>
              </View>
              <Award color="#8eff71" size={24} />
            </View>

            {/* Rank 2 */}
            <View style={styles.rankItem}>
              <View style={styles.rankLeft}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>2</Text>
                </View>
                <Image source={{ uri: 'https://ui-avatars.com/api/?name=Melis+A&background=222531&color=ededf9' }} style={styles.rankAvatar} />
                <View>
                  <Text style={styles.rankName}>Melis A.</Text>
                  <Text style={styles.rankPoints}>3.8k Puan</Text>
                </View>
              </View>
            </View>

            {/* Rank 3 */}
            <View style={styles.rankItem}>
              <View style={styles.rankLeft}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>3</Text>
                </View>
                <Image source={{ uri: 'https://ui-avatars.com/api/?name=Berk+S&background=222531&color=ededf9' }} style={styles.rankAvatar} />
                <View>
                  <Text style={styles.rankName}>Berk S.</Text>
                  <Text style={styles.rankPoints}>3.5k Puan</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.allRankBtn}>
              <Text style={styles.allRankBtnText}>TÜM SIRALAMA</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0e16',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(12, 14, 22, 0.98)',
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 255, 113, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1d1f2a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#aaaab6',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8eff71',
  },
  headerRight: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 32,
    backgroundColor: '#1d1f2a',
    padding: 24,
    minHeight: 180,
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  heroGlow: {
    position: 'absolute',
    right: -60,
    top: -60,
    width: 220,
    height: 220,
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    borderRadius: 110,
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
    gap: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    lineHeight: 34,
    letterSpacing: -1,
    color: '#ededf9',
  },
  heroTitleHighlight: {
    color: '#8eff71',
  },
  heroBtn: {
    backgroundColor: '#8eff71',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(142, 255, 113, 0.5)',
  },
  heroBtnText: {
    color: '#0c0e16',
    fontWeight: '900',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  heroIconWrapper: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    opacity: 0.3,
  },
  statsGrid: {
    gap: 16,
  },
  statCard: {
    backgroundColor: '#1d1f2a',
    borderRadius: 28,
    padding: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
  },
  statCardWide: {
    height: 140,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCardHalf: {
    flex: 1,
    height: 150,
  },
  statHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  statLabel: {
    color: '#aaaab6',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  statBadge: {
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  statBadgeText: {
    color: '#8eff71',
    fontSize: 10,
    fontWeight: '900',
  },
  statValueBig: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ededf9',
    zIndex: 2,
  },
  statGlowRight: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 160,
    height: 160,
    backgroundColor: 'rgba(142, 255, 113, 0.08)',
    borderRadius: 80,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBottomText: {
    gap: 6,
  },
  statValueSmall: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ededf9',
  },
  sectionContainer: {
    gap: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ededf9',
    letterSpacing: -0.5,
  },
  seeAllText: {
    color: '#8eff71',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  transactionList: {
    gap: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1d1f2a',
    borderRadius: 24,
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  txIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(142, 255, 113, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ededf9',
    marginBottom: 4,
  },
  txSubtitle: {
    fontSize: 10,
    color: '#aaaab6',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ededf9',
  },
  txStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
  },
  txStatusText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#8eff71',
    textTransform: 'uppercase',
  },
  leaderboardCard: {
    backgroundColor: '#1d1f2a',
    borderRadius: 32,
    padding: 12,
    gap: 8,
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 25,
  },
  rank1Container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(142, 255, 113, 0.15)',
    borderRadius: 24,
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rank1Badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8eff71',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  rank1BadgeText: {
    color: '#0c0e16',
    fontWeight: '900',
    fontSize: 16,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: '#aaaab6',
    fontWeight: '900',
    fontSize: 14,
  },
  rank1Avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#8eff71',
  },
  rankAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#222531',
  },
  rankName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ededf9',
    marginBottom: 4,
  },
  rankPoints1: {
    fontSize: 11,
    color: '#8eff71',
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  rankPoints: {
    fontSize: 11,
    color: '#aaaab6',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  allRankBtn: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allRankBtnText: {
    color: '#8eff71',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.6,
  },
});
