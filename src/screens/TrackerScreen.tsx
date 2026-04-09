import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Animated, Image, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Transaction } from '../types';
import { DBService } from '../services/dbService';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { ChevronLeft, CheckCircle2, User, CreditCard, QrCode, Flag, Info, Camera, Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');
const formatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });

export function TrackerScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params || {};
  const { profile } = useAuthStore();
  
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const statusLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

  const fetchTransaction = async () => {
    try {
      const tx = await DBService.getTransactionById(id);
      if (tx) setTransaction(tx);
    } catch (err: any) {
      console.error('TrackerScreen fetchTransaction error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTransaction();
      
      const channel = supabase
        .channel('public-chat')
        .on('broadcast', { event: 'transaction_updated' }, (payload) => {
          if (payload.payload?.transactionId === id) {
            fetchTransaction();
          }
        })
        .subscribe();
        
      const interval = setInterval(() => {
        fetchTransaction();
      }, 3000);
        
      return () => { 
        (supabase as any).removeChannel(channel); 
        clearInterval(interval);
      };
    } else {
      setLoading(false);
    }
  }, [id]);

  const status = transaction?.status || 'waiting-supporter';
  const statusOrder = ['waiting-supporter', 'waiting-cash-payment', 'cash-paid', 'qr-uploaded', 'payment-verified', 'completed'];
  const currentIndex = statusOrder.indexOf(status);

  useEffect(() => {
    if (currentIndex >= 0 && !loading) {
      Animated.timing(statusLineAnim, {
        toValue: Math.min((currentIndex * 25) + 20, 100),
        duration: 1000,
        useNativeDriver: false
      }).start();
    }
  }, [currentIndex, loading, statusLineAnim]);

  if (loading || !transaction) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#00ff88" size="large" />
      </View>
    );
  }

  const isSeeker = profile?.id === transaction.seeker_id;
  const otherPartyName = isSeeker ? transaction.supporter?.full_name : transaction.seeker?.full_name;

  const handleUpdateStatus = async (newStatus: Transaction['status'], updates: any = {}) => {
    try {
      await DBService.updateTransactionStatus(id, newStatus, updates);
      setTransaction({ ...transaction, status: newStatus, ...updates });
    } catch (err) {
      Alert.alert('Hata', 'Durum güncellenirken hata oluştu');
    }
  };

  const handleCancel = () => {
    const isMeSeeker = profile?.id === transaction?.seeker_id;
    const confirmMsg = isMeSeeker
      ? 'Talebi tamamen iptal etmek istediğinize emin misiniz? Talep silinecektir.'
      : 'İşlemden çekilmek istediğinize emin misiniz? Talep yeni bir destekçi arayacak.';

    Alert.alert('Emin misiniz?', confirmMsg, [
      { text: 'Hayır', style: 'cancel' },
      { text: 'Evet', style: 'destructive', onPress: async () => {
        try {
          if (isMeSeeker) {
            await DBService.cancelTransactionBySeeker(id);
          } else {
            await DBService.cancelTransactionBySupporter(id);
          }
          navigation.navigate('MainTabs', { screen: 'Talepler' });
        } catch (err) {
          console.error(err);
          Alert.alert('Hata', 'İptal edilirken bir hata oluştu');
        }
      }}
    ]);
  };

  const handleQRFileChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (!file.base64) return;
        try {
            Alert.alert("Yükleniyor", "Lütfen bekleyin...");
            const url = await DBService.uploadImage(file.base64, 'images');
            await handleUpdateStatus('qr-uploaded', { qr_url: url });
        } catch(err) {
            console.error(err);
            Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu');
        }
    }
  };

  const renderActionCard = () => (
    <View style={styles.actionCard}>
        <View style={styles.actionCardHeader}>
            <Text style={styles.actionCardSubtitle}>ALICI BİLGİSİ</Text>
            <View style={styles.actionCardUserRow}>
                <View style={styles.actionCardAvatar}>
                    <User color="#00e5ff" size={18} />
                </View>
                <View>
                    <Text style={styles.actionCardName}>{otherPartyName || 'İsimsiz Üye'}</Text>
                    <Text style={styles.actionCardRole}>Onaylı Üye</Text>
                </View>
            </View>
        </View>
        
        <View style={styles.actionCardRow}>
            <Text style={styles.actionCardLabel}>TUTAR</Text>
            <Text style={styles.actionCardAmount}>
                {transaction ? formatter.format(transaction.amount * (transaction.support_percentage === 100 ? 0 : 0.88)) : '0,00 ₺'}
            </Text>
        </View>
        
        <View style={styles.actionCardRowNoBorder}>
            <Text style={styles.actionCardLabel}>RESTORAN</Text>
            <Text style={styles.actionCardValue}>{transaction?.listing_title || 'İlan'}</Text>
        </View>

        {isSeeker ? (
            <TouchableOpacity style={styles.btnPrimaryFilled} onPress={() => handleUpdateStatus('cash-paid')}>
                <Text style={styles.btnPrimaryFilledText}>Ödemeyi Yaptım</Text>
            </TouchableOpacity>
        ) : (
            <View style={styles.infoRow}>
                <Info color="#00e5ff" size={14} />
                <Text style={styles.infoText}>Karşı taraf ödemeyi onayladığında QR kod açılacaktır.</Text>
            </View>
        )}
    </View>
  );

  const seekerSteps = [
    {
      id: 'waiting-supporter',
      label: currentIndex > 0 ? 'Eşleşme Sağlandı' : 'Eşleşme Bekleniyor',
      icon: CheckCircle2,
      descActive: 'İşleniyor...', descCompleted: 'Tamamlandı', descPending: 'Bekliyor',
    },
    {
      id: 'waiting-cash-payment',
      label: 'Ödeme Bekleniyor',
      icon: CreditCard,
      descActive: 'İşleniyor...', descCompleted: 'Ödendi', descPending: 'Bekliyor',
      renderAction: renderActionCard
    },
    {
      id: 'cash-paid',
      label: 'QR Kod Hazırlanıyor',
      icon: QrCode,
      descActive: 'İşleniyor...', descCompleted: 'Hazırlandı', descPending: 'Bekliyor',
    },
    {
      id: 'qr-uploaded',
      label: 'QR Yüklendi',
      icon: QrCode,
      descActive: 'İşleniyor...', descCompleted: 'Onaylandı', descPending: 'Bekliyor',
      renderAction: () => (
          <View style={{ marginTop: 16 }}>
              <View style={styles.qrPreviewContainer}>
                  {transaction?.qr_url ? (
                      <Image source={{ uri: transaction.qr_url }} style={styles.qrImage} resizeMode="contain" />
                  ) : (
                      <ImageIcon color="#aaaab6" size={40} />
                  )}
              </View>
              <TouchableOpacity style={styles.btnPrimaryFilledGreen} onPress={() => handleUpdateStatus('completed')}>
                  <Text style={styles.btnPrimaryFilledTextGreen}>İşlemi Onayla</Text>
              </TouchableOpacity>
          </View>
      )
    },
    {
      id: 'completed',
      label: 'Tamamlandı',
      icon: Flag,
      descActive: 'İşlem Başarılı', descCompleted: 'İşlem Başarılı', descPending: 'Bekliyor',
      renderAction: () => (
          <View style={styles.completedBox}>
              <Text style={styles.completedBoxTitle}>Tebrikler!</Text>
              <TouchableOpacity style={styles.btnPrimaryFilledGreen} onPress={() => navigation.navigate('MainTabs', { screen: 'Talepler' })}>
                  <Text style={styles.btnPrimaryFilledTextGreen}>Ana Sayfaya Dön</Text>
              </TouchableOpacity>
          </View>
      )
    }
  ];

  const supporterSteps = [
    {
      id: 'waiting-cash-payment',
      label: 'Ödeme Bekleniyor',
      icon: CreditCard,
      descActive: 'İşleniyor...', descCompleted: 'Alındı', descPending: 'Bekleniyor',
    },
    {
      id: 'cash-paid',
      label: 'QR Hazırla',
      icon: QrCode,
      descActive: 'İşleniyor...', descCompleted: 'Yüklendi', descPending: 'Bekliyor',
      renderAction: () => (
          <View style={{ marginTop: 16 }}>
              <TouchableOpacity style={styles.uploadArea} onPress={handleQRFileChange}>
                  <Camera color="#00e5ff" size={32} />
                  <Text style={styles.uploadAreaText}>FOTOĞRAF YÜKLE</Text>
              </TouchableOpacity>
          </View>
      )
    },
    {
      id: 'qr-uploaded',
      label: 'QR Yüklendi',
      icon: QrCode,
      descActive: 'İşleniyor...', descCompleted: 'Onaylandı', descPending: 'Bekliyor',
      renderAction: () => (
          <View style={{ marginTop: 16 }}>
              <View style={styles.qrPreviewContainer}>
                  {transaction?.qr_url ? (
                      <Image source={{ uri: transaction.qr_url }} style={styles.qrImage} resizeMode="contain" />
                  ) : (
                      <ImageIcon color="#aaaab6" size={40} />
                  )}
              </View>
          </View>
      )
    },
    {
      id: 'completed',
      label: 'Tamamlandı',
      icon: Flag,
      descActive: 'İşlem Başarılı', descCompleted: 'İşlem Başarılı', descPending: 'Bekliyor',
      renderAction: () => (
          <View style={styles.completedBox}>
              <Text style={styles.completedBoxTitle}>Tebrikler!</Text>
              <TouchableOpacity style={styles.btnPrimaryFilledGreen} onPress={() => navigation.navigate('MainTabs', { screen: 'Talepler' })}>
                  <Text style={styles.btnPrimaryFilledTextGreen}>Ana Sayfaya Dön</Text>
              </TouchableOpacity>
          </View>
      )
    }
  ];

  const stepsToRender = isSeeker ? seekerSteps : supporterSteps;

  return (
    <View style={styles.container}>
      {/* Background Decorators */}
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />
      <View style={styles.bgGlowRight} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <ChevronLeft color="#00ff88" size={24} strokeWidth={3} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>CANLI</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.titleSection}>
          <Text style={styles.listingIdText}>{transaction.listing_id || 'REQ-ID'}</Text>
          <Text style={styles.mainTitle}>İşlem Detayları</Text>
          <Text style={styles.subTitle}>Tahmini tamamlanma: <Text style={{color: '#00e5ff', fontWeight:'bold'}}>2 dk</Text></Text>
        </View>

        <View style={styles.trackerContainer}>
          <View style={styles.timelineLineWrapper}>
             <View style={styles.timelineLineBg} />
             <Animated.View style={[styles.timelineLineActive, { height: statusLineAnim.interpolate({
                 inputRange: [0, 100], outputRange: ['0%', '100%']
             }) }]} />
          </View>

          {stepsToRender.map((step, index) => {
            const stepIndex = statusOrder.indexOf(step.id);
            let state = 'pending';
            if (currentIndex === -1 || status === 'cancelled') state = 'pending';
            else if (currentIndex > stepIndex) state = 'completed';
            else if (currentIndex === stepIndex) state = 'active';

            const isActive = state === 'active';
            const isCompleted = state === 'completed';
            const isPending = state === 'pending';
            const isLast = index === stepsToRender.length - 1;
            const StepIcon = step.icon;

            return (
              <View key={step.id} style={[styles.stepItem, isPending && { opacity: 0.5 }, !isLast && { marginBottom: 40 }]}>
                <View style={styles.nodeWrapper}>
                  {isActive ? (
                    <View style={styles.activeNodeContainer}>
                      <Animated.View style={[styles.activeNodeGlow, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({inputRange: [1, 1.15], outputRange: [0.3, 0.1]}) }]} />
                      <View style={styles.nodeActive}>
                        <View style={styles.nodeActiveInner} />
                      </View>
                    </View>
                  ) : isCompleted ? (
                    <View style={styles.nodeCompleted}>
                      <StepIcon size={20} color="#00e5ff" />
                    </View>
                  ) : (
                    <View style={styles.nodePending}>
                      <Text style={styles.nodePendingText}>{index + 1}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.stepContentBox}>
                  <View style={styles.stepLabelRow}>
                      <Text style={[styles.stepLabel, isActive && styles.stepLabelHighlight]}>{step.label}</Text>
                      {isActive && (
                          <View style={styles.activeTag}>
                              <Text style={styles.activeTagText}>ŞU AN BURADASINIZ</Text>
                          </View>
                      )}
                  </View>
                  
                  <Text style={[styles.stepDesc, isCompleted && { color: 'rgba(0, 229, 255, 0.7)' }]}>
                    {isCompleted ? step.descCompleted : isActive ? step.descActive : step.descPending}
                  </Text>

                  {isActive && step.renderAction && (
                    <View style={styles.actionContainer}>
                      {step.renderAction()}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {status !== 'completed' && status !== 'cancelled' && status !== 'dismissed' && (
          <View style={styles.cancelSection}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
              <X color="#f91a9c" size={20} />
              <Text style={styles.cancelBtnText}>İŞLEMİ İPTAL ET</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {status === 'completed' && !hasFiredConfetti && (
        <ConfettiCannon count={200} origin={{x: width / 2, y: -20}} fadeOut onAnimationEnd={() => setHasFiredConfetti(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A19' },
  center: { justifyContent: 'center', alignItems: 'center' },
  bgGlowTop: { position: 'absolute', top: 0, left: 0, width: '100%', height: 160, backgroundColor: 'rgba(0, 229, 255, 0.05)' },
  bgGlowBottom: { position: 'absolute', bottom: -80, left: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(0, 255, 136, 0.03)' },
  bgGlowRight: { position: 'absolute', top: 160, right: -50, width: 256, height: 256, borderRadius: 128, backgroundColor: 'rgba(0, 229, 255, 0.03)' }, // These mimic the very faint sci-fi grid glow
  
  header: { paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', zIndex: 10, paddingBottom: 10 },
  backBtn: { padding: 4 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A1529', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0, 255, 136, 0.3)' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00ff88', marginRight: 8, shadowColor: '#00ff88', shadowRadius: 8, shadowOpacity: 0.8, shadowOffset: { width: 0, height: 0 } },
  liveText: { color: '#00ff88', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  
  content: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 40 },
  titleSection: { marginBottom: 32 },
  listingIdText: { color: 'rgba(0, 229, 255, 0.5)', fontSize: 13, fontWeight: 'bold', marginBottom: 4, letterSpacing: 1 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0, 229, 255, 0.5)', textShadowRadius: 8, marginBottom: 8 },
  subTitle: { fontSize: 14, color: '#aaaab6' },

  trackerContainer: { position: 'relative', paddingLeft: 4 },
  timelineLineWrapper: { position: 'absolute', left: 21, top: 40, bottom: 40, width: 6, borderRadius: 3, backgroundColor: '#0A1529', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  timelineLineBg: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'transparent' },
  timelineLineActive: { width: '100%', backgroundColor: '#00ff88', shadowColor: '#00ff88', shadowRadius: 15, shadowOpacity: 0.5, shadowOffset: { width: 0, height: 0 } },
  
  stepItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  nodeWrapper: { width: 40, alignItems: 'center', justifyContent: 'center' },
  activeNodeContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  activeNodeGlow: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 229, 255, 0.3)' },
  nodeActive: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00e5ff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#00e5ff', shadowRadius: 20, shadowOpacity: 0.6, shadowOffset: { width: 0, height: 0 } },
  nodeActiveInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#050A19' },
  nodeCompleted: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0A1529', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#00e5ff', shadowColor: '#00e5ff', shadowRadius: 15, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 0 } },
  nodePending: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0A1529', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  nodePendingText: { color: '#aaaab6', fontWeight: 'bold', fontSize: 14 },

  stepContentBox: { flex: 1, paddingTop: 6 },
  stepLabelRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  stepLabel: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  stepLabelHighlight: { color: '#00e5ff', textShadowColor: 'rgba(0, 229, 255, 0.5)', textShadowRadius: 8 },
  activeTag: { backgroundColor: '#00e5ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginLeft: 8, shadowColor: '#00e5ff', shadowRadius: 10, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 0 } },
  activeTagText: { color: '#050A19', fontSize: 9, fontWeight: 'bold' },
  stepDesc: { fontSize: 13, color: '#aaaab6', marginTop: 2, fontWeight: '500' },
  actionContainer: { marginTop: 0 },

  actionCard: { marginTop: 16, backgroundColor: 'rgba(10, 21, 41, 0.6)', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#00e5ff', borderColor: 'rgba(0, 229, 255, 0.2)', borderWidth: 1, shadowColor: '#000', shadowRadius: 30, shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 } },
  actionCardHeader: { marginBottom: 12 },
  actionCardSubtitle: { fontSize: 10, color: 'rgba(0, 229, 255, 0.8)', fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  actionCardUserRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionCardAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0, 229, 255, 0.2)', borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  actionCardName: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  actionCardRole: { color: '#aaaab6', fontSize: 10 },
  actionCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(0, 229, 255, 0.1)' },
  actionCardRowNoBorder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 8 },
  actionCardLabel: { fontSize: 12, color: 'rgba(0, 229, 255, 0.8)', fontWeight: '600', letterSpacing: 1 },
  actionCardAmount: { color: '#00e5ff', fontSize: 18, fontWeight: 'bold', textShadowColor: 'rgba(0, 229, 255, 0.5)', textShadowRadius: 8 },
  actionCardValue: { color: '#fff', fontSize: 14, fontWeight: '500' },

  btnPrimaryFilled: { marginTop: 16, width: '100%', paddingVertical: 12, backgroundColor: '#00e5ff', borderRadius: 12, alignItems: 'center', shadowColor: '#00e5ff', shadowRadius: 15, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 0 } },
  btnPrimaryFilledText: { color: '#050A19', fontSize: 14, fontWeight: 'bold' },
  
  btnPrimaryFilledGreen: { marginTop: 16, width: '100%', paddingVertical: 12, backgroundColor: '#00ff88', borderRadius: 12, alignItems: 'center', shadowColor: '#00ff88', shadowRadius: 15, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 0 } },
  btnPrimaryFilledTextGreen: { color: '#0A1529', fontSize: 14, fontWeight: 'bold' },

  infoRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0, 229, 255, 0.2)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 10, color: '#aaaab6', flex: 1 },

  uploadArea: { width: '100%', paddingVertical: 32, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(0, 229, 255, 0.5)', borderStyle: 'dashed', backgroundColor: 'rgba(10, 21, 41, 0.5)', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  uploadAreaText: { color: '#00e5ff', fontWeight: 'bold', marginTop: 8 },

  qrPreviewContainer: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center', height: 200, width: '100%' },
  qrImage: { width: '100%', height: '100%' },

  completedBox: { marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: 'rgba(0, 255, 136, 0.1)', borderWidth: 1, borderColor: 'rgba(0, 255, 136, 0.3)' },
  completedBoxTitle: { color: '#00ff88', fontWeight: 'bold', fontSize: 14, textAlign: 'center', paddingBottom: 10 },

  cancelSection: { marginTop: 20 },
  cancelBtn: { width: '100%', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(249, 26, 156, 0.5)', backgroundColor: 'rgba(10, 21, 41, 0.5)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#f91a9c', shadowRadius: 15, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 0 } },
  cancelBtnText: { color: '#f91a9c', fontWeight: 'bold', letterSpacing: 1 }
});
