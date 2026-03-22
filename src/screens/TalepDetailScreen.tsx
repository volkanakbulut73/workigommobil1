import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { DBService } from '../services/dbService';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { ChevronLeft, CheckCircle } from 'lucide-react-native';

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
      // In a real app we would have a getTransactionById method
      // For now we assume DBService or supabase can fetch it
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
      // Assuming DBService has acceptTransaction or similar
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'waiting-cash-payment',
          supporter_id: profile.id,
          support_percentage: sharePercentage
        })
        .eq('id', transaction.id);

      if (error) throw error;
      
      // Navigate to tracker
      navigation.replace('Tracker', { id: transaction.id });
    } catch (err: any) {
      Alert.alert('Hata', 'Talep kabul edilirken bir hata oluştu');
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#00ff88" size="large" />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Talep bulunamadı.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#00ff88' }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const amount = Number(transaction.amount);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PAYLAŞIM SEÇİMİ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{transaction.profiles?.full_name || 'Kullanıcı'} için paylaşım oranını seçin</Text>

        {/* Option 15% */}
        <TouchableOpacity 
          style={[styles.optionCard, sharePercentage === 15 && styles.optionActive]} 
          onPress={() => setSharePercentage(15)}
        >
          <View style={styles.optionHeader}>
            <Text style={styles.optionTitle}>%15 Paylaşım</Text>
            {sharePercentage === 15 && <CheckCircle color="#00ff88" size={20} />}
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tutarın:</Text>
            <Text style={styles.value}>{amount} ₺</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Senin katkın (%10):</Text>
            <Text style={styles.value}>{Math.round(amount * 0.10)} ₺</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Toplam Maliyetin:</Text>
            <Text style={styles.totalValue}>{Math.round(amount * 0.15)} ₺</Text>
          </View>
        </TouchableOpacity>

        {/* Option 100% */}
        <TouchableOpacity 
          style={[styles.optionCard, styles.optionGold, sharePercentage === 100 && styles.optionGoldActive]} 
          onPress={() => setSharePercentage(100)}
        >
          <View style={styles.optionHeader}>
            <Text style={[styles.optionTitle, { color: '#FFD700' }]}>%100 Buda Benden 💜</Text>
            {sharePercentage === 100 && <CheckCircle color="#FFD700" size={20} />}
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Senin katkın:</Text>
            <Text style={styles.value}>{amount} ₺</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Toplam Maliyetin:</Text>
            <Text style={[styles.totalValue, { color: '#FFD700' }]}>{amount} ₺</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btnSubmit, accepting && { opacity: 0.7 }]} 
          onPress={handleAccept}
          disabled={accepting}
        >
          <Text style={styles.btnSubmitText}> {accepting ? 'İşleniyor...' : 'Kabul Et ve Başla'} </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b1e',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
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
    backgroundColor: 'rgba(10, 11, 30, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 40,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionCard: {
    backgroundColor: '#11142A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionActive: {
    borderColor: '#00ff88',
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
  },
  optionGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  optionGoldActive: {
    borderColor: '#FFD700',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#888',
    fontSize: 14,
  },
  value: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 12,
  },
  totalLabel: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#00ff88',
    fontSize: 20,
    fontWeight: '900',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#0a0b1e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  btnSubmit: {
    backgroundColor: '#00ff88',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnSubmitText: {
    color: '#0a0b1e',
    fontSize: 16,
    fontWeight: '900',
  },
});
