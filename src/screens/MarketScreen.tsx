import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Layout } from '../components/Layout';
import { Plus, Search, MapPin, SlidersHorizontal, Star } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useMarketStore } from '../store/useMarketStore';

const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

const ListingCard = React.memo(({ item, onPress }: { item: any, onPress: (id: string) => void }) => {
  const photoUrls = item.photo_url ? item.photo_url.split(',') : [];
  const mainPhoto = photoUrls.length > 0 ? photoUrls[0] : null;
  const sellerInfo = item.profiles || {};
  const sellerName = sellerInfo.full_name || 'Anonim';
  const sellerAvatar = sellerInfo.avatar_url || `https://ui-avatars.com/api/?name=${sellerName.replace(' ', '+')}&background=random&color=fff&rounded=true`;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(item.id)}
    >
      {/* Top Image Section */}
      <View style={styles.imageContainer}>
        {mainPhoto ? (
          <ExpoImage 
            source={{ uri: mainPhoto }} 
            style={styles.image} 
            placeholder={blurhash}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>{item.title[0] || '?'}</Text>
          </View>
        )}

        {/* Rating */}
        <View style={styles.ratingBadge}>
          <Star color="#FFD700" size={10} fill="#FFD700" />
          <Text style={styles.ratingText}>{sellerInfo.rating || '5.0'}</Text>
        </View>
        
        <View style={styles.listingBadge}>
          <Text style={styles.listingBadgeText}>İLAN</Text>
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.sellerRow}>
            <ExpoImage 
              source={{ uri: sellerAvatar }} 
              style={styles.sellerAvatar} 
              placeholder={blurhash}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            <View>
              <Text style={styles.sellerLabel}>Satıcı</Text>
              <Text style={styles.sellerName} numberOfLines={1}>{sellerName}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Fiyat</Text>
            <Text style={styles.priceText}>₺{Number(item.required_balance).toLocaleString('tr-TR')}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export function MarketScreen() {
  const navigation = useNavigation<any>();
  const profile = useAuthStore(state => state.profile);
  
  const listings = useMarketStore(state => state.listings);
  const myListings = useMarketStore(state => state.myListings);
  const loading = useMarketStore(state => state.loading);
  const fetchListings = useMarketStore(state => state.fetchListings);

  const [activeTab, setActiveTab] = useState<'Pazar' | 'İlanlarım'>('Pazar');
  const [activeFilter, setActiveFilter] = useState('Tüm İlanlar');

  useEffect(() => {
    if (profile?.id) {
      fetchListings(profile.id);
    }
  }, [profile?.id]);

  const onRefresh = useCallback(() => {
    if (profile?.id) {
      fetchListings(profile.id);
    }
  }, [profile?.id, fetchListings]);

  const currentData = activeTab === 'Pazar' ? listings : myListings;
  const filteredData = activeFilter === 'Tüm İlanlar' ? currentData : currentData;

  const filters = ['Tüm İlanlar', 'Yemek Kartları', 'Hediye Kartları', 'Kuponlar'];

  const handlePress = useCallback((id: string) => {
    navigation.navigate('MarketDetail', { id });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <ListingCard item={item} onPress={handlePress} />
  ), [handlePress]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  // Use a string key to force the FlatList to unmount and mount when tab changes
  // to avoid key conflicts and layout issues for `numColumns={2}`
  const listKey = activeTab + activeFilter;

  return (
    <Layout>
      <View style={styles.container}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Search color="#666" size={20} style={styles.searchIcon} />
          <Text style={styles.searchInput}>Ürün, marka veya kategori ara...</Text>
        </View>

        {/* Tabs & Filters */}
        <View style={styles.controlsBox}>
          <View style={styles.tabsContainer}>
             <TouchableOpacity 
              style={[styles.tab, activeTab === 'Pazar' && styles.activeTab]}
              onPress={() => setActiveTab('Pazar')}
            >
              <Text style={[styles.tabText, activeTab === 'Pazar' && styles.activeTabText]}>Pazar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'İlanlarım' && styles.activeTab]}
              onPress={() => setActiveTab('İlanlarım')}
            >
              <Text style={[styles.tabText, activeTab === 'İlanlarım' && styles.activeTabText]}>İlanlarım</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterBtn}>
              <SlidersHorizontal color="#39ff14" size={16} />
              <Text style={styles.filterBtnText}>Filtrele</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.locationBtn}>
              <MapPin color="#00e5ff" size={16} />
              <Text style={styles.locationText}>Konum</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pill Filters */}
        <View style={{ marginBottom: 12 }}>
          <FlatList 
            data={filters}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContainer}
            keyExtractor={(i) => i}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pill, activeFilter === item && styles.pillActive]}
                onPress={() => setActiveFilter(item)}
              >
                <Text style={[styles.pillText, activeFilter === item && styles.pillTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Listings */}
        {loading && filteredData.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color="#39ff14" size="large" />
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#39ff14" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Burada henüz hiç ilan yok.</Text>
              </View>
            }
          />
        )}

        {/* FAB */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('MarketCreate')}
        >
          <Plus color="#0a0b1e" size={28} />
        </TouchableOpacity>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    margin: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16172d',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { color: '#666', fontSize: 14 },
  controlsBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#16172d',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#0a0b1e',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#fff' },
  tabText: { color: '#888', fontWeight: 'bold', fontSize: 13 },
  activeTabText: { color: '#0a0b1e' },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(57, 255, 20, 0.05)', borderWidth: 1, borderColor: 'rgba(57, 255, 20, 0.3)',
    borderRadius: 12, paddingVertical: 10,
  },
  filterBtnText: { color: '#39ff14', fontWeight: 'bold', fontSize: 13 },
  locationBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#0a0b1e', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, paddingVertical: 10,
  },
  locationText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  pillsContainer: { paddingHorizontal: 16, gap: 8 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  pillActive: { backgroundColor: '#00e5ff', borderColor: '#00e5ff' },
  pillText: { color: '#00e5ff', fontSize: 12, fontWeight: 'bold' },
  pillTextActive: { color: '#0a0b1e' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: '#666', fontWeight: 'bold' },
  listContent: { paddingHorizontal: 12, paddingBottom: 100 },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 12 },
  card: {
    width: '48%', backgroundColor: '#16172d', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden',
  },
  imageContainer: {
    height: 120, width: '100%', backgroundColor: '#1C2541', position: 'relative',
  },
  image: { width: '100%', height: '100%', overflow: 'hidden' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 32, fontWeight: '900', color: 'rgba(255,255,255,0.1)' },
  ratingBadge: {
    position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  ratingText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  listingBadge: {
    position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  listingBadgeText: { color: '#00e5ff', fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
  cardContent: { padding: 12, flex: 1 },
  cardTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  cardDesc: { color: '#888', fontSize: 10, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sellerAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sellerLabel: { color: '#666', fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  sellerName: { color: '#fff', fontSize: 10, fontWeight: 'bold', maxWidth: 60 },
  priceContainer: { alignItems: 'flex-end' },
  priceLabel: { color: '#666', fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  priceText: { color: '#00e5ff', fontSize: 14, fontWeight: '900' },
  fab: {
    position: 'absolute', bottom: 20, right: 20, width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#39ff14', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#39ff14', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    borderWidth: 1, borderColor: 'rgba(57, 255, 20, 0.5)', zIndex: 10,
  },
});
