import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Animated } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { DBService } from '../services/dbService';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { ChevronLeft, Check, CreditCard, QrCode, Upload as UploadIcon, CheckCircle2, Info, RefreshCw } from 'lucide-react-native';

export function TrackerScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params || {};
  const { profile } = useAuthStore();
  
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [pulseAnim]);

  const fetchTransaction = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *, 
          seeker:profiles!transactions_seeker_id_fkey(full_name),
          supporter:profiles!transactions_supporter_id_fkey(full_name)
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setTransaction(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTransaction();
      
      const channel = supabase
        .channel(`tracker-${id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `id=eq.${id}`
        }, (payload: any) => {
          fetchTransaction();
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading || !transaction) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#8eff71" size="large" />
      </View>
    );
  }

  const isSeeker = profile?.id === transaction.seeker_id;
  const status = transaction.status;

  const statusOrder = [
    'waiting-supporter',
    'waiting-cash-payment',
    'cash-paid',
    'qr-uploaded',
    'completed'
  ];
  
  const currentIndex = statusOrder.indexOf(status);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      setTransaction({ ...transaction, status: newStatus });
    } catch (err) {
      Alert.alert('Hata', 'Durum güncellenirken hata oluştu');
    }
  };

  const handleCancel = () => {
    Alert.alert('Emin misiniz?', 'İşlemi iptal etmek istediğinize emin misiniz?', [
      { text: 'Hayır', style: 'cancel' },
      { text: 'Evet', style: 'destructive', onPress: () => handleUpdateStatus('cancelled') }
    ]);
  };

  // Steps configuration (matching HTML design labels and icons)
  const steps = [
    {
      id: 'waiting-supporter',
      label: currentIndex > 0 ? 'EŞLEŞME SAĞLANDI' : 'EŞLEŞME BEKLENİYOR',
      icon: RefreshCw,
      descActive: 'Yapay zeka ağ üzerinde en uygun partneri arıyor...',
      descCompleted: 'Eşleşme sağlandı.',
      descPending: 'Bekliyor...',
    },
    {
      id: 'waiting-cash-payment',
      label: 'ÖDEME BEKLENİYOR',
      icon: CreditCard,
      descActive: 'Lütfen belirtilen tutarı ödeyin.',
      descCompleted: 'Ödeme tamamlandı.',
      descPending: 'Bekliyor...',
      renderAction: () => isSeeker ? (
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus('cash-paid')}>
          <Text style={styles.actionBtnText}>ÖDEMEYİ YAPTIM</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.infoText}>Karşı taraf ödemeyi onayladığında QR açılacaktır.</Text>
      )
    },
    {
      id: 'cash-paid',
      label: 'QR KOD HAZIRLANIYOR',
      icon: QrCode,
      descActive: 'QR kodun sisteme yüklenmesi bekleniyor.',
      descCompleted: 'QR kod hazırlandı.',
      descPending: 'Bekliyor...',
      renderAction: () => !isSeeker ? (
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus('qr-uploaded')}>
          <Text style={styles.actionBtnText}>QR KODU YÜKLE</Text>
        </TouchableOpacity>
      ) : null
    },
    {
      id: 'qr-uploaded',
      label: 'QR YÜKLENDİ',
      icon: UploadIcon,
      descActive: 'Lütfen QR kodu onaylayın.',
      descCompleted: 'QR kod onaylandı.',
      descPending: 'Bekliyor...',
      renderAction: () => isSeeker ? (
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus('completed')}>
          <Text style={styles.actionBtnText}>İŞLEMİ ONAYLA</Text>
        </TouchableOpacity>
      ) : null
    },
    {
      id: 'completed',
      label: 'TAMAMLANDI',
      icon: CheckCircle2,
      descActive: 'İşlem Başarılı',
      descCompleted: 'İşlem Başarılı',
      descPending: 'Bekliyor...',
      renderAction: () => (
        <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => navigation.navigate('MainTabs', { screen: 'Talepler' })}>
          <Text style={styles.actionBtnTextPrimary}>ANA SAYFAYA DÖN</Text>
        </TouchableOpacity>
      )
    }
  ];

  return (
    <View style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <ChevronLeft color="#8eff71" size={24} strokeWidth={3} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SÜREÇ TAKİBİ</Text>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Status indicator for active/cancelled */}
        <View style={styles.statusBox}>
           {status === 'cancelled' ? (
             <Text style={styles.statusBoxTextCancelled}>İŞLEM İPTAL EDİLDİ</Text>
           ) : (
             <Text style={styles.statusBoxTextActive}>İŞLEM DEVAM EDİYOR</Text>
           )}
        </View>

        {/* Vertical Progress Tracker */}
        <View style={styles.trackerContainer}>
          {/* Vertical Timeline Line */}
          <View style={styles.timelineLineWrapper}>
             <View style={styles.timelineLine} />
          </View>

          {steps.map((step, index) => {
            const stepIndex = statusOrder.indexOf(step.id);
            let state = 'pending';
            if (currentIndex === -1 || status === 'cancelled') state = 'pending';
            else if (currentIndex > stepIndex) state = 'completed';
            else if (currentIndex === stepIndex) state = 'active';

            const isActive = state === 'active';
            const isCompleted = state === 'completed';
            const isPending = state === 'pending';

            const StepIcon = step.icon;

            return (
              <View 
                key={step.id} 
                style={[
                  styles.stepItem, 
                  isPending && styles.stepItemPending
                ]}
              >
                {/* Step Node */}
                <View style={styles.nodeWrapper}>
                  {isActive ? (
                    <View style={styles.activeNodeContainer}>
                      <Animated.View style={[styles.activeNodeGlow, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({inputRange: [1, 1.15], outputRange: [0.8, 0.4]}) }]} />
                      <View style={styles.nodeActive}>
                        <StepIcon size={18} color="#0d6100" />
                      </View>
                    </View>
                  ) : isCompleted ? (
                    <View style={styles.nodeCompleted}>
                      <StepIcon size={18} color="#8eff71" />
                    </View>
                  ) : (
                    <View style={styles.nodePending}>
                      <StepIcon size={18} color="#aaaab6" />
                    </View>
                  )}
                </View>

                {/* Step Content */}
                <View style={styles.stepContentBox}>
                  <Text style={[
                      styles.stepLabel, 
                      isActive || isCompleted ? styles.stepLabelHighlight : styles.stepLabelPending
                    ]}
                  >
                    {step.label}
                  </Text>
                  
                  <Text style={styles.stepDesc}>
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

        {/* Action Button Section (Cancel) */}
        {status !== 'completed' && status !== 'cancelled' && (
          <View style={styles.cancelSection}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>İŞLEMİ İPTAL ET</Text>
            </TouchableOpacity>
            
            <View style={styles.cancelInfoBox}>
              <Info color="#ff7351" size={14} />
              <Text style={styles.cancelInfoText}>GERİ DÖNÜŞÜ OLMAYAN EYLEM</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0e16',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(12, 14, 22, 0.9)',
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8eff71',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  content: {
    paddingTop: 100,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  statusBox: {
    marginBottom: 32,
  },
  statusBoxTextActive: {
    color: '#8eff71',
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    opacity: 0.8,
  },
  statusBoxTextCancelled: {
    color: '#ff7351',
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  trackerContainer: {
    position: 'relative',
    paddingLeft: 8,
  },
  timelineLineWrapper: {
    position: 'absolute',
    left: 23, // 8px padding + 15px to center of 32px node wrapper
    top: 16,
    bottom: 60,
    width: 3,
    backgroundColor: 'rgba(237, 237, 249, 0.1)', // surface-variant/30 equivalent sort of
    borderRadius: 2,
    overflow: 'hidden',
  },
  timelineLine: {
    width: '100%',
    height: '100%',
    // we would animate gradient here, but a static color representing the path is fine
    backgroundColor: 'rgba(142, 255, 113, 0.5)',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 48,
    alignItems: 'flex-start',
    gap: 24,
  },
  stepItemPending: {
    opacity: 0.4,
  },
  nodeWrapper: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNodeContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeNodeGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(142, 255, 113, 0.4)',
  },
  nodeActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8eff71',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 5,
  },
  nodeCompleted: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8eff71',
    zIndex: 10,
  },
  nodePending: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222531', // surface-variant
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  stepContentBox: {
    flex: 1,
    paddingTop: 4,
  },
  stepLabel: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  stepLabelHighlight: {
    color: '#8eff71', // primary for active/completed
  },
  stepLabelPending: {
    color: '#ededf9', // on-surface
  },
  stepDesc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#aaaab6', // on-surface-variant
    lineHeight: 18,
  },
  actionContainer: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
  actionBtn: {
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(142, 255, 113, 0.4)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#8eff71',
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionBtnPrimary: {
    backgroundColor: '#8eff71',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  actionBtnTextPrimary: {
    color: '#0d6100',
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoText: {
    color: '#aaaab6',
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    fontStyle: 'italic',
  },
  cancelSection: {
    marginTop: 64,
    alignItems: 'center',
    gap: 16,
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 115, 81, 0.05)', // error/5
    borderWidth: 1,
    borderColor: 'rgba(255, 115, 81, 0.2)', // error/20
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ff7351', // error
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  cancelInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.5,
  },
  cancelInfoText: {
    color: '#ededf9',
    fontFamily: 'Manrope-Medium',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
