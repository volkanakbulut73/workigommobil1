import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { AnalyticsService } from '../services/analyticsService';
import { generateListingId } from '../services/dbService';
import { ChevronLeft, Camera, Wallet, Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export function MarketCreateScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // We'll store basic ImagePicker results here
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Uyarı', 'En fazla 5 fotoğraf ekleyebilirsiniz.');
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true, // we need base64 for easy supabase upload in RN
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages(prev => [...prev, result.assets[0]]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Hata', 'Lütfen başlık ve geçerli bir tutar girin.');
      return;
    }

    setLoading(true);
    let mainPhotoUrl: string | null = null;
    let uploadedUrls: string[] = [];

    try {
      // 1. Upload Images
      for (const asset of images) {
        if (!asset.base64) continue;
        const fileExt = asset.uri.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `swap/${fileName}`;

        const { data, error } = await supabase.storage
          .from('images') // The bucket used in web
          .upload(filePath, decode(asset.base64), {
            contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
          });

        if (error) throw error;
        
        const { data: publicData } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);
          
        uploadedUrls.push(publicData.publicUrl);
      }
      
      if (uploadedUrls.length > 0) {
        mainPhotoUrl = uploadedUrls.join(',');
      }

      // 2. Insert Listing
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const { error: insertError } = await supabase
        .from('swap_listings')
        .insert([
          {
            owner_id: profile?.id,
            title: title.trim(),
            description: description.trim(),
            required_balance: Number(amount),
            photo_url: mainPhotoUrl,
            status: 'pending',
            listing_id: generateListingId('WRK'),
            expiry_date: expiryDate.toISOString()
          }
        ]);

      if (insertError) throw insertError;
      
      AnalyticsService.trackEvent('listing_created', { title: title.trim(), amount: Number(amount) });
      
      Alert.alert('Başarılı', 'İlanınız başarıyla eklendi.', [
        { text: 'Tamam', onPress: () => navigation.navigate('MainTabs', { screen: 'Market' }) }
      ]);
    } catch (err: any) {
      console.error('Create error:', err);
      Alert.alert('Hata', 'İlan yüklenirken bir hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İLAN OLUŞTUR</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FOTOĞRAFLAR ({images.length}/5)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScroll}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.imageBox}>
                <Image source={{ uri: img.uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                  <X color="#fff" size={12} />
                </TouchableOpacity>
                {idx === 0 && (
                  <View style={styles.badgePrimary}>
                    <Text style={styles.badgePrimaryText}>VİTRİN</Text>
                  </View>
                )}
              </View>
            ))}
            
            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                <Camera color="#aaa" size={24} />
                <Text style={styles.addImageText}>Fotoğraflar</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Form Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>İLAN BAŞLIĞI</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Örn: Sony Kulaklık"
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>İSTENEN BAKİYE (TL)</Text>
          <View style={styles.inputWrapper}>
            <Wallet color="#39ff14" size={20} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { paddingLeft: 48 }]}
              placeholder="0"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>AÇIKLAMA</Text>
          <View style={[styles.inputWrapper, { height: 120, alignItems: 'flex-start' }]}>
            <TextInput
              style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
              placeholder="Ürünün durumu hakkında bilgi ver..."
              placeholderTextColor="#666"
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.btnSubmit, loading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.btnSubmitText}>
            {loading ? 'Yayınlanıyor...' : 'İlanı Yayınla'}
          </Text>
        </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: { width: 40 },
  headerTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  content: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#888', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  imageScroll: { gap: 12 },
  imageBox: {
    width: 80, height: 80, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', position: 'relative'
  },
  previewImage: { width: '100%', height: '100%', objectFit: 'cover' },
  removeImageBtn: {
    position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', 
    width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  badgePrimary: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#39ff14', paddingVertical: 2, alignItems: 'center'
  },
  badgePrimaryText: { color: '#0a0b1e', fontSize: 8, fontWeight: 'bold' },
  addImageBtn: {
    width: 80, height: 80, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#11142A'
  },
  addImageText: { color: '#aaa', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#888', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#11142A',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', position: 'relative'
  },
  inputIcon: { position: 'absolute', left: 16, zIndex: 1, opacity: 0.7 },
  input: { flex: 1, paddingVertical: 16, paddingHorizontal: 16, color: '#fff', fontSize: 14, fontWeight: 'bold' },
  btnSubmit: {
    backgroundColor: '#39ff14', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 12,
    shadowColor: '#39ff14', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  btnSubmitText: { color: '#0a0b1e', fontSize: 16, fontWeight: '900' },
});
