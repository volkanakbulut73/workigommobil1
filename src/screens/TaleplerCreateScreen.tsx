import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DBService } from '../services/dbService';
import { useAuthStore } from '../store/useAuthStore';
import { AnalyticsService } from '../services/analyticsService';
import { ChevronLeft, Wallet, FileText, CheckCircle2 } from 'lucide-react-native';

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
      // Navigate to tracker
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
          <ChevronLeft color="#fff" size={24} />
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
                <Wallet color="#39ff14" size={20} style={styles.inputIcon} />
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
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>
                  Sizin ödeyeceğiniz tutar <Text style={styles.alertTextHighlight}>{Math.round(Number(amount) * 0.90)} TL</Text>'dir.
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>AÇIKLAMA</Text>
              <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start' }]}>
                <FileText color="#39ff14" size={20} style={[styles.inputIcon, { marginTop: 12 }]} />
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

            <TouchableOpacity style={styles.btnPrimary} onPress={handleNext}>
              <Text style={styles.btnPrimaryText}>Devam Et</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.summaryIconBox}>
              <CheckCircle2 color="#39ff14" size={48} />
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
                <Text style={styles.summaryLabel}>Senin Payın (%90)</Text>
                <Text style={styles.summaryHighlight}>{Math.round(Number(amount) * 0.90).toLocaleString('tr-TR')} ₺</Text>
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
    backgroundColor: '#0a0b1e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(10, 11, 30, 0.9)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  backText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#39ff14',
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
    backgroundColor: '#39ff14',
    shadowColor: '#39ff14',
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
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#666',
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    paddingLeft: 48,
    paddingRight: 40,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currency: {
    position: 'absolute',
    right: 20,
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  alertBox: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
  },
  alertText: {
    color: '#ccc',
    fontSize: 13,
  },
  alertTextHighlight: {
    color: '#39ff14',
    fontWeight: 'bold',
  },
  btnPrimary: {
    backgroundColor: '#39ff14',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#39ff14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  btnPrimaryText: {
    color: '#0a0b1e',
    fontSize: 16,
    fontWeight: '900',
  },
  summaryIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryLabel: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },
  summaryHighlight: {
    color: '#39ff14',
    fontSize: 18,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
});
