import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground,
  Image,
  TextInput,
  Platform,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { DBService } from '../services/dbService';
import { 
  Settings, 
  Menu,
  MapPin, 
  Utensils, 
  Wallet, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Bell, 
  ChevronRight, 
  LogOut,
  Camera,
  Check
} from 'lucide-react-native';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, user, profile, setProfile } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || user?.user_metadata?.full_name || 'Hasan İKİ');
  const [editLocation, setEditLocation] = useState('İstanbul, Türkiye');
  const [editPhone, setEditPhone] = useState('+90 555 123 4567');
  const [editIban, setEditIban] = useState('TR12 3456 7890 1234 5678 9012 34');
  
  const defaultAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuChz-bwzQPkFQOBWSwQkiQ4e2b-uZHgeZkBbznamhnB_q-QsrmwW54qeagNQ2KNDcyVNNRvwTlvikF7iL6h5J7L4qES0-AW4CVXnDJ9Vq6x8CXA6z2CoV5kP-zA1R2_xt9fHeSrZBTEh3QmB5-G3JnGYL4sHykwEBEyhSePgiTRj8jKL5K7w9mt0TBUAppSH8t1V9ZIWlF8HcDJ-eAr1p9OQoAAhluu0X9z2XS3bbvCPpuzeGNlAZqq5dj92rnmHpJaUp9sZt-NHw';
  const [avatarUri, setAvatarUri] = useState(profile?.avatar_url || defaultAvatar);

  const email = user?.email || 'email@yok.com';

  const pickImage = async () => {
    if (!isEditing) return;

    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('İzin Gerekli', 'Kamera rulonuza erişmek için izin vermeniz gerekiyor!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      // 1. Update auth metadata
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: editName, avatar_url: avatarUri }
      });
      
      if (error) throw error;

      // 2. Persist to profiles database table so chat and other screens read the correct name
      if (profile?.id) {
        await DBService.updateProfile(profile.id, {
          full_name: editName,
          avatar_url: avatarUri
        });
      }
      
      // 3. Update local profile state
      setProfile({
        ...profile,
        full_name: editName,
        avatar_url: avatarUri
      });
      
      setIsEditing(false);
      Alert.alert('Başarılı', 'Profiliniz güncellendi.');
    } catch (err: any) {
      Alert.alert('Hata', err.message);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        
        {/* --- HERO SECTION WITH BACKGROUND --- */}
        <ImageBackground 
          source={require('../../assets/profile-bg.jpg')} 
          style={[styles.heroBackground, { paddingTop: Math.max(insets.top, 20) }]}
          imageStyle={styles.heroBackgroundImage}
        >
          {/* Overlay to darken background slightly for contrast */}
          <View style={styles.overlay} />

          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton}>
              <Menu color="#ededf9" size={24} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>PROFILE</Text>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => isEditing ? handleSave() : setIsEditing(true)}
            >
              {isEditing ? (
                <Check color="#8eff71" size={24} />
              ) : (
                <Settings color="#ededf9" size={24} />
              )}
            </TouchableOpacity>
          </View>

          {/* Profile Circle */}
          <View style={styles.profileCenter}>
            <TouchableOpacity 
              style={styles.avatarWrapper} 
              activeOpacity={isEditing ? 0.7 : 1}
              onPress={pickImage}
            >
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              {isEditing && (
                <View style={styles.avatarEditOverlay}>
                  <Camera color="#fff" size={24} />
                </View>
              )}
            </TouchableOpacity>

            {/* Name & Location */}
            {isEditing ? (
              <TextInput 
                style={styles.nameInput} 
                value={editName}
                onChangeText={setEditName}
                placeholder="İsim giriniz"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            ) : (
              <Text style={styles.nameText}>{editName}</Text>
            )}

            {isEditing ? (
              <TextInput 
                style={styles.locationInput} 
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="Konum giriniz"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            ) : (
              <Text style={styles.locationText}>{editLocation}</Text>
            )}
          </View>
        </ImageBackground>

        {/* --- BOTTOM SECTION (Stats, Financials, Settings) --- */}
        <View style={styles.bottomSection}>
          
          {/* Stats Badge */}
          <View style={styles.statsContainer}>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsNumber}>2500</Text>
              <Text style={styles.pointsLabel}>PUAN</Text>
            </View>
            <View style={styles.eliteBadge}>
              <Text style={styles.eliteText}>ELİT PAYLAŞIMCI</Text>
            </View>
          </View>

          {/* Financial Transactions */}
          <View style={styles.cardsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>İşlem Geçmişi</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>TÜMÜNÜ GÖR</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.transactionsList}>
              <TouchableOpacity style={styles.transactionCard} activeOpacity={0.8}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIconBox, { backgroundColor: '#222531' }]}>
                    <Utensils color="#8eff71" size={20} />
                  </View>
                  <View>
                    <Text style={styles.transactionName}>Sushi Master P2P</Text>
                    <Text style={styles.transactionTime}>Bugün, 14:20</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>+₺24.00</Text>
                  <Text style={styles.transactionStatus}>TAMAMLANDI</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.transactionCard} activeOpacity={0.8}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIconBox, { backgroundColor: '#222531' }]}>
                    <Wallet color="#88f6ff" size={20} />
                  </View>
                  <View>
                    <Text style={styles.transactionName}>Cüzdan Yüklemesi</Text>
                    <Text style={styles.transactionTime}>Dün, 09:15</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>+₺100.00</Text>
                  <Text style={styles.transactionStatus}>BAŞARILI</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact & Settings */}
          <View style={styles.settingsCard}>
            <View style={styles.infoGroup}>
              <View style={styles.infoRow}>
                <Phone color="#aaaab6" size={20} />
                {isEditing ? (
                  <TextInput 
                    style={styles.editTextInput} 
                    value={editPhone} 
                    onChangeText={setEditPhone} 
                  />
                ) : (
                  <Text style={styles.infoText}>{editPhone}</Text>
                )}
              </View>
              <View style={styles.infoRow}>
                <Mail color="#aaaab6" size={20} />
                <Text style={styles.infoText}>{email}</Text>
              </View>
            </View>

            <View style={styles.ibanGroup}>
              <Text style={styles.ibanLabel}>ÖDEME ALINACAK IBAN</Text>
              {isEditing ? (
                <TextInput 
                  style={styles.ibanInputActive} 
                  value={editIban} 
                  onChangeText={setEditIban} 
                />
              ) : (
                <View style={styles.ibanInputBox}>
                  <Text style={styles.ibanValue}>{editIban}</Text>
                </View>
              )}
            </View>

            {/* Navigation List */}
            <View style={styles.navGroup}>
              <TouchableOpacity style={styles.navRow} activeOpacity={0.7}>
                <View style={styles.navLeft}>
                  <ShieldCheck color="#aaaab6" size={20} />
                  <Text style={styles.navText}>Güvenlik ve Gizlilik</Text>
                </View>
                <ChevronRight color="#aaaab6" size={20} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.navRow} activeOpacity={0.7}>
                <View style={styles.navLeft}>
                  <Bell color="#aaaab6" size={20} />
                  <Text style={styles.navText}>Bildirim Ayarları</Text>
                </View>
                <ChevronRight color="#aaaab6" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.7}>
            <LogOut color="#ff7351" size={20} />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
          
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0c0e16',
  },
  heroBackground: {
    width: '100%',
    height: 380,
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
  },
  heroBackgroundImage: {
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 14, 22, 0.4)',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    zIndex: 10,
  },
  iconButton: {
    padding: 8,
  },
  topBarTitle: {
    color: '#ededf9',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 3,
  },
  profileCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    marginTop: 20,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1d1f2a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarEditOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameText: {
    color: '#ededf9',
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 6,
  },
  nameInput: {
    color: '#ededf9',
    fontSize: 26,
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderColor: '#8eff71',
    minWidth: 150,
    textAlign: 'center',
  },
  locationText: {
    color: '#ededf9',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    opacity: 0.8,
  },
  locationInput: {
    color: '#ededf9',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    borderBottomWidth: 1,
    borderColor: '#8eff71',
    minWidth: 120,
    textAlign: 'center',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#0c0e16',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    /* Small overlap upward for a gradient transition illusion */
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 30,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1d1f2a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(70, 71, 81, 0.3)',
  },
  pointsNumber: {
    color: '#8eff71',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pointsLabel: {
    color: '#aaaab6',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: 4,
  },
  eliteBadge: {
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(142, 255, 113, 0.3)',
  },
  eliteText: {
    color: '#8eff71',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  cardsContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ededf9',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#8eff71',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(29, 31, 42, 0.4)',
    padding: 16,
    borderRadius: 20,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  transactionIconBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(34, 37, 49, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionName: {
    color: '#ededf9',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionTime: {
    color: '#aaaab6',
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    color: '#8eff71',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  transactionStatus: {
    color: '#aaaab6',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  settingsCard: {
    backgroundColor: 'rgba(17, 19, 28, 0.5)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(70, 71, 81, 0.2)',
    marginBottom: 24,
  },
  infoGroup: {
    gap: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoText: {
    color: '#ededf9',
    fontSize: 14,
    fontWeight: '500',
  },
  editTextInput: {
    flex: 1,
    color: '#ededf9',
    fontSize: 14,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderColor: '#8eff71',
    paddingVertical: 4,
  },
  ibanGroup: {
    marginBottom: 24,
  },
  ibanLabel: {
    color: '#aaaab6',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  ibanInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#222531',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  ibanValue: {
    color: '#ededf9',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  ibanInputActive: {
    backgroundColor: '#222531',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    color: '#ededf9',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#8eff71',
  },
  navGroup: {
    gap: 8,
    marginTop: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navText: {
    color: '#ededf9',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 115, 81, 0.05)',
    borderRadius: 16,
  },
  logoutText: {
    color: '#ff7351',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
