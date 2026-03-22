import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { DBService } from '../services/dbService';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { ChevronLeft, CheckCircle2, Send } from 'lucide-react-native';

export function TalepDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = route.params || {};
  const { profile } = useAuthStore();
  
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [sharePercentage, setSharePercentage] = useState<number | null>(15);

  useEffect(() => {
    if (id) {
      loadTransaction();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadTransaction = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, profiles!transactions_seeker_id_fkey(full_name, avatar_url)`)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setTransaction(data);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Hata', 'İşlem detayı yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!profile || !transaction || sharePercentage === null) return;
    
    setAccepting(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'waiting-cash-payment',
          supporter_id: profile.id,
          support_percentage: sharePercentage
        })
        .eq('id', transaction.id);

      if (error) throw error;
      
      navigation.replace('Tracker', { id: transaction.id });
    } catch (err: any) {
      Alert.alert('Hata', 'Talep kabul edilirken bir hata oluştu');
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#8eff71" size="large" />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Talep bulunamadı.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#8eff71' }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const amount = Number(transaction.amount);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <ChevronLeft color="#8eff71" size={24} strokeWidth={3} />
          <Text style={styles.backText}>GERİ DÖN</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PAYLAŞIM SEÇİMİ</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {transaction.profiles?.full_name || 'Kullanıcı'} için paylaşım oranını seçin
        </Text>

        {/* Option 15% */}
        <TouchableOpacity 
          style={[styles.optionCard, sharePercentage === 15 && styles.optionActive]} 
          onPress={() => setSharePercentage(15)}
          activeOpacity={0.8}
        >
          <View style={styles.optionHeader}>
            <Text style={styles.optionTitle}>%15 Paylaşım</Text>
            <View style={[styles.badge, sharePercentage === 15 && styles.badgeActive]}>
              {sharePercentage === 15 ? (
                <CheckCircle2 color="#93c5fd" size={16} />
              ) : null}
              <Text style={styles.badgeText}>Standart</Text>
            </View>
          </View>
          <View style={styles.detailsBox}>
            <View style={styles.row}>
              <Text style={styles.label}>Senin katkın (İndirim):</Text>
              <Text style={styles.value}>{Math.round(amount * 0.10).toLocaleString('tr-TR')}₺</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Platform ücreti (%5):</Text>
              <Text style={styles.value}>{Math.round(amount * 0.05).toLocaleString('tr-TR')}₺</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Toplam Maliyetin:</Text>
            <Text style={styles.totalValue}>{Math.round(amount * 0.15).toLocaleString('tr-TR')}₺</Text>
          </View>
          <View style={styles.earnBox}>
            <Text style={styles.earnLabel}>Hesabına aktarılacak:</Text>
            <Text style={styles.earnValue}>{(amount * 0.85).toLocaleString('tr-TR')}₺</Text>
            <Text style={styles.earnSub}>Yararlanıcı {(amount * 0.90).toLocaleString('tr-TR')}₺ ödeyecek</Text>
          </View>
        </TouchableOpacity>

        {/* Option 100% */}
        <TouchableOpacity 
          style={[styles.optionCard, styles.optionGold, sharePercentage === 100 && styles.optionGoldActive]} 
          onPress={() => setSharePercentage(100)}
          activeOpacity={0.8}
        >
          <View style={styles.optionHeader}>
            <Text style={styles.optionTitleGold}>%100 Buda Benden 💜</Text>
            <View style={[styles.badgeGold, sharePercentage === 100 && styles.badgeGoldActive]}>
              {sharePercentage === 100 ? (
                <CheckCircle2 color="#fde68a" size={16} />
              ) : null}
              <Text style={styles.badgeGoldText}>Altın Kalp</Text>
            </View>
          </View>
          <View style={styles.detailsBox}>
            <View style={styles.row}>
              <Text style={styles.label}>Senin katkın:</Text>
              <Text style={styles.value}>{amount.toLocaleString('tr-TR')}₺</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Platform ücreti:</Text>
              <Text style={styles.value}>%0 (Bizden)</Text>
            </View>
          </View>
          <View style={styles.earnBoxGold}>
            <Text style={styles.earnLabelGold}>Yemek ücretinin tamamını ödemeyi kabul ettiniz.</Text>
            <View style={styles.earnGoldRow}>
              <Text style={styles.earnGoldRowLabel}>Hesabınıza aktarılacak tutar:</Text>
              <Text style={styles.earnGoldRowValue}>0₺</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btnSubmit, accepting && { opacity: 0.7 }]} 
          onPress={handleAccept}
          disabled={accepting}
          activeOpacity={0.8}
        >
          <Text style={styles.btnSubmitText}>
            {accepting ? 'İşleniyor...' : 'KABUL ET VE BAŞLA'}
          </Text>
          {!accepting && <Send color="#0d6100" size={20} />}
        </TouchableOpacity>
      </View>
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
  errorText: {
    color: '#ff7351',
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(12, 14, 22, 0.9)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 100,
  },
  backText: {
    color: 'rgba(237, 237, 249, 0.7)',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerTitle: {
    color: '#8eff71',
    fontFamily: 'SpaceGrotesk-Black',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(142, 255, 113, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  subtitle: {
    color: '#aaaab6',
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionCard: {
    backgroundColor: '#1d1f2a', // surface-container-high
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  optionActive: {
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  optionGold: {
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  optionGoldActive: {
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    color: '#60a5fa',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    fontWeight: '900',
  },
  optionTitleGold: {
    color: '#fbbf24',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    fontWeight: '900',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  badgeActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  badgeText: {
    color: '#93c5fd',
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeGold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  badgeGoldActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
  },
  badgeGoldText: {
    color: '#fde68a',
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsBox: {
    gap: 12,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#aaaab6',
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
  },
  value: {
    color: '#ededf9',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 16,
  },
  totalLabel: {
    color: '#60a5fa',
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#60a5fa',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 22,
    fontWeight: '900',
  },
  earnBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  earnLabel: {
    color: '#93c5fd',
    fontFamily: 'Manrope-Bold',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  earnValue: {
    color: '#60a5fa',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 8,
  },
  earnSub: {
    color: '#bfdbfe',
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
  },
  earnBoxGold: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  earnLabelGold: {
    color: '#fde68a',
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  earnGoldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
    borderRadius: 12,
  },
  earnGoldRowLabel: {
    color: '#fef3c7',
    fontFamily: 'Manrope-Bold',
    fontSize: 13,
  },
  earnGoldRowValue: {
    color: '#fbbf24',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    fontWeight: '900',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#0c0e16',
  },
  btnSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#8eff71',
    paddingVertical: 20,
    borderRadius: 9999,
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  btnSubmitText: {
    color: '#0d6100',
    fontFamily: 'SpaceGrotesk-Black',
    fontSize: 16,
    fontWeight: '900',
  },
});
