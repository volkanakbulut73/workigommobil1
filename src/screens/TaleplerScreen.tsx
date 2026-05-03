import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, ActivityIndicator, Modal, Alert, Animated, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Layout } from '../components/Layout';
import { Plus, ClipboardList, CheckCircle2, Shield, QrCode, Zap, X, Trash2, Star, Utensils, ShieldCheck, Activity } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useRequestStore } from '../store/useRequestStore';

const TalepCardItem = React.memo(({ item, isMine, profile, onAccept, onCancel, onFollow }: any) => {
  const fullName = item.profiles?.full_name || (isMine ? (profile?.full_name || 'Ben') : 'Anonim');
  const avatar = item.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${fullName.replace(' ', '+')}&background=8eff71&color=0c0e16&rounded=true`;

  return (
    <View style={styles.requestCard as any}>
      {/* Card Header / User Info */}
      <View style={styles.cardHeader}>
        <View style={styles.userInfoLeft}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={styles.verifiedBadge}>
              <CheckCircle2 color="#8eff71" size={14} fill="#171923" />
            </View>
          </View>
          <View>
            <Text style={styles.userName}>{fullName}</Text>
            {isMine ? (
               <View style={styles.userBadge}>
                 <Star color="#88f6ff" size={12} fill="#88f6ff" />
                 <Text style={styles.userBadgeText}>SENİN PAYLAŞIMIN</Text>
               </View>
            ) : (
               <View style={styles.userBadge}>
                 <Star color="#88f6ff" size={12} fill="#88f6ff" />
                 <Text style={styles.userBadgeText}>GÜMÜŞ KALPLİ ÜYE</Text>
               </View>
            )}
          </View>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.amountId}>{item.listing_id || 'REQ-NEW'}</Text>
          <Text style={styles.amountLabel}>MENÜ TUTARI</Text>
          <Text style={styles.amountValue}>{Number(item.amount).toLocaleString('tr-TR')}₺</Text>
        </View>
      </View>

      {/* Card Content / Description */}
      <View style={styles.cardContent}>
        <View style={styles.descBox}>
          <View style={styles.descHeader}>
            <Utensils color="#aaaab6" size={14} />
            <Text style={styles.descLabel}>AÇIKLAMA</Text>
          </View>
          <Text style={styles.descText}>"{item.listing_title}"</Text>
        </View>

        {/* Meal Cards */}
        {item.meal_cards && item.meal_cards.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.descLabel, { marginBottom: 8 }]}>ÖDEMENİN YAPILABİLECEĞİ YEMEK KARTLARI</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {item.meal_cards.map((card: string, idx: number) => (
                <View key={idx} style={{ backgroundColor: 'rgba(142, 255, 113, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(142, 255, 113, 0.2)' }}>
                  <Text style={{ color: '#8eff71', fontSize: 10, fontWeight: 'bold' }}>{card}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Features / Chips */}
        <View style={styles.featuresRow}>
          <View style={styles.featureChip}>
            <Shield color="#8eff71" size={12} />
            <Text style={styles.featureChipText}>Escrow</Text>
          </View>
          <View style={styles.featureChip}>
            <QrCode color="#8eff71" size={12} />
            <Text style={styles.featureChipText}>QR ile Ödeme</Text>
          </View>
          <View style={styles.featureChip}>
            <Zap color="#8eff71" size={12} />
            <Text style={styles.featureChipText}>Anında Transfer</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        {isMine ? (
          <View style={styles.myActionsRow}>
            {item.status !== 'cancelled' && (
              <TouchableOpacity 
                style={[styles.btn, styles.btnFollow]} 
                onPress={() => onFollow(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnFollowText}>SÜRECİ TAKİP ET</Text>
              </TouchableOpacity>
            )}
            
            {(item.status === 'waiting-supporter' || item.status === 'waiting-cash-payment') && (
              <TouchableOpacity 
                style={[styles.btn, styles.btnCancel]} 
                onPress={() => onCancel(item.id)}
                activeOpacity={0.8}
              >
                <Trash2 color="#ef4444" size={16} />
                <Text style={styles.btnCancelText}>İPTAL ET</Text>
              </TouchableOpacity>
            )}

            {item.status === 'completed' && (
              <View style={[styles.btn, { backgroundColor: 'rgba(142, 255, 113, 0.1)', borderWidth: 1, borderColor: '#8eff71' }]}>
                <CheckCircle2 color="#8eff71" size={16} />
                <Text style={[styles.btnFollowText, { color: '#8eff71', marginLeft: 8 }]}>TAMAMLANDI</Text>
              </View>
            )}

            {item.status === 'cancelled' && (
              <View style={[styles.btn, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: '#ef4444' }]}>
                <Text style={[styles.btnFollowText, { color: '#ef4444' }]}>İPTAL EDİLDİ</Text>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.mainCtaBtn}
            onPress={() => onAccept(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.mainCtaBtnText}>PAYLAŞ & KAZAN</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

export function TaleplerScreen() {
  const navigation = useNavigation<any>();
  const profile = useAuthStore(state => state.profile);
  const user = useAuthStore(state => state.user);
  
  const otherTransactions = useRequestStore(state => state.otherTransactions);
  const myTransactions = useRequestStore(state => state.myTransactions);
  const loading = useRequestStore(state => state.loading);
  const fetchTransactions = useRequestStore(state => state.fetchTransactions);
  const acceptTransaction = useRequestStore(state => state.acceptTransaction);
  const cancelTransaction = useRequestStore(state => state.cancelTransaction);

  const [activeTab, setActiveTab] = useState<'other' | 'my'>('other');
  
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for STABİL indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true })
      ])
    ).start();

    // Scan animation for empty state
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
      ])
    ).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const userId = profile?.id || user?.id;
      if (userId) {
        fetchTransactions(userId);
      }
    }, [profile?.id, user?.id, fetchTransactions])
  );

  const onRefresh = useCallback(() => {
    const userId = profile?.id || user?.id;
    if (userId) {
      fetchTransactions(userId);
    }
  }, [profile?.id, user?.id, fetchTransactions]);

  const handleAcceptClick = useCallback((item: any) => {
    setSelectedTx(item);
    setIsModalOpen(true);
  }, []);

  const confirmAccept = useCallback(async (supportPercentage: number) => {
    const userId = profile?.id || user?.id;
    if (!userId || !selectedTx) return;
    try {
      await acceptTransaction(selectedTx.id, userId, supportPercentage);
      setIsModalOpen(false);
      setSelectedTx(null);
      navigation.navigate('Tracker', { id: selectedTx.id });
    } catch (error) {
       Alert.alert('Error', 'Something went wrong while accepting the request.');
    }
  }, [profile?.id, user?.id, selectedTx, acceptTransaction, navigation]);

  const handleCancel = useCallback((txId: string) => {
    const userId = profile?.id || user?.id;
    if (!userId) return;
    Alert.alert('İptal Et', 'Bu talebi iptal etmek istediğinize emin misiniz?', [
      { text: 'Hayır', style: 'cancel' },
      { text: 'Evet', style: 'destructive', onPress: () => cancelTransaction(txId, userId) }
    ]);
  }, [profile?.id, user?.id, cancelTransaction]);

  const onFollow = useCallback((id: string) => {
    navigation.navigate('Tracker', { id });
  }, [navigation]);

  const currentData = activeTab === 'other' ? otherTransactions : myTransactions;

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TalepCardItem 
      item={item} 
      isMine={activeTab === 'my'} 
      profile={profile} 
      onAccept={handleAcceptClick} 
      onCancel={handleCancel} 
      onFollow={onFollow} 
    />
  ), [activeTab, profile, handleAcceptClick, handleCancel, onFollow]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <Layout>
      <View style={styles.container}>
        
        {/* Cyber Grid Background Pattern */}
        <View style={styles.gridBackground} pointerEvents="none">
          <View style={styles.gridLineHorizontal} />
          <View style={[styles.gridLineHorizontal, { top: '30%' }]} />
          <View style={[styles.gridLineHorizontal, { top: '60%' }]} />
          <View style={[styles.gridLineHorizontal, { top: '90%' }]} />
          <View style={styles.gridLineVertical} />
          <View style={[styles.gridLineVertical, { left: '33%' }]} />
          <View style={[styles.gridLineVertical, { left: '66%' }]} />
        </View>

        {/* Main Screen Header */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>TALEPLER</Text>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => navigation.navigate('TaleplerCreate')}
            activeOpacity={0.7}
          >
            <Plus color="#0c0e16" size={16} strokeWidth={3} />
            <Text style={styles.addBtnText}>Talep Oluştur</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'other' && styles.activeTab]}
            onPress={() => setActiveTab('other')}
          >
            <Text style={[styles.tabText, activeTab === 'other' && styles.activeTabText]}>PAYLAŞIM BEKLEYENLER</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'my' && styles.activeTab]}
            onPress={() => setActiveTab('my')}
          >
            <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>PAYLAŞIMLARIM</Text>
          </TouchableOpacity>
        </View>

        {/* Cyber Dashboard Metrics */}
        <View style={styles.dashboardContainer}>
          <View style={[styles.dashboardMetric, styles.dashboardBorderGreen]}>
            <Text style={styles.dashboardLabel}>AKTİF</Text>
            <Text style={styles.dashboardValue}>{currentData.length}</Text>
          </View>
          <View style={[styles.dashboardMetric, styles.dashboardBorderBlue]}>
            <ShieldCheck color="#3b82f6" size={12} style={{ marginBottom: 4 }} />
            <Text style={styles.dashboardLabel}>GÜVENLİK</Text>
            <Text style={[styles.dashboardValue, { color: '#3b82f6' }]}>%98</Text>
          </View>
          <View style={[styles.dashboardMetric, styles.dashboardBorderNeon]}>
            <View style={styles.statusRow}>
              <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
              <Text style={styles.dashboardLabel}>AĞ DURUMU</Text>
            </View>
            <Text style={[styles.dashboardValue, { color: '#8eff71', fontSize: 10 }]}>STABİL</Text>
          </View>
        </View>

        {/* Requests List */}
        {loading && currentData.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color="#8eff71" size="large" />
          </View>
        ) : (
          <FlatList
            data={currentData}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            windowSize={5}
            maxToRenderPerBatch={10}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#8eff71" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.scanIconWrapper}>
                  <Activity color="#8eff71" size={40} />
                </View>
                <Animated.Text style={[styles.emptyText, { opacity: scanAnim }]}>
                  TARAMA YAPILIYOR...
                </Animated.Text>
                <Text style={styles.emptySubText}>
                  {activeTab === 'other' ? 'Uygun veri paketi bekleniyor.' : 'Henüz aktif bir paylaşımınız bulunmuyor.'}
                </Text>
              </View>
            }
          />
        )}

        {/* Share Selection Modal */}
        <Modal
          visible={isModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                   <Text style={styles.modalTitle}>Paylaşım Seçimi</Text>
                   <Text style={styles.modalSubtitle}>{selectedTx?.profiles?.full_name || 'Kullanıcı'} için paylaşım oranını seçin</Text>
                </View>
                <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.modalCloseBtn}>
                  <X color="#aaaab6" size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {/* Option 1: 15% */}
                <TouchableOpacity 
                  style={styles.modalOptionContainer} 
                  onPress={() => confirmAccept(15)}
                  activeOpacity={0.8}
                >
                   <View style={styles.modalOptionHeader}>
                      <Text style={styles.modalOptionTitle}>% 15 Paylaşım</Text>
                      <View style={styles.modalBadgeStandart}>
                        <Text style={styles.modalBadgeTextStandart}>Standart</Text>
                      </View>
                   </View>
                   <View style={styles.modalOptionDetails}>
                      <View style={styles.modalOptionRow}>
                         <Text style={styles.modalOptionRowLabel}>Senin katkın (İndirim):</Text>
                         <Text style={styles.modalOptionRowValue}>{Math.round((selectedTx?.amount || 0) * 0.10)}₺</Text>
                      </View>
                      <View style={styles.modalOptionRow}>
                         <Text style={styles.modalOptionRowLabel}>Platform ücreti (%5):</Text>
                         <Text style={styles.modalOptionRowValue}>{Math.round((selectedTx?.amount || 0) * 0.05)}₺</Text>
                      </View>
                   </View>
                   <View style={styles.modalOptionTotalRow}>
                      <Text style={styles.modalOptionTotalLabel}>Toplam Maliyetin:</Text>
                      <Text style={styles.modalOptionTotalValue}>{Math.round((selectedTx?.amount || 0) * 0.15)}₺</Text>
                   </View>
                   <View style={styles.modalOptionEarnBox}>
                      <Text style={styles.modalOptionEarnLabel}>Hesabına aktarılacak:</Text>
                      <Text style={styles.modalOptionEarnValue}>{((selectedTx?.amount || 0) * 0.85).toLocaleString('tr-TR')}₺</Text>
                      <Text style={styles.modalOptionEarnSub}>Yararlanıcı {((selectedTx?.amount || 0) * 0.90).toLocaleString('tr-TR')}₺ ödeyecek</Text>
                   </View>
                   <View style={styles.modalSelectBtn}>
                     <Text style={styles.modalSelectBtnText}>BUNU SEÇ</Text>
                   </View>
                </TouchableOpacity>

                {/* Option 2: 100% */}
                <TouchableOpacity 
                  style={[styles.modalOptionContainer, styles.modalOptionContainerGold]} 
                  onPress={() => confirmAccept(100)}
                  activeOpacity={0.8}
                >
                    <View style={styles.modalOptionHeader}>
                      <Text style={styles.modalOptionTitleGold}>%100 Buda Benden 💜</Text>
                      <View style={styles.modalBadgeGold}>
                        <Text style={styles.modalBadgeTextGold}>Altın Kalp</Text>
                      </View>
                   </View>
                   <View style={styles.modalOptionDetails}>
                      <View style={styles.modalOptionRow}>
                         <Text style={styles.modalOptionRowLabel}>Senin katkın:</Text>
                         <Text style={styles.modalOptionRowValue}>{(selectedTx?.amount || 0).toLocaleString('tr-TR')}₺</Text>
                      </View>
                      <View style={styles.modalOptionRow}>
                         <Text style={styles.modalOptionRowLabel}>Platform ücreti:</Text>
                         <Text style={styles.modalOptionRowValue}>%0 (Bizden)</Text>
                      </View>
                   </View>
                   <View style={styles.modalOptionEarnBoxGold}>
                      <Text style={styles.modalOptionEarnLabelGold}>Yemek ücretinin tamamını ödemeyi kabul ettiniz.</Text>
                      <View style={styles.modalOptionGoldRow}>
                        <Text style={styles.modalOptionGoldRowLabel}>Hesabınıza aktarılacak tutar:</Text>
                        <Text style={styles.modalOptionGoldRowValue}>0₺</Text>
                      </View>
                   </View>
                   <View style={styles.modalSelectBtnGold}>
                     <Text style={styles.modalSelectBtnTextGold}>BUNU SEÇ</Text>
                   </View>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0e16',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ededf9',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  addBtn: {
    backgroundColor: '#8eff71',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8, // Sharper corners
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  addBtnText: {
    color: '#0c0e16',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 28,
    backgroundColor: 'rgba(34, 37, 49, 0.5)',
    borderRadius: 20,
    padding: 6,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    borderWidth: 1,
    borderColor: '#8eff71',
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabText: {
    color: '#aaaab6',
    fontSize: 11, // Slightly smaller to prevent wrapping
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#8eff71',
  },
  dashboardContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  dashboardMetric: {
    flex: 1,
    backgroundColor: 'rgba(29, 31, 42, 0.6)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardBorderGreen: { borderColor: 'rgba(142, 255, 113, 0.2)' },
  dashboardBorderBlue: { borderColor: 'rgba(59, 130, 246, 0.2)' },
  dashboardBorderNeon: { borderColor: 'rgba(142, 255, 113, 0.4)' },
  dashboardLabel: {
    color: '#aaaab6',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  dashboardValue: {
    color: '#ededf9',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8eff71',
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  gridBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#8eff71',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#8eff71',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 24,
    zIndex: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  scanIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(142, 255, 113, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 255, 113, 0.1)',
    marginBottom: 8,
  },
  emptyText: {
    color: '#8eff71',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 4,
  },
  emptySubText: {
    color: '#aaaab6',
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.5,
    textAlign: 'center',
    maxWidth: '80%',
  },
  /* Card Styles */
  requestCard: {
    backgroundColor: '#1d1f2a',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
  },
  userInfoLeft: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#222531',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#0c0e16',
    borderRadius: 10,
    padding: 2,
  },
  userName: {
    color: '#ededf9',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 6,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    gap: 6,
  },
  userBadgeText: {
    color: '#8eff71',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    color: '#aaaab6',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  amountId: {
    color: '#39ff14',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
    alignSelf: 'flex-end',
  },
  amountValue: {
    color: '#8eff71',
    fontSize: 22,
    fontWeight: '900',
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  descBox: {
    backgroundColor: 'rgba(12, 14, 22, 0.4)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  descLabel: {
    color: '#aaaab6',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  descText: {
    color: '#ededf9',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 28,
  },
  featureChip: {
    backgroundColor: 'rgba(142, 255, 113, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureChipText: {
    color: '#ededf9',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mainCtaBtn: {
    backgroundColor: '#8eff71',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12, // Sharper corners
    alignItems: 'center',
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mainCtaBtnText: {
    color: '#0c0e16',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  myActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  btnFollow: {
    backgroundColor: '#2d3142',
  },
  btnFollowText: {
    color: '#ededf9',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  btnCancel: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  btnCancelText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1d1f2a',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24, // Reduced from 28
    maxHeight: '90%',
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  modalTitle: {
    color: '#ededf9',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    color: '#aaaab6',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
  },
  modalCloseBtn: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionContainer: {
    backgroundColor: 'rgba(12, 14, 22, 0.6)',
    borderRadius: 24, // Reduced from 28
    padding: 20, // Reduced from 24
    marginBottom: 16, // Reduced from 20
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },
  modalOptionContainerGold: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  modalOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, // Reduced from 20
  },
  modalOptionTitle: {
    color: '#3b82f6',
    fontSize: 18, // Reduced from 20
    fontWeight: '900',
  },
  modalOptionTitleGold: {
    color: '#fbbf24',
    fontSize: 18, // Reduced from 20
    fontWeight: '900',
  },
  modalBadgeStandart: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  modalBadgeTextStandart: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modalBadgeGold: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  modalBadgeTextGold: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modalOptionDetails: {
    marginBottom: 16, // Reduced from 20
    gap: 10, // Reduced from 14
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOptionRowLabel: {
    color: '#aaaab6',
    fontSize: 13, // Reduced from 14
    fontWeight: '500',
  },
  modalOptionRowValue: {
    color: '#ededf9',
    fontSize: 14, // Reduced from 16
    fontWeight: '900',
  },
  modalOptionTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 16, // Reduced from 20
    marginBottom: 16, // Reduced from 20
  },
  modalOptionTotalLabel: {
    color: '#3b82f6',
    fontWeight: '900',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalOptionTotalValue: {
    color: '#3b82f6',
    fontWeight: '900',
    fontSize: 20, // Reduced from 22
  },
  modalOptionEarnBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 20, // Reduced from 24
    padding: 20, // Reduced from 24
    alignItems: 'center',
    marginBottom: 20, // Reduced from 24
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  modalOptionEarnLabel: {
    color: '#aaaab6',
    fontWeight: '900',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  modalOptionEarnValue: {
    color: '#3b82f6',
    fontSize: 32, // Reduced from 36
    fontWeight: '900',
    marginBottom: 8, // Reduced from 10
  },
  modalOptionEarnSub: {
    color: '#aaaab6',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  modalSelectBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 15, // Reduced from 18
    borderRadius: 16, // Reduced from 20
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  modalSelectBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  modalOptionEarnBoxGold: {
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.1)',
  },
  modalOptionEarnLabelGold: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOptionGoldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 14, 22, 0.4)',
    padding: 18,
    borderRadius: 16,
  },
  modalOptionGoldRowLabel: {
    color: '#aaaab6',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOptionGoldRowValue: {
    color: '#fbbf24',
    fontSize: 24,
    fontWeight: '900',
  },
  modalSelectBtnGold: {
    backgroundColor: '#fbbf24',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5,
  },
  modalSelectBtnTextGold: {
    color: '#3d2b01',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
