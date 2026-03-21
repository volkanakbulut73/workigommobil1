import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { ChevronLeft, Check, QrCode, CreditCard, Flag, X } from 'lucide-react-native';

export function TrackerScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params || {};
  const { profile } = useAuthStore();
  
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          // Re-fetch to get complete relations or update directly
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
        <ActivityIndicator color="#00e5ff" size="large" />
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

  // Steps configuration
  const steps = [
    {
      id: 'waiting-supporter',
      label: currentIndex > 0 ? 'Eşleşme Sağlandı' : 'Eşleşme Bekleniyor',
      icon: <Check size={20} color="#fff" />,
      descActive: 'İşleniyor...', descCompleted: 'Tamamlandı', descPending: 'Bekliyor',
    },
    {
      id: 'waiting-cash-payment',
      label: 'Ödeme Bekleniyor',
      icon: <CreditCard size={20} color="#fff" />,
      descActive: 'İşleniyor...', descCompleted: 'Ödendi', descPending: 'Bekliyor',
      renderAction: () => isSeeker ? (
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus('cash-paid')}>
          <Text style={styles.actionBtnText}>Ödemeyi Yaptım</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.infoText}>Karşı taraf ödemeyi onayladığında QR açılacaktır.</Text>
      )
    },
    {
      id: 'cash-paid',
      label: 'QR Kod Bekleniyor',
      icon: <QrCode size={20} color="#fff" />,
      descActive: 'İşleniyor...', descCompleted: 'Hazırlandı', descPending: 'Bekliyor',
      renderAction: () => !isSeeker ? (
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus('qr-uploaded')}>
          <Text style={styles.actionBtnText}>QR Kodu Yükle (Simüle)</Text>
        </TouchableOpacity>
      ) : null
    },
    {
      id: 'qr-uploaded',
      label: 'QR Onayı',
      icon: <QrCode size={20} color="#fff" />,
      descActive: 'İşleniyor...', descCompleted: 'Onaylandı', descPending: 'Bekliyor',
      renderAction: () => isSeeker ? (
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus('completed')}>
          <Text style={styles.actionBtnText}>İşlemi Onayla</Text>
        </TouchableOpacity>
      ) : null
    },
    {
      id: 'completed',
      label: 'Tamamlandı',
      icon: <Flag size={20} color="#fff" />,
      descActive: 'İşlem Başarılı', descCompleted: 'İşlem Başarılı', descPending: 'Bekliyor',
      renderAction: () => (
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Talepler' })}>
          <Text style={styles.actionBtnText}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>
      )
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#00e5ff" size={24} />
        </TouchableOpacity>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}> CANLI</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>İşlem Detayları</Text>
        <Text style={styles.subtitle}>
          Durum: <Text style={styles.subtitleHighlight}>{status === 'cancelled' ? 'İptal Edildi' : 'Devam Ediyor'}</Text>
        </Text>

        <View style={styles.timelineContainer}>
          {/* Vertical Line */}
          <View style={styles.timelineLine} />

          {steps.map((step, index) => {
            const stepIndex = statusOrder.indexOf(step.id);
            // Default pending
            let state = 'pending';
            if (currentIndex === -1 || status === 'cancelled') state = 'pending';
            else if (currentIndex > stepIndex) state = 'completed';
            else if (currentIndex === stepIndex) state = 'active';

            const isActive = state === 'active';
            const isCompleted = state === 'completed';

            return (
              <View key={step.id} style={[styles.stepItem, state === 'pending' && { opacity: 0.5 }]}>
                {/* Node */}
                <View style={styles.nodeWrapper}>
                  {isActive ? (
                    <View style={styles.nodeActive}>
                      <View style={styles.nodeActiveInner} />
                    </View>
                  ) : isCompleted ? (
                    <View style={styles.nodeCompleted}>
                      <Check size={16} color="#00e5ff" />
                    </View>
                  ) : (
                    <View style={styles.nodePending}>
                      <Text style={styles.nodePendingText}>{index + 1}</Text>
                    </View>
                  )}
                </View>

                {/* Content */}
                <View style={styles.stepContent}>
                  <View style={styles.stepHeaderRow}>
                    <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{step.label}</Text>
                    {isActive && (
                      <View style={styles.badgeActive}>
                        <Text style={styles.badgeActiveText}>ŞU AN BURADASINIZ</Text>
                      </View>
                    )}
                  </View>
                  
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

        {status !== 'completed' && status !== 'cancelled' && (
          <TouchableOpacity style={styles.btnCancel} onPress={handleCancel}>
            <X color="#f91a9c" size={18} />
            <Text style={styles.btnCancelText}>İŞLEMİ İPTAL ET</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050a19' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backBtn: { width: 40 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1529',
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#00e5ff',
  },
  liveText: { color: '#00e5ff', fontSize: 10, fontWeight: 'bold' },
  content: { padding: 24, paddingBottom: 60 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#aaa', fontSize: 14, marginBottom: 32 },
  subtitleHighlight: { color: '#00e5ff', fontWeight: 'bold' },
  timelineContainer: { position: 'relative', paddingLeft: 8 },
  timelineLine: {
    position: 'absolute',
    left: 27,
    top: 10,
    bottom: 40,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 0,
  },
  stepItem: { flexDirection: 'row', marginBottom: 40, zIndex: 1 },
  nodeWrapper: { width: 40, alignItems: 'center', marginRight: 16 },
  nodeActive: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(0, 229, 255, 0.5)',
  },
  nodeActiveInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#00e5ff' },
  nodeCompleted: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#0a1529',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#00e5ff',
  },
  nodePending: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#0a1529',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  nodePendingText: { color: '#666', fontWeight: 'bold' },
  stepContent: { flex: 1, paddingTop: 6 },
  stepHeaderRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 },
  stepLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  stepLabelActive: { color: '#00e5ff' },
  badgeActive: {
    backgroundColor: '#00e5ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  badgeActiveText: { color: '#050a19', fontSize: 8, fontWeight: 'bold' },
  stepDesc: { color: '#aaa', fontSize: 13 },
  actionContainer: { marginTop: 16 },
  actionBtn: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)',
    paddingVertical: 12, borderRadius: 12, alignItems: 'center',
  },
  actionBtnText: { color: '#00e5ff', fontWeight: 'bold' },
  infoText: { color: '#aaa', fontSize: 12, fontStyle: 'italic' },
  btnCancel: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 32, paddingVertical: 16, borderRadius: 12,
    backgroundColor: 'rgba(249, 26, 156, 0.1)',
    borderWidth: 1, borderColor: 'rgba(249, 26, 156, 0.3)',
  },
  btnCancelText: { color: '#f91a9c', fontWeight: 'bold', marginLeft: 8 },
});
