import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DBService } from '../services/dbService';
import { useAuthStore } from '../store/useAuthStore';
import { AnalyticsService } from '../services/analyticsService';
import { ChevronLeft, Wallet, FileText, CheckCircle2, Send, Users, Zap, ShieldCheck } from 'lucide-react-native';

export function TaleplerCreateScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();
  
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
    if (!profile) return;
    
    setLoading(true);
    try {
      const tx = await DBService.createTransactionRequest(
        profile.id,
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
    <SafeAreaView style={styles.container}>
      {/* Header - normal flex, NOT absolute */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
          activeOpacity={0.8}
        >
          <ChevronLeft color="#8eff71" size={20} strokeWidth={3} />
          <Text style={styles.backText}>GERİ DÖN</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paylaşım Talebi</Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content} 
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? (
          <View style={styles.stepContainer}>
            
            {/* MENÜ TUTARI */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MENÜ TUTARI (TL)</Text>
              <View style={styles.inputRow}>
                <Wallet color="#8eff71" size={20} style={{ opacity: 0.5 }} />
                <TextInput
                  style={styles.inputLarge}
                  placeholder="0.00"
                  placeholderTextColor="rgba(170, 170, 182, 0.3)"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={styles.currencySymbol}>₺</Text>
              </View>

              {/* Discount Info */}
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
            </View>

            {/* AÇIKLAMA */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>AÇIKLAMA</Text>
              <View style={styles.textAreaRow}>
                <FileText color="#8eff71" size={20} style={{ opacity: 0.5, marginTop: 4 }} />
                <TextInput
                  style={styles.textArea}
                  placeholder="Hadi bu paylaşımı efsane yapalım!"
                  placeholderTextColor="rgba(170, 170, 182, 0.3)"
                  multiline
                  numberOfLines={4}
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
                  <Zap color="#8eff71" size={14} fill="#8eff71" />
                  <Text style={styles.badgeTextPrimary}>HIZLI EŞLEŞME</Text>
                </View>
                <View style={styles.badgeTertiary}>
                  <ShieldCheck color="#88f6ff" size={14} />
                  <Text style={styles.badgeTextTertiary}>GÜVENLİ</Text>
                </View>
              </View>
            </View>

          </View>
        ) : (
          <View style={styles.stepContainer}>
            <View style={styles.summaryIconBox}>
              <CheckCircle2 color="#8eff71" size={64} />
            </View>
            <Text style={styles.summaryStepTitle}>Özet</Text>
            <Text style={styles.summaryStepSubtitle}>Talebinizi onaylamadan önce son kez göz atın.</Text>

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
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA - normal flex, NOT absolute */}
      <View style={styles.bottomFixed}>
        {step === 1 ? (
          <TouchableOpacity 
            style={styles.mainCtaBtn} 
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.mainCtaBtnText}>Devam Et</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.mainCtaBtn, loading && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.mainCtaBtnText}>
              {loading ? 'Oluşturuluyor...' : 'TALEBİ OLUŞTUR'}
            </Text>
            {!loading && <Send color="#0d6100" size={24} />}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 8,
    paddingBottom: 12,
    backgroundColor: '#0c0e16',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 100,
  },
  backText: {
    color: 'rgba(237, 237, 249, 0.7)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerTitle: {
    color: '#8eff71',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  stepContainer: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#aaaab6',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginLeft: 8,
  },
  inputRow: {
    backgroundColor: '#222531',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputLarge: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    color: '#8eff71',
    fontSize: 24,
    fontWeight: '900',
  },
  currencySymbol: {
    color: '#aaaab6',
    fontSize: 22,
    fontWeight: 'bold',
    opacity: 0.5,
  },
  discountBox: {
    backgroundColor: 'rgba(142, 255, 113, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
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
  textAreaRow: {
    backgroundColor: '#222531',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textArea: {
    flex: 1,
    paddingHorizontal: 12,
    color: '#ededf9',
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  infoCard: {
    backgroundColor: '#11131c',
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
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
  badgeTextPrimary: {
    color: '#8eff71',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  badgeTertiary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(136, 246, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  badgeTextTertiary: {
    color: '#88f6ff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  summaryIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  summaryStepTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ededf9',
    textAlign: 'center',
    marginBottom: 8,
  },
  summaryStepSubtitle: {
    fontSize: 14,
    color: '#aaaab6',
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#11131c',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(142, 255, 113, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    fontSize: 20,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 12,
  },
  bottomFixed: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 20 : 32,
    backgroundColor: '#0c0e16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  mainCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#8eff71',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  mainCtaBtnText: {
    color: '#0d6100',
    fontSize: 16,
    fontWeight: '900',
  },
});
