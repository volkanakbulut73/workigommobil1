import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Alert, StatusBar as RNStatusBar, Dimensions
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useMessageStore } from '../store/useMessageStore';
import { useNotificationStore } from '../store/useNotificationStore';
import {
  ChevronLeft, MessageSquare, Search, MessageCircle,
  MoreVertical, X, Filter
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function MessagesListScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();

  const threads = useMessageStore((state: any) => state.threads);
  const loading = useMessageStore((state: any) => state.loading);
  const fetchThreads = useMessageStore((state: any) => state.fetchThreads);
  const deleteThread = useMessageStore((state: any) => state.deleteThread);
  const unreadThreadIds = useNotificationStore((state: any) => state.unreadThreadIds);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (profile?.id) {
        fetchThreads(profile.id);
      }
    }, [profile?.id])
  );

  const onRefresh = async () => {
    if (profile?.id) {
      setRefreshing(true);
      await fetchThreads(profile.id);
      setRefreshing(false);
    }
  };

  const handleDeleteThread = (threadId: string, otherName: string) => {
    Alert.alert(
      "Sohbeti Sil",
      `${otherName} ile olan bu konuşmayı silmek istediğinize emin misiniz? (Bu işlem konuşma geçmişini tamamen siler)`,
      [
        { text: "İptal", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: () => deleteThread(threadId) }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const isBuyer = profile?.id === item.buyer_id;
    const otherUser = isBuyer ? item.seller : item.buyer;
    const otherName = otherUser?.full_name || 'İsimsiz Kullanıcı';
    const otherAvatar = otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${otherName.replace(' ', '+')}&background=1d1f2a&color=FF007F&rounded=true&bold=true`;

    const listingTitle = item.listing?.title;
    const unread = unreadThreadIds.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.threadItem}
        onPress={() => navigation.navigate('Chat', {
          threadId: item.id,
          title: listingTitle || otherName,
          receiverId: otherUser?.id
        })}
        onLongPress={() => handleDeleteThread(item.id, otherName)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: otherAvatar }} style={styles.avatar} />
          {unread && <View style={styles.unreadPulse} />}
        </View>

        <View style={styles.threadDetails}>
          <View style={styles.threadHeader}>
            <Text style={[styles.otherName, unread && styles.otherNameUnread]} numberOfLines={1}>{otherName}</Text>
            <Text style={styles.timeText}>
              {new Date(item.updated_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          {listingTitle && (
            <View style={styles.listingBadge}>
              <Text style={styles.listingLabel}>İLAN</Text>
              <Text style={styles.listingTitle} numberOfLines={1}>{listingTitle}</Text>
            </View>
          )}

          <View style={styles.messageRow}>
            <Text style={[styles.lastMessage, unread && styles.lastMessageUnread]} numberOfLines={1}>
              {item.last_message ? item.last_message : (item.messages && item.messages[0]?.content?.includes('[img]') ? '📷 Fotoğraf' : '🎵 Sesli Mesaj')}
            </Text>
            {unread && (
              <View style={styles.unreadIndicator}>
                <Text style={styles.unreadText}>YENİ</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <RNStatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundIconBtn}>
          <ChevronLeft color="#fff" size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>SOHBETLERİM</Text>
          <Text style={styles.headerSubtitle}>Gelen Kutusu</Text>
        </View>
        <TouchableOpacity style={styles.roundIconBtn}>
          <Filter color="#aaaab6" size={18} />
        </TouchableOpacity>
      </View>

      {/* Search Bar - Glassmorphism */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search color="#FF007F" size={18} style={styles.searchIcon} />
          <Text style={styles.searchInput}>Kişi veya ilan ara...</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color="#FF007F" size="large" />
          <Text style={styles.loadingText}>YÜKLENİYOR...</Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF007F"
              colors={['#FF007F']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <MessageCircle color="rgba(255,0,127,0.1)" size={64} />
              </View>
              <Text style={styles.emptyTitle}>Henüz Sohbet Yok</Text>
              <Text style={styles.emptySubText}>Mesajlaşmaya başlamak için bir ilan üzerinden veya Muhabbet ekranından birini bulun.</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Chat')} // Assumes default path
              >
                <Text style={styles.actionButtonText}>MESAJ GÖNDER</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0e16'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    color: '#FF007F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase'
  },
  headerSubtitle: {
    color: '#aaaab6',
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.6,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2
  },
  roundIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },

  // Search
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 31, 42, 0.7)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: {
    marginRight: 12
  },
  searchInput: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600'
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: '#1d1f2a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  unreadPulse: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF007F',
    borderWidth: 2,
    borderColor: '#0c0e16',
  },
  threadDetails: {
    flex: 1,
    marginLeft: 16,
    gap: 4
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otherName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1
  },
  otherNameUnread: {
    color: '#FF007F'
  },
  timeText: {
    color: '#555',
    fontSize: 11,
    fontWeight: '700'
  },
  listingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  listingLabel: {
    color: '#aaaab6',
    fontSize: 8,
    fontWeight: '900',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 4,
    borderRadius: 2
  },
  listingTitle: {
    color: '#aaaab6',
    fontSize: 11,
    fontWeight: '600',
    maxWidth: SCREEN_WIDTH * 0.4
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2
  },
  lastMessage: {
    color: '#71717a',
    fontSize: 14,
    flex: 1,
    marginRight: 8
  },
  lastMessageUnread: {
    color: '#f4f4f5',
    fontWeight: '600'
  },
  unreadIndicator: {
    backgroundColor: 'rgba(255,0,127,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,0,127,0.2)'
  },
  unreadText: {
    color: '#FF007F',
    fontSize: 8,
    fontWeight: '900'
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40
  },
  emptyIconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,0,127,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,0,127,0.05)'
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12
  },
  emptySubText: {
    color: '#555',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32
  },
  actionButton: {
    backgroundColor: '#FF007F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2
  }
});
