import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DBService } from '../services/dbService';
import { useAuthStore } from '../store/useAuthStore';
import { AnalyticsService } from '../services/analyticsService';
import { ChevronLeft, Wallet, FileText, CheckCircle2, Users, Zap, ShieldCheck } from 'lucide-react-native';

export function TaleplerCreateScreen() {
  const navigation = useNavigation<any>();
  const { profile, user } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (step === 1) {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        Alert.alert('Hata', 'Lütfen geçerli bir tutar girin.');
        return;
      }
      if (!description.trim()) {
        Alert.alert('Hata', 'Lütfen bir açıklama (ilan başlığı) girin.');
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    const userId = profile?.id || user?.id;
    if (!userId) {
      Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
      return;
    }
    
    setLoading(true);
    try {
      const tx = await DBService.createTransactionRequest(
        userId,
        Number(amount),
        description.trim()
      );
      AnalyticsService.trackEvent('talep_created', { amount: Number(amount) });
      navigation.replace('Tracker', { id: tx.id });
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Bir hata oluştu');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#8eff71" size={24} />
          <Text style={styles.backText}>Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TALEP OLUŞTUR</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Wizard Progress */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, step >= 1 && styles.progressActive]} />
          <View style={[styles.progressStep, step >= 2 && styles.progressActive]} />
        </View>

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Paylaşım Detayları</Text>
            <Text style={styles.subtitle}>Birlikte paylaşmak hem ekonomik hem eğlenceli!</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>MENÜ TUTARI (TL)</Text>
              <View style={styles.inputWrapper}>
                <Wallet color="#8eff71" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Örn: 150.00"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={styles.currency}>₺</Text>
              </View>
            </View>

            {Number(amount) > 0 && (
              <View style={styles.discountBox}>
                <Text style={styles.discountText}>
                  %15 düşülerek sizin nakit olarak ödeyeceğiniz tutar{' '}
                  <Text style={styles.discountHighlight}>
                    {Math.round(Number(amount) * 0.85).toLocaleString('tr-TR')} TL
                  </Text>
                </Text>
                <Text style={styles.discountSub}>
                  Eşleşme sonrası ödeme sayfasına yönlendirileceksiniz.
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>AÇIKLAMA</Text>
              <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start' }]}>
                <FileText color="#8eff71" size={20} style={[styles.inputIcon, { marginTop: 12 }]} />
                <TextInput
                  style={[styles.input, { height: '100%', textAlignVertical: 'top', paddingTop: 14 }]}
                  placeholder="Hadi bu paylaşımı efsane yapalım..."
                  placeholderTextColor="#666"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <View style={styles.infoIconBox}>
                  <Users color="#8eff71" size={24} />
                </View>
                <Text style={styles.infoTitle}>Birlikten Kuvvet Doğar</Text>
              </View>
              <Text style={styles.infoDesc}>
                Paylaşım yaparak toplam tutarın yarısını tasarruf edebilir ve yeni insanlarla tanışabilirsin.
              </Text>
              <View style={styles.badgesRow}>
                <View style={styles.badge}>
                  <Zap color="#8eff71" size={14} />
                  <Text style={styles.badgeText}>HIZLI EŞLEŞME</Text>
                </View>
                <View style={[styles.badge, styles.badgeTertiary]}>
                  <ShieldCheck color="#88f6ff" size={14} />
                  <Text style={[styles.badgeText, { color: '#88f6ff' }]}>GÜVENLİ</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleNext}>
              <Text style={styles.btnPrimaryText}>Devam Et</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.summaryIconBox}>
              <CheckCircle2 color="#8eff71" size={48} />
            </View>
            <Text style={styles.title}>Özet</Text>
            <Text style={styles.subtitle}>Talebinizi onaylamadan önce son kez göz atın.</Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Açıklama</Text>
                <Text style={styles.summaryValue}>{description}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Toplam Tutar</Text>
                <Text style={styles.summaryValue}>{Number(amount).toLocaleString('tr-TR')} ₺</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Senin Payın (%85)</Text>
                <Text style={styles.summaryHighlight}>{Math.round(Number(amount) * 0.85).toLocaleString('tr-TR')} ₺</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.btnPrimary, loading && { opacity: 0.7 }]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.btnPrimaryText}>
                {loading ? 'Oluşturuluyor...' : 'Talebi Yayınla'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0e16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#0c0e16',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  backText: {
    color: '#ededf9',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#8eff71',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerRight: {
    width: 60,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: '#8eff71',
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  stepContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ededf9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaaab6',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#aaaab6',
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222531',
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputIcon: {
    marginLeft: 16,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    paddingLeft: 12,
    paddingRight: 40,
    color: '#ededf9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currency: {
    position: 'absolute',
    right: 20,
    color: '#aaaab6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  discountBox: {
    backgroundColor: 'rgba(142, 255, 113, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#8eff71',
  },
  discountText: {
    color: '#aaaab6',
    fontSize: 14,
    lineHeight: 22,
  },
  discountHighlight: {
    color: '#8eff71',
    fontWeight: '900',
    fontSize: 16,
  },
  discountSub: {
    color: '#88f6ff',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: '#11131c',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    color: '#ededf9',
    fontSize: 18,
    fontWeight: '900',
  },
  infoDesc: {
    color: '#aaaab6',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  badgeTertiary: {
    backgroundColor: 'rgba(136, 246, 255, 0.1)',
  },
  badgeText: {
    color: '#8eff71',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  btnPrimary: {
    backgroundColor: '#8eff71',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  btnPrimaryText: {
    color: '#0d6100',
    fontSize: 16,
    fontWeight: '900',
  },
  summaryIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'center',
  },
  summaryCard: {
    backgroundColor: '#11131c',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(142, 255, 113, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryLabel: {
    color: '#aaaab6',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  summaryValue: {
    color: '#ededf9',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },
  summaryHighlight: {
    color: '#8eff71',
    fontSize: 18,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
});
