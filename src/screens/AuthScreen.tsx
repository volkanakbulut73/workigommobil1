import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AnalyticsService } from '../services/analyticsService';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    const { error } = mode === 'signin' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      Alert.alert('Hata', error.message);
    } else {
      AnalyticsService.trackEvent(mode === 'signin' ? 'user_login' : 'user_register');
      if (mode === 'signup') {
        Alert.alert('Başarılı', 'Kayıt başarılı! Lütfen e-postanızı doğrulayın.');
      }
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Workigom</Text>
        <Text style={styles.subtitle}>Mobile-First Platform</Text>

        <Input
          label="E-posta"
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="eposta@örnek.com"
          autoCapitalize={'none'}
          keyboardType="email-address"
        />
        
        <Input
          label="Şifre"
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="••••••••"
          autoCapitalize={'none'}
        />

        <Button 
          title={mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'} 
          onPress={handleAuth}
          loading={loading}
          style={{ marginTop: 10 }}
        />
        
        <TouchableOpacity 
          style={styles.switchMode} 
          onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          <Text style={styles.switchText}>
            {mode === 'signin' ? 'Hesabınız yok mu? Kayıt Olun' : 'Zaten hesabınız var mı? Giriş Yapın'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    padding: 25,
  },
  form: {
    width: '100%',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#00FF00',
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '600',
  },
  switchMode: {
    marginTop: 20,
    padding: 10,
  },
  switchText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
  },
});
