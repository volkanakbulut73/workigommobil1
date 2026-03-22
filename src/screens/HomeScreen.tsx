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
        <Text style={styles.brandTitle}>WORKIGOM</Text>
        <TouchableOpacity style={styles.headerRight} onPress={() => navigation.navigate('Profile')}>
          <Bell color="#8eff71" size={24} />
        </TouchableOpacity>
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
            <View style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>Hemen Başla</Text>
            </View>
          </View>
          <View style={styles.heroIconWrapper}>
            <Rocket color="#8eff71" size={72} strokeWidth={1} style={{ opacity: 0.4 }} />
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
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(144, 249, 163, 0.1)' }]}>
                <RefreshCcw color="#90f9a3" size={16} />
              </View>
              <View style={styles.statBottomText}>
                <Text style={styles.statLabel}>İŞLEMLER</Text>
                <Text style={styles.statValueSmall}>42 işlem</Text>
              </View>
            </View>

            {/* Active Balance */}
            <View style={[styles.statCard, styles.statCardHalf]}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(136, 246, 255, 0.1)' }]}>
                <Zap color="#88f6ff" size={16} />
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
            <Text style={styles.sectionTitle}>Son İşlemler</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Talepler')}>
              <Text style={styles.seeAllText}>TÜMÜNÜ GÖR</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionList}>
            {/* Item 1 */}
            <View style={styles.transactionItem}>
              <View style={styles.txLeft}>
                <View style={styles.txIconBox}>
                  <Store color="#aaaab6" size={24} />
                </View>
                <View>
                  <Text style={styles.txTitle}>Market</Text>
                  <Text style={styles.txSubtitle}>Bugün, 14:20</Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>-₺124.50</Text>
                <View style={styles.txStatusBadge}>
                  <Text style={styles.txStatusText}>TAMAMLANDI</Text>
                </View>
              </View>
            </View>

            {/* Item 2 */}
            <View style={styles.transactionItem}>
              <View style={styles.txLeft}>
                <View style={styles.txIconBox}>
                  <Utensils color="#aaaab6" size={24} />
                </View>
                <View>
                  <Text style={styles.txTitle}>Restoran</Text>
                  <Text style={styles.txSubtitle}>Dün, 20:15</Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>-₺85.00</Text>
                <View style={styles.txStatusBadge}>
                  <Text style={styles.txStatusText}>TAMAMLANDI</Text>
                </View>
              </View>
            </View>

            {/* Item 3 */}
            <View style={styles.transactionItem}>
              <View style={styles.txLeft}>
                <View style={styles.txIconBox}>
                  <CreditCard color="#aaaab6" size={24} />
                </View>
                <View>
                  <Text style={styles.txTitle}>Nakit Çekim</Text>
                  <Text style={styles.txSubtitle}>12 Eki, 11:30</Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>-₺200.00</Text>
                <View style={[styles.txStatusBadge, { backgroundColor: 'rgba(255, 115, 81, 0.1)' }]}>
                  <Text style={[styles.txStatusText, { color: '#ff7351' }]}>BEKLEMEDE</Text>
                </View>
              </View>
            </View>
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
    paddingHorizontal: 16,
    paddingTop: 80,
    paddingBottom: 40,
    gap: 24,
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
    backgroundColor: 'rgba(12, 14, 22, 0.95)',
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 255, 113, 0.05)',
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
    backgroundColor: '#222531',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 255, 113, 0.1)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
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
    backgroundColor: '#171923',
    padding: 24,
    minHeight: 180,
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  heroGlow: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 192,
    height: 192,
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    borderRadius: 96,
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
    gap: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
    letterSpacing: -0.5,
    color: '#ededf9',
  },
  heroTitleHighlight: {
    color: '#8eff71',
  },
  heroBtn: {
    backgroundColor: '#8eff71',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  heroBtnText: {
    color: '#0b5800',
    fontWeight: 'bold',
    fontSize: 14,
  },
  heroIconWrapper: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    opacity: 0.4,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: '#11131c',
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  statCardWide: {
    height: 128,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardHalf: {
    flex: 1,
    height: 144,
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
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statBadge: {
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statBadgeText: {
    color: '#8eff71',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statValueBig: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ededf9',
    zIndex: 2,
  },
  statGlowRight: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(142, 255, 113, 0.05)',
    borderRadius: 100,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBottomText: {
    gap: 4,
  },
  statValueSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ededf9',
  },
  sectionContainer: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ededf9',
  },
  seeAllText: {
    color: '#8eff71',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transactionList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#171923',
    borderRadius: 20,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  txIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#222531',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ededf9',
    marginBottom: 2,
  },
  txSubtitle: {
    fontSize: 10,
    color: '#aaaab6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ededf9',
  },
  txStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
  },
  txStatusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8eff71',
    textTransform: 'uppercase',
  },
  leaderboardCard: {
    backgroundColor: '#1d1f2a',
    borderRadius: 28,
    padding: 8,
    gap: 4,
  },
  rank1Container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(142, 255, 113, 0.05)',
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 20,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rank1Badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8eff71',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank1BadgeText: {
    color: '#0d6100',
    fontWeight: '900',
    fontSize: 14,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#171923',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: '#aaaab6',
    fontWeight: '900',
    fontSize: 14,
  },
  rank1Avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#8eff71',
  },
  rankAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rankName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ededf9',
    marginBottom: 2,
  },
  rankPoints1: {
    fontSize: 10,
    color: '#8eff71',
    fontWeight: 'bold',
  },
  rankPoints: {
    fontSize: 10,
    color: '#aaaab6',
    fontWeight: 'bold',
  },
  allRankBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allRankBtnText: {
    color: '#aaaab6',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
