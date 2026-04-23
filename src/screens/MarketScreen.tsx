import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Modal, Animated, Dimensions, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Layout } from '../components/Layout';
import { Plus, Search, MapPin, SlidersHorizontal, Star, ChevronLeft, X, Info, ChevronDown } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useMarketStore } from '../store/useMarketStore';
import { MARKET_CITIES, getMarketDistricts, MarketCity } from '../data/marketLocations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

const CATEGORIES = ['Tümü', 'Elektronik', 'Gıda', 'Eşya'];
const LOCATIONS = ['Tüm Konumlar', ...MARKET_CITIES];

const ListingCard = React.memo(({ item, onPress }: { item: any, onPress: (id: string) => void }) => {
  const photoUrls = item.photo_url ? item.photo_url.split(',') : [];
  const mainPhoto = photoUrls.length > 0 ? photoUrls[0] : null;
  const sellerInfo = item.profiles || {};
  const sellerName = sellerInfo.full_name || 'Anonim';
  const sellerAvatar = sellerInfo.avatar_url || `https://ui-avatars.com/api/?name=${sellerName.replace(' ', '+')}&background=12142d&color=00e5ff&rounded=true`;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item.id)} activeOpacity={0.7}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {mainPhoto ? (
          <ExpoImage source={{ uri: mainPhoto }} style={styles.image as any} placeholder={blurhash} contentFit="cover" transition={200} cachePolicy="memory-disk" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>{item.title[0] || '?'}</Text>
          </View>
        )}

        {/* Rating */}
        <View style={styles.ratingBadge}>
          <Star color="#facc15" size={10} fill="#facc15" />
          <Text style={styles.ratingText}>{sellerInfo.rating || '5.0'}</Text>
        </View>

        {/* Listing ID */}
        {item.listing_id && (
          <View style={styles.listingBadge}>
            <Text style={styles.listingBadgeText}>{item.listing_id}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardDescription} numberOfLines={1}>{item.description || item.title}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.sellerContainer}>
            <View style={styles.sellerAvatarContainer}>
              <ExpoImage source={{ uri: sellerAvatar }} style={styles.sellerAvatar as any} placeholder={blurhash} contentFit="cover" transition={200} cachePolicy="memory-disk" />
            </View>
            <View style={styles.sellerTextCol}>
              <Text style={styles.sellerLabel}>SATICI</Text>
              <Text style={styles.sellerName} numberOfLines={1}>{sellerName}</Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>FİYAT</Text>
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
  const loading = useMarketStore(state => state.loading);
  const fetchListings = useMarketStore(state => state.fetchListings);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tümü');
  const [selectedLocation, setSelectedLocation] = useState('Tüm Konumlar');
  const [selectedDistrict, setSelectedDistrict] = useState('Tüm İlçeler');
  const [filterVisible, setFilterVisible] = useState(false);
  const [locationVisible, setLocationVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(-100)).current;

  const showToast = useCallback(() => {
    setToastVisible(true);
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 50, useNativeDriver: true, damping: 15 }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start(() => setToastVisible(false));
  }, [toastAnim]);

  useFocusEffect(
    useCallback(() => {
      if (profile?.id) fetchListings(profile.id);
    }, [profile?.id, fetchListings])
  );

  const onRefresh = useCallback(() => {
    if (profile?.id) fetchListings(profile.id);
  }, [profile?.id, fetchListings]);

  // Open/close filter drawer with animation
  const openFilter = () => {
    setFilterVisible(true);
    Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };
  const closeFilter = () => {
    Animated.timing(slideAnim, { toValue: SCREEN_WIDTH, duration: 200, useNativeDriver: true }).start(() => setFilterVisible(false));
  };

  // Filtering logic
  const filteredListings = listings.filter(item => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!item.title?.toLowerCase().includes(q) &&
          !item.description?.toLowerCase().includes(q) &&
          !(item as any).listing_id?.toLowerCase().includes(q)) return false;
    }

    // Category filter
    if (activeFilter !== 'Tümü' && item.category !== activeFilter) return false;

    // Location filter
    if (selectedLocation !== 'Tüm Konumlar' && item.city !== selectedLocation) return false;

    // District filter
    if (selectedDistrict !== 'Tüm İlçeler' && item.district !== selectedDistrict) return false;

    return true;
  });

  const handlePress = useCallback((id: string) => {
    navigation.navigate('MarketDetail', { id });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <ListingCard item={item} onPress={handlePress} />
  ), [handlePress]);

  return (
    <Layout>
      <View style={styles.container}>
        {/* ═══ SYSTEM NOTE ═══ */}
        <View style={styles.systemNote}>
          <Info color="#60a5fa" size={14} />
          <Text style={styles.systemNoteText}>
            Sistem Notu: Bu bölümde sadece yemek kartı bakiyesi ile alışveriş yapılabilir.
          </Text>
        </View>

        {/* ═══ CUSTOM TOAST ═══ */}
        {toastVisible && (
          <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }] }]}>
            <View style={styles.toastContent}>
               <MapPin color="#39ff14" size={14} />
               <Text style={styles.toastText}>Radar Filtresi Uygulandı</Text>
            </View>
          </Animated.View>
        )}

        {/* ═══ SEARCH HEADER ═══ */}
        <View style={styles.searchRow}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="rgba(186,204,176,0.5)" size={16} strokeWidth={1.2} />
          </TouchableOpacity>

          <View style={styles.searchBox}>
            <Search color="rgba(57,255,20,0.4)" size={14} strokeWidth={1.2} />
            <TextInput
              style={styles.searchInput}
              placeholder="İlan ara..."
              placeholderTextColor="rgba(186,204,176,0.25)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X color="rgba(186,204,176,0.3)" size={12} strokeWidth={1.2} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.headerBtn, activeFilter !== 'Tümü' && styles.headerBtnActive]}
            onPress={openFilter}
          >
            <SlidersHorizontal color={activeFilter !== 'Tümü' ? '#39ff14' : 'rgba(186,204,176,0.5)'} size={14} strokeWidth={1.2} />
            {activeFilter !== 'Tümü' && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>

        {/* ═══ RADAR TRIGGER ═══ */}
        <TouchableOpacity style={styles.radarTrigger} onPress={() => setLocationVisible(true)} activeOpacity={0.8}>
          <View style={styles.radarIconBox}>
             <View style={styles.radarPing} />
             <MapPin color="#39ff14" size={14} />
          </View>
          <View style={styles.radarContentContainer}>
            <Text style={styles.radarTitle}>BÖLGE RADARI</Text>
            <Text style={styles.radarSubtitle} numberOfLines={1}>
               {selectedLocation === 'Tüm Konumlar' ? 'Tüm Konumlar' : `${selectedLocation}${selectedDistrict !== 'Tüm İlçeler' ? ` / ${selectedDistrict}` : ''}`}
            </Text>
          </View>
          <ChevronDown color="#39ff14" size={16} style={{ opacity: 0.5 }} />
        </TouchableOpacity>

        {/* ═══ ACTIVE FILTER INDICATORS ═══ */}
        {(activeFilter !== 'Tümü' || selectedLocation !== 'Tüm Konumlar') && (
          <View style={styles.activeFiltersRow}>
            <View style={styles.filterIndicatorBar} />
            {activeFilter !== 'Tümü' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipLabel}>Kategori:</Text>
                <Text style={styles.filterChipValue}>{activeFilter}</Text>
                <TouchableOpacity onPress={() => setActiveFilter('Tümü')}>
                  <X color="rgba(186,204,176,0.3)" size={10} />
                </TouchableOpacity>
              </View>
            )}
            {selectedLocation !== 'Tüm Konumlar' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipLabel}>Konum:</Text>
                <Text style={styles.filterChipValue}>
                  {selectedLocation}
                  {selectedDistrict !== 'Tüm İlçeler' && ` / ${selectedDistrict}`}
                </Text>
                <TouchableOpacity onPress={() => { setSelectedLocation('Tüm Konumlar'); setSelectedDistrict('Tüm İlçeler'); }}>
                  <X color="rgba(186,204,176,0.3)" size={10} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ═══ LISTING COUNT + CREATE ═══ */}
        <View style={styles.countRow}>
          <View style={styles.countLeft}>
            <View style={styles.countBar} />
            <Text style={styles.countLabel}>Aktif İlanlar</Text>
            <Text style={styles.countNumber}>{filteredListings.length}</Text>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('MarketCreate')}>
            <Plus color="#39ff14" size={12} />
            <Text style={styles.createBtnText}>İlan Oluştur</Text>
          </TouchableOpacity>
        </View>

        {/* ═══ LISTINGS GRID ═══ */}
        {loading && filteredListings.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color="#39ff14" size="large" />
            <Text style={styles.loadingText}>Taranıyor...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredListings}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#39ff14" />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Search color="rgba(60,75,53,0.3)" size={24} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Arama sonucu bulunamadı' : 'İlan bulunmuyor'}
                </Text>
              </View>
            }
          />
        )}

        {/* ═══ FILTER DRAWER (Modal) ═══ */}
        <Modal visible={filterVisible} transparent animationType="none" onRequestClose={closeFilter}>
          <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={closeFilter} />
          <Animated.View style={[styles.drawerPanel, { transform: [{ translateX: slideAnim }] }]}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerHeaderLeft}>
                <SlidersHorizontal color="#39ff14" size={12} />
                <Text style={styles.drawerTitle}>FİLTRELER</Text>
              </View>
              <TouchableOpacity onPress={closeFilter}>
                <X color="rgba(186,204,176,0.4)" size={16} />
              </TouchableOpacity>
            </View>

            {/* Categories */}
            <View style={styles.drawerBody}>
              <Text style={styles.drawerSectionTitle}>KATEGORİ</Text>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.drawerItem, activeFilter === cat && styles.drawerItemActive]}
                  onPress={() => { setActiveFilter(cat); closeFilter(); }}
                >
                  <View style={[styles.drawerDot, activeFilter === cat && styles.drawerDotActive]} />
                  <Text style={[styles.drawerItemText, activeFilter === cat && styles.drawerItemTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Clear */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => { setActiveFilter('Tümü'); setSelectedLocation('Tüm Konumlar'); closeFilter(); }}
              >
                <Text style={styles.clearBtnText}>FİLTRELERİ TEMİZLE</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Modal>

        {/* ═══ CYBER BOTTOM SHEET ═══ */}
        <Modal visible={locationVisible} transparent animationType="slide" onRequestClose={() => setLocationVisible(false)}>
          <View style={styles.bottomSheetWrapper}>
            <TouchableOpacity style={styles.bottomSheetBackdrop} activeOpacity={1} onPress={() => setLocationVisible(false)} />
            <View style={styles.bottomSheetContainer}>
              <View style={styles.bottomSheetHandle} />
              <View style={styles.bottomSheetHeader}>
                <MapPin color="#39ff14" size={16} />
                <Text style={styles.bottomSheetTitle}>BÖLGE SEÇİMİ</Text>
              </View>

              <View style={styles.bottomSheetBody}>
                {/* Cities Column */}
                <View style={styles.bsCityCol}>
                  <Text style={styles.bsColTitle}>ŞEHİR</Text>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {LOCATIONS.map(loc => (
                      <TouchableOpacity
                        key={loc}
                        style={[styles.bsItem, selectedLocation === loc && styles.bsItemActive]}
                        onPress={() => { 
                          setSelectedLocation(loc); 
                          setSelectedDistrict('Tüm İlçeler');
                          if (loc === 'Tüm Konumlar') {
                            setLocationVisible(false);
                            showToast();
                          }
                        }}
                      >
                        <Text style={[styles.bsItemText, selectedLocation === loc && styles.bsItemTextActive]}>
                          {loc}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Districts Column */}
                {selectedLocation !== 'Tüm Konumlar' && (
                  <View style={styles.bsDistrictCol}>
                    <Text style={styles.bsColTitle}>İLÇE</Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      <TouchableOpacity
                        style={[styles.bsItem, selectedDistrict === 'Tüm İlçeler' && styles.bsItemActive]}
                        onPress={() => { 
                          setSelectedDistrict('Tüm İlçeler'); 
                          setLocationVisible(false); 
                          showToast();
                        }}
                      >
                        <Text style={[styles.bsItemText, selectedDistrict === 'Tüm İlçeler' && styles.bsItemTextActive]}>
                          Tüm İlçeler
                        </Text>
                      </TouchableOpacity>
                      {getMarketDistricts(selectedLocation as MarketCity).map(dist => (
                        <TouchableOpacity
                          key={dist}
                          style={[styles.bsItem, selectedDistrict === dist && styles.bsItemActive]}
                          onPress={() => { 
                            setSelectedDistrict(dist); 
                            setLocationVisible(false); 
                            showToast();
                          }}
                        >
                          <Text style={[styles.bsItemText, selectedDistrict === dist && styles.bsItemTextActive]}>
                            {dist}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // System Note
  systemNote: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'rgba(96,165,250,0.08)',
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)',
  },
  systemNoteText: { color: '#93bbfc', fontSize: 11, fontWeight: '500', flex: 1, letterSpacing: 0.3 },

  // Header Row
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 16, marginBottom: 10,
  },
  headerBtn: {
    padding: 9, backgroundColor: 'rgba(29,32,35,0.8)',
    borderWidth: 1, borderColor: 'rgba(60,75,53,0.3)',
  },
  headerBtnActive: {
    backgroundColor: 'rgba(57,255,20,0.08)', borderColor: 'rgba(57,255,20,0.3)',
  },
  locationBtn: { flexDirection: 'row', gap: 3, paddingHorizontal: 10 },
  locationText: { color: 'rgba(186,204,176,0.5)', fontSize: 10, fontWeight: '500' },
  filterDot: {
    position: 'absolute', top: -2, right: -2,
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: '#39ff14',
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(29,32,35,0.8)',
    borderWidth: 1, borderColor: 'rgba(60,75,53,0.3)',
    paddingHorizontal: 10, paddingVertical: 2,
  },
  searchInput: { flex: 1, color: '#e1e2e7', fontSize: 12, paddingVertical: 6 },

  // Active Filters
  activeFiltersRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8,
  },
  filterIndicatorBar: { width: 3, height: 12, backgroundColor: '#39ff14' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterChipLabel: { color: 'rgba(186,204,176,0.4)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  filterChipValue: { color: '#39ff14', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },

  // Count Row
  countRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 10,
  },
  countLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countBar: { width: 3, height: 10, backgroundColor: '#39ff14' },
  countLabel: { color: 'rgba(186,204,176,0.4)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5 },
  countNumber: { color: '#39ff14', fontSize: 9, fontWeight: 'bold' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: 'rgba(57,255,20,0.08)',
    borderWidth: 1, borderColor: 'rgba(57,255,20,0.25)',
  },
  createBtnText: { color: '#39ff14', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },

  // Listings
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: 'rgba(186,204,176,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },
  emptyContainer: { paddingVertical: 50, alignItems: 'center', gap: 10 },
  emptyText: { color: 'rgba(186,204,176,0.3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 },
  listContent: { paddingHorizontal: 16, paddingBottom: 110 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },

  // Card
  card: {
    width: '48%', backgroundColor: '#191b2e',
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
  },
  imageContainer: { aspectRatio: 4/3, width: '100%', backgroundColor: '#12142d', position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 28, fontWeight: '900', color: 'rgba(255,255,255,0.1)' },
  ratingBadge: {
    position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  ratingText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  listingBadge: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  listingBadgeText: { color: '#00e5ff', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  cardContent: { padding: 12, flex: 1 },
  cardTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  cardDescription: { color: '#8c91a5', fontSize: 11, marginBottom: 14 },
  
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginTop: 'auto',
  },
  sellerContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, paddingRight: 4 },
  sellerAvatarContainer: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#12142d',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden'
  },
  sellerAvatar: { width: '100%', height: '100%' },
  sellerTextCol: { flexShrink: 1, justifyContent: 'center' },
  sellerLabel: { color: '#8c91a5', fontSize: 8, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
  sellerName: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  priceContainer: { alignItems: 'flex-end' },
  priceLabel: { color: '#8c91a5', fontSize: 8, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
  priceText: { color: '#00e5ff', fontSize: 15, fontWeight: '900' },

  // Filter Drawer
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerPanel: {
    position: 'absolute', top: 0, right: 0, bottom: 0, width: 260,
    backgroundColor: '#111417', borderLeftWidth: 1, borderLeftColor: 'rgba(60,75,53,0.3)',
  },
  drawerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(60,75,53,0.2)',
  },
  drawerHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drawerTitle: { color: '#e1e2e7', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  drawerBody: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  drawerSectionTitle: { color: 'rgba(186,204,176,0.35)', fontSize: 8, letterSpacing: 3, marginBottom: 10, paddingLeft: 8 },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 10,
    borderLeftWidth: 2, borderLeftColor: 'transparent',
  },
  drawerItemActive: { backgroundColor: 'rgba(57,255,20,0.08)', borderLeftColor: '#39ff14' },
  drawerDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(60,75,53,0.3)' },
  drawerDotActive: { backgroundColor: '#39ff14' },
  drawerItemText: { color: 'rgba(186,204,176,0.5)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5 },
  drawerItemTextActive: { color: '#39ff14' },
  drawerFooter: { paddingHorizontal: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: 'rgba(60,75,53,0.2)', paddingTop: 16 },
  clearBtn: {
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(60,75,53,0.2)',
  },
  clearBtnText: { color: 'rgba(186,204,176,0.35)', fontSize: 9, fontWeight: 'bold', letterSpacing: 2 },

  // Custom Toast
  toastContainer: {
    position: 'absolute', top: 50, left: 0, right: 0, zIndex: 999,
    alignItems: 'center',
  },
  toastContent: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(29,32,35,0.95)', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 30, borderWidth: 1, borderColor: 'rgba(57,255,20,0.5)',
    shadowColor: '#39ff14', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  toastText: { color: '#e1e2e7', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

  // Search Header
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 12,
  },
  
  // Radar Trigger
  radarTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 16, padding: 12,
    backgroundColor: 'rgba(29,32,35,0.7)',
    borderWidth: 1, borderColor: 'rgba(57,255,20,0.4)', borderRadius: 12,
  },
  radarIconBox: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(57,255,20,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  radarPing: {
    position: 'absolute', width: '100%', height: '100%', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(57,255,20,0.4)', opacity: 0.5,
  },
  radarContentContainer: { flex: 1 },
  radarTitle: { color: 'rgba(186,204,176,0.5)', fontSize: 9, letterSpacing: 2, marginBottom: 2 },
  radarSubtitle: { color: '#39ff14', fontSize: 13, fontWeight: 'bold' },

  // Cyber Bottom Sheet
  bottomSheetWrapper: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  bottomSheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  bottomSheetContainer: {
    height: '65%', backgroundColor: '#111417',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderTopColor: 'rgba(57,255,20,0.3)',
    borderLeftWidth: 1, borderLeftColor: 'rgba(57,255,20,0.15)',
    borderRightWidth: 1, borderRightColor: 'rgba(57,255,20,0.15)',
    paddingBottom: 20,
  },
  bottomSheetHandle: {
    width: 40, height: 4, backgroundColor: 'rgba(186,204,176,0.3)',
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  bottomSheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(60,75,53,0.2)',
  },
  bottomSheetTitle: { color: '#e1e2e7', fontSize: 11, fontWeight: 'bold', letterSpacing: 3 },
  bottomSheetBody: { flex: 1, flexDirection: 'row' },
  bsCityCol: { flex: 1, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' },
  bsDistrictCol: { flex: 1.2, backgroundColor: 'rgba(255,255,255,0.02)' },
  bsColTitle: {
    color: 'rgba(186,204,176,0.35)', fontSize: 9, letterSpacing: 3,
    padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(60,75,53,0.15)',
  },
  bsItem: { paddingVertical: 14, paddingHorizontal: 16 },
  bsItemActive: { backgroundColor: 'rgba(57,255,20,0.08)' },
  bsItemText: { color: 'rgba(186,204,176,0.5)', fontSize: 13, fontWeight: '500' },
  bsItemTextActive: { color: '#39ff14', fontWeight: 'bold' }
});
