import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { AnalyticsService } from '../services/analyticsService';
import { ChevronLeft, MapPin, MessageSquare, Trash2, Star } from 'lucide-react-native';
import { MessageService } from '../services/messageService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function MarketDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = route.params || {};
  const { profile } = useAuthStore();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchListing();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('swap_listings')
        .select(`*, profiles(full_name, avatar_url, rating)`)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setListing(data);
      AnalyticsService.trackEvent('listing_viewed', { 
        listingId: id, 
        ownerId: data.owner_id || data.user_id 
      });
    } catch (err) {
      console.error('Fetch detail error', err);
      Alert.alert('Hata', 'İlan yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert('Emin misiniz?', 'İlanı silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { 
        text: 'Evet, Sil', 
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            const { error } = await supabase.from('swap_listings').delete().eq('id', id);
            if (error) throw error;
            navigation.goBack();
          } catch (err) {
            Alert.alert('Hata', 'Silinemedi');
            setDeleting(false);
          }
        }
      }
    ]);
  };

  const handleStartChat = async () => {
    if (!profile || !listing || !id) return;
    setStartingChat(true);

    try {
      const listingOwnerId = listing.owner_id || listing.user_id; // some schemas use owner_id
      
      const thread = await MessageService.findOrCreateThread(id, profile.id, listingOwnerId, 'market');
      
      if (!thread.last_message) {
        await MessageService.sendMessage(
          thread.id,
          profile.id,
          listingOwnerId,
          "Merhaba, ilanınız hala satılık mı detayları öğrenebilir miyim?"
        );
      }
      
      navigation.navigate('Chat', { 
        threadId: thread.id, 
        title: listing.title 
      });
      
    } catch (err) {
      console.error('Chat error', err);
      Alert.alert('Hata', 'Mesaj başlatılamadı.');
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#39ff14" size="large" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>İlan bulunamadı!</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#39ff14' }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = profile?.id === (listing.owner_id || listing.user_id);
  const sellerInfo = listing.profiles || {};
  const sellerName = sellerInfo.full_name || 'Anonim';
  const sellerAvatar = sellerInfo.avatar_url || `https://ui-avatars.com/api/?name=${sellerName.replace(' ', '+')}&background=random&color=fff&rounded=true`;

  const photoUrls = listing.photo_url ? listing.photo_url.split(',') : [];
  const mainPhoto = photoUrls.length > 0 ? photoUrls[activeImageIndex] : null;

  return (
    <View style={styles.container}>
      {/* Header Float */}
      <View style={styles.headerAbsolute}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {/* Banner Area */}
        <View style={styles.bannerContainer}>
          {mainPhoto ? (
             <Image source={{ uri: mainPhoto }} style={styles.bannerImage} />
          ) : (
             <View style={styles.bannerPlaceholder}>
                <Text style={styles.bannerPlaceholderText}>{listing.title[0] || '?'}</Text>
             </View>
          )}

          <View style={styles.ratingBadge}>
             <Star color="#FFD700" size={14} fill="#FFD700" />
             <Text style={styles.ratingText}>{sellerInfo.rating || '5.0'}</Text>
          </View>
        </View>

        {/* Thumbnail gallery */}
        {photoUrls.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll} contentContainerStyle={styles.thumbnailContainer}>
            {photoUrls.map((url: string, index: number) => (
              <TouchableOpacity key={index} onPress={() => setActiveImageIndex(index)}>
                <Image 
                  source={{ uri: url }} 
                  style={[styles.thumbnail, activeImageIndex === index && styles.thumbnailActive]} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.detailsBox}>
           {/* Title & Price */}
           <View style={styles.titleRow}>
             <Text style={styles.title}>{listing.title}</Text>
             <Text style={styles.price}>₺{Number(listing.required_balance).toLocaleString('tr-TR')}</Text>
           </View>

           <View style={styles.locationRow}>
             <MapPin color="#00e5ff" size={16} />
             <Text style={styles.locationText}>{listing.location || 'Türkiye'}</Text>
           </View>

           <View style={styles.divider} />

           <Text style={styles.sectionTitle}>AÇIKLAMA</Text>
           <Text style={styles.description}>{listing.description || 'Bu ilan için açıklama girilmemiş.'}</Text>

           {/* Seller Card */}
           <View style={styles.sellerCard}>
             <View style={styles.sellerInfo}>
               <Image source={{ uri: sellerAvatar }} style={styles.sellerAvatarFull} />
               <View>
                 <Text style={styles.sellerLabel}>SATICI</Text>
                 <Text style={styles.sellerNameFull}>{sellerName}</Text>
               </View>
             </View>
           </View>
        </View>
      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        {isOwner ? (
          <TouchableOpacity 
            style={[styles.btnDanger, deleting && { opacity: 0.7 }]} 
            onPress={handleDelete}
            disabled={deleting}
          >
            <Trash2 color="#ff4444" size={20} />
            <Text style={styles.btnDangerText}>{deleting ? 'Siliniyor...' : 'İlanı Sil'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.btnPrimary, startingChat && { opacity: 0.7 }]} 
            onPress={handleStartChat}
            disabled={startingChat}
          >
            {startingChat ? (
              <ActivityIndicator color="#0a0b1e" size="small" />
            ) : (
              <>
                <MessageSquare color="#0a0b1e" size={20} />
                <Text style={styles.btnPrimaryText}>Mesaj Gönder</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050a19' },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#ff4444', fontSize: 16, fontWeight: 'bold' },
  headerAbsolute: {
    position: 'absolute', top: 50, left: 16, zIndex: 10,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(10, 11, 30, 0.7)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  content: { paddingBottom: 20 },
  bannerContainer: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: '#11142A', position: 'relative' },
  bannerImage: { width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' },
  bannerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#11142A' },
  bannerPlaceholderText: { fontSize: 80, fontWeight: 'black', color: 'rgba(255,255,255,0.05)' },
  ratingBadge: {
    position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4
  },
  ratingText: { color: '#fff', fontWeight: 'bold' },
  thumbnailScroll: { backgroundColor: '#0a0b1e', paddingVertical: 12 },
  thumbnailContainer: { paddingHorizontal: 16, gap: 12 },
  thumbnail: { width: 60, height: 60, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', opacity: 0.5 },
  thumbnailActive: { borderColor: '#39ff14', opacity: 1 },
  detailsBox: { padding: 24 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', flex: 1, marginRight: 16 },
  price: { color: '#39ff14', fontSize: 24, fontWeight: '900' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  locationText: { color: '#00e5ff', fontSize: 14, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  sectionTitle: { color: '#666', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  description: { color: '#ddd', fontSize: 14, lineHeight: 22, marginBottom: 32 },
  sellerCard: {
    backgroundColor: '#11142A', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellerAvatarFull: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#39ff14' },
  sellerLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  sellerNameFull: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: {
    padding: 20, paddingBottom: 40, backgroundColor: '#0a0b1e',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)'
  },
  btnPrimary: {
    backgroundColor: '#39ff14', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    paddingVertical: 18, borderRadius: 16, shadowColor: '#39ff14', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  btnPrimaryText: { color: '#0a0b1e', fontSize: 16, fontWeight: '900' },
  btnDanger: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    paddingVertical: 18, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.3)'
  },
  btnDangerText: { color: '#ff4444', fontSize: 16, fontWeight: '900' },
});
