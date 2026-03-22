import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, ActivityIndicator, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Plus, BarChart2, Shield, QrCode, X, Trash2 } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useRequestStore } from '../store/useRequestStore';

const TalepCardItem = React.memo(({ item, isMine, profile, onAccept, onCancel, onFollow }: any) => {
  const fullName = item.profiles?.full_name || (isMine ? (profile?.full_name || 'Ben') : 'Anonim');
  const avatar = item.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${fullName.replace(' ', '+')}&background=33f20d&color=0a0b1e&rounded=true`;

  return (
    <Card style={[styles.requestCard, isMine && styles.myRequestCard] as any}>
      {isMine && (
        <View style={styles.myBadge}>
          <Text style={styles.myBadgeText}>SENİN PAYLAŞIMIN</Text>
        </View>
      )}

      {/* Top Header */}
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Image source={{ uri: avatar }} style={[styles.avatar, isMine && { opacity: 0.7 }]} />
          <Text style={[styles.userName, isMine && { opacity: 0.7 }]}>{fullName}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>{Number(item.amount).toLocaleString('tr-TR')}₺</Text>
          <Text style={styles.amountLabel}>MENÜ TUTARI</Text>
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <View style={styles.titleDot} />
        <Text style={styles.titleText} numberOfLines={2}>{item.listing_title}</Text>
      </View>

      <View style={styles.divider} />

      {/* Features / Actions */}
      {isMine ? (
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.btn, styles.btnFollow]} 
            onPress={() => onFollow(item.id)}
          >
            <Text style={styles.btnFollowText}>Takip Et</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.btn, styles.btnCancel]} 
            onPress={() => onCancel(item.id)}
          >
             <Trash2 color="#ef4444" size={14} style={{ marginRight: 4 }} />
            <Text style={styles.btnCancelText}>İptal Et</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <Shield color="#666" size={12} style={{ marginRight: 4 }} />
              <Text style={styles.featureText}>Escrow Güvencesi</Text>
            </View>
            <View style={styles.featureItem}>
              <QrCode color="#666" size={12} style={{ marginRight: 4 }} />
              <Text style={styles.featureText}>QR ile Ödeme</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.btnAccept}
            onPress={() => onAccept(item)}
          >
            <Text style={styles.btnAcceptText}>Paylaş & Kazan</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
});

export function TaleplerScreen() {
  const navigation = useNavigation<any>();
  const profile = useAuthStore(state => state.profile);
  
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
    if (profile?.id) {
      fetchTransactions(profile.id);
    }
  }, [profile?.id]);

  const onRefresh = useCallback(() => {
    if (profile?.id) {
      fetchTransactions(profile.id);
    }
  }, [profile?.id, fetchTransactions]);

  const handleAcceptClick = useCallback((item: any) => {
    setSelectedTx(item);
    setIsModalOpen(true);
  }, []);

  const confirmAccept = useCallback(async (supportPercentage: number) => {
    if (!profile || !selectedTx) return;
    try {
      await acceptTransaction(selectedTx.id, profile.id, supportPercentage);
      setIsModalOpen(false);
      setSelectedTx(null);
      navigation.navigate('Tracker', { id: selectedTx.id });
    } catch (error) {
       Alert.alert('Error', 'Something went wrong while accepting the request.');
    }
  }, [profile, selectedTx, acceptTransaction, navigation]);

  const handleCancel = useCallback((txId: string) => {
    if (!profile) return;
    Alert.alert('İptal Et', 'Bu talebi iptal etmek istediğinize emin misiniz?', [
      { text: 'Hayır', style: 'cancel' },
      { text: 'Evet', style: 'destructive', onPress: () => cancelTransaction(txId, profile.id) }
    ]);
  }, [profile, cancelTransaction]);

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
        {/* Header Options */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TALEPLER</Text>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => navigation.navigate('TaleplerCreate')}
          >
            <Plus color="#0A0B1E" size={20} fontWeight="bold" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
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

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statsContent}>
            <Text style={styles.statsLabel}>AKTİF TALEPLER</Text>
            <Text style={styles.statsValue}>{currentData.length}</Text>
          </View>
          <View style={styles.statsIconBox}>
            <BarChart2 color="#33f20d" size={24} />
          </View>
        </View>

        {/* List */}
        {loading && currentData.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color="#00FF00" size="large" />
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
              <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#00FF00" />
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
                  <X color="#aaa" size={24} />
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
                   <Text style={styles.modalSelectBtnText}>Bunu Seç</Text>
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
                   <Text style={styles.modalSelectBtnTextGold}>Bunu Seç</Text>
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#33f20d',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  addBtn: {
    backgroundColor: '#33f20d',
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 242, 13, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#33f20d',
  },
  tabText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#33f20d',
  },
  statsContainer: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    borderLeftColor: '#33f20d',
    marginBottom: 16,
  },
  statsContent: {},
  statsLabel: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statsValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(51, 242, 13, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 242, 13, 0.2)',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  requestCard: {
    backgroundColor: '#12142d',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  myRequestCard: {
    opacity: 0.9,
  },
  myBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 10,
  },
  myBadgeText: {
    color: '#aaa',
    fontSize: 8,
    fontWeight: 'bold',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingTop: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountContainer: {
    backgroundColor: '#1a471e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  amountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  amountLabel: {
    color: 'rgba(51, 242, 13, 0.8)',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
    marginRight: 8,
  },
  titleText: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: 'bold',
  },
  btnAccept: {
    backgroundColor: '#1b5e20',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnAcceptText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btnFollow: {
    backgroundColor: '#334155',
  },
  btnFollowText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  btnCancel: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  btnCancelText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 12,
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
    color: '#666',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1d36',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  modalCloseBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  modalOptionContainer: {
    backgroundColor: '#222542',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  modalOptionTitle: {
    color: '#3b82f6',
    fontSize: 18,
    fontWeight: '900',
  },
  modalOptionTitleGold: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: '900',
  },
  modalBadgeStandart: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalBadgeTextStandart: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalBadgeGold: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalBadgeTextGold: {
    color: '#78350f',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOptionDetails: {
    marginBottom: 12,
    gap: 8,
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalOptionRowLabel: {
    color: '#888',
    fontSize: 14,
  },
  modalOptionRowValue: {
    color: '#ddd',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOptionTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
    marginBottom: 12,
  },
  modalOptionTotalLabel: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOptionTotalValue: {
    color: '#3b82f6',
    fontWeight: '900',
    fontSize: 18,
  },
  modalOptionEarnBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalOptionEarnLabel: {
    color: '#60a5fa',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalOptionEarnValue: {
    color: '#3b82f6',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  modalOptionEarnSub: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalSelectBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSelectBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOptionEarnBoxGold: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalOptionEarnLabelGold: {
    color: '#fcd34d',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalOptionGoldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 8,
  },
  modalOptionGoldRowLabel: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOptionGoldRowValue: {
    color: '#fbbf24',
    fontSize: 20,
    fontWeight: '900',
  },
  modalSelectBtnGold: {
    backgroundColor: '#fbbf24',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSelectBtnTextGold: {
    color: '#78350f',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
