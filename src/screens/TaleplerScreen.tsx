import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, ActivityIndicator, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Layout } from '../components/Layout';
import { Plus, ClipboardList, CheckCircle2, Shield, QrCode, Zap, X, Trash2, Star, Utensils } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useRequestStore } from '../store/useRequestStore';

const TalepCardItem = React.memo(({ item, isMine, profile, onAccept, onCancel, onFollow }: any) => {
  const fullName = item.profiles?.full_name || (isMine ? (profile?.full_name || 'Ben') : 'Anonim');
  const avatar = item.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${fullName.replace(' ', '+')}&background=33f20d&color=0a0b1e&rounded=true`;

  return (
    <View style={styles.requestCard}>
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

        {/* Features / Chips */}
        <View style={styles.featuresRow}>
          <View style={styles.featureChip}>
            <Shield color="#8eff71" size={14} />
            <Text style={styles.featureChipText}>Escrow</Text>
          </View>
          <View style={styles.featureChip}>
            <QrCode color="#8eff71" size={14} />
            <Text style={styles.featureChipText}>QR ile Ödeme</Text>
          </View>
          <View style={styles.featureChip}>
            <Zap color="#8eff71" size={14} />
            <Text style={styles.featureChipText}>Anında Transfer</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        {isMine ? (
          <View style={styles.myActionsRow}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnFollow]} 
              onPress={() => onFollow(item.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.btnFollowText}>TAKİP ET</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btn, styles.btnCancel]} 
              onPress={() => onCancel(item.id)}
              activeOpacity={0.8}
            >
               <Trash2 color="#ef4444" size={16} />
              <Text style={styles.btnCancelText}>İPTAL ET</Text>
            </TouchableOpacity>
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

  useEffect(() => {
    const userId = profile?.id || user?.id;
    if (userId) {
      fetchTransactions(userId);
    }
  }, [profile?.id, user?.id]);

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
        
        {/* Main Screen Header */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>TALEPLER</Text>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => navigation.navigate('TaleplerCreate')}
            activeOpacity={0.8}
          >
            <Plus color="#0d6100" size={16} strokeWidth={3} />
            <Text style={styles.addBtnText}>Talep Oluştur</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'other' && styles.activeTab]}
            onPress={() => setActiveTab('other')}
          >
            <Text style={[styles.tabText, activeTab === 'other' && styles.activeTabText]}>Paylaşım Bekleyenler</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'my' && styles.activeTab]}
            onPress={() => setActiveTab('my')}
          >
            <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>Paylaşımlarım</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statsBox}>
            <View style={styles.statsIconWrapper}>
              <ClipboardList color="#8eff71" size={24} />
            </View>
            <View>
              <Text style={styles.statsLabel}>MEVCUT DURUM</Text>
              <Text style={styles.statsValue}>AKTİF TALEPLER: {currentData.length}</Text>
            </View>
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
                <Text style={styles.emptyText}>Bekleyen talep bulunamadı.</Text>
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
    paddingHorizontal: 16,
    paddingTop: 50, // Reduced from 80
    marginBottom: 16, // Reduced from 24
  },
  screenTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 22, // Reduced from 28
    fontWeight: 'bold',
    color: '#ededf9',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  addBtn: {
    backgroundColor: '#8eff71',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12, // Reduced
    paddingVertical: 8, // Reduced
    borderRadius: 9999,
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  addBtnText: {
    color: '#0d6100',
    fontFamily: 'Manrope-Bold',
    fontWeight: 'bold',
    fontSize: 12, // Reduced
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(70, 71, 81, 0.4)', // outline_variant with opacity
    gap: 24,
  },
  tab: {
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#8eff71',
  },
  tabText: {
    color: '#aaaab6', // on-surface-variant
    fontSize: 14,
    fontFamily: 'Manrope-Medium',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#8eff71',
    fontFamily: 'Manrope-Bold',
    fontWeight: 'bold',
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16, // Reduced
  },
  statsBox: {
    backgroundColor: '#11131c', // surface-container-low
    padding: 12, // Reduced
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // Reduced
    borderWidth: 1,
    borderColor: 'rgba(70, 71, 81, 0.2)',
  },
  statsIconWrapper: {
    width: 36, // Reduced
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsLabel: {
    color: '#aaaab6',
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statsValue: {
    color: '#ededf9',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16, // Reduced
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#aaaab6',
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
  },
  /* Card Styles */
  requestCard: {
    backgroundColor: '#171923', // surface-container
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(70, 71, 81, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
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
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#222531',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#222531',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(70, 71, 81, 0.4)',
  },
  userName: {
    color: '#ededf9',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(136, 246, 255, 0.1)', // tertiary/10
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    gap: 4,
  },
  userBadgeText: {
    color: '#88f6ff', // tertiary
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    color: '#aaaab6', // on-surface-variant
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  amountValue: {
    color: '#8eff71', // primary
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    fontWeight: '900',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  descBox: {
    backgroundColor: 'rgba(34, 37, 49, 0.5)', // surface-container-highest/50
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  descLabel: {
    color: '#aaaab6',
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  descText: {
    color: '#ededf9',
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    fontStyle: 'italic',
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  featureChip: {
    backgroundColor: '#11131c', // surface-container-low
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureChipText: {
    color: '#ededf9',
    fontFamily: 'Manrope-Bold',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mainCtaBtn: {
    backgroundColor: '#8eff71',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  mainCtaBtnText: {
    color: '#0d6100', // on-primary
    fontFamily: 'Manrope-Black',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  myActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  btnFollow: {
    backgroundColor: '#222531', // outline-variant kind of
  },
  btnFollowText: {
    color: '#ededf9',
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  btnCancel: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  btnCancelText: {
    color: '#ef4444',
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#171923',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#ededf9',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: '#aaaab6',
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    marginTop: 4,
  },
  modalCloseBtn: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  modalOptionContainer: {
    backgroundColor: '#1d1f2a', // surface-container-high
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
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
    marginBottom: 16,
  },
  modalOptionTitle: {
    color: '#3b82f6',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    fontWeight: '900',
  },
  modalOptionTitleGold: {
    color: '#fbbf24',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    fontWeight: '900',
  },
  modalBadgeStandart: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  modalBadgeTextStandart: {
    color: '#93c5fd',
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalBadgeGold: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  modalBadgeTextGold: {
    color: '#fde68a',
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOptionDetails: {
    marginBottom: 16,
    gap: 12,
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalOptionRowLabel: {
    color: '#aaaab6',
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
  },
  modalOptionRowValue: {
    color: '#ededf9',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOptionTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
    marginBottom: 16,
  },
  modalOptionTotalLabel: {
    color: '#60a5fa',
    fontFamily: 'Manrope-Bold',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOptionTotalValue: {
    color: '#60a5fa',
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '900',
    fontSize: 20,
  },
  modalOptionEarnBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  modalOptionEarnLabel: {
    color: '#93c5fd',
    fontFamily: 'Manrope-Bold',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalOptionEarnValue: {
    color: '#60a5fa',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 8,
  },
  modalOptionEarnSub: {
    color: '#bfdbfe',
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
  },
  modalSelectBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalSelectBtnText: {
    color: '#fff',
    fontFamily: 'Manrope-Bold',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  modalOptionEarnBoxGold: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  modalOptionEarnLabelGold: {
    color: '#fde68a',
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOptionGoldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
    borderRadius: 12,
  },
  modalOptionGoldRowLabel: {
    color: '#fef3c7',
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
  },
  modalOptionGoldRowValue: {
    color: '#fbbf24',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    fontWeight: '900',
  },
  modalSelectBtnGold: {
    backgroundColor: '#fbbf24',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalSelectBtnTextGold: {
    color: '#78350f',
    fontFamily: 'Manrope-Bold',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
});
