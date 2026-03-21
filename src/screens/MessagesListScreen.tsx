import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { MessageService } from '../services/messageService';
import { ChevronLeft, MessageSquare, Search } from 'lucide-react-native';

export function MessagesListScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();
  
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchThreads = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    try {
      const data = await MessageService.getUserThreads(profile.id);
      setThreads(data || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    // In a real app we might also subscribe to thread updates here via Realtime
  }, [profile?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchThreads();
  };

  const renderItem = ({ item }: { item: any }) => {
    // Determine the "other" user in the thread
    const isBuyer = profile?.id === item.buyer_id;
    const otherUser = isBuyer ? item.seller : item.buyer;
    const otherName = otherUser?.full_name || 'İsimsiz Kullanıcı';
    const otherAvatar = otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${otherName.replace(' ', '+')}&background=random&color=fff&rounded=true`;

    const listingTitle = item.listing?.title;
    
    // Check if there are unread messages for THIS user
    // Since our database has "read" flag on messages, but here we just have last_message updated_at
    // We can do a visual check based on a local state or just show the last message visually
    const unread = false; // Simplified

    return (
      <TouchableOpacity 
        style={styles.threadItem}
        onPress={() => navigation.navigate('Chat', { threadId: item.id, title: listingTitle || otherName })}
      >
        <Image source={{ uri: otherAvatar }} style={styles.avatar} />
        
        <View style={styles.threadDetails}>
          <View style={styles.threadHeader}>
            <Text style={styles.otherName} numberOfLines={1}>{otherName}</Text>
            {/* Simple date format */}
            <Text style={styles.timeText}>
              {new Date(item.updated_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          
          {listingTitle && (
            <Text style={styles.listingTitle} numberOfLines={1}>📍 {listingTitle}</Text>
          )}

          <View style={styles.messageRow}>
            <Text style={[styles.lastMessage, unread && styles.lastMessageUnread]} numberOfLines={1}>
              {item.last_message ? item.last_message : 'Bir fotoğraf gönderdi.'}
            </Text>
            {unread && <View style={styles.unreadBadge} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SOHBETLERİM</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search color="#666" size={20} style={styles.searchIcon} />
        <Text style={styles.searchInput}>Kişi veya ilan ara...</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#00e5ff" size="large" />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00e5ff" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <MessageSquare color="rgba(255,255,255,0.2)" size={48} />
              </View>
              <Text style={styles.emptyText}>Henüz bir mesajlaşmanız bulunmuyor.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050a19' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: { width: 40 },
  headerTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  searchContainer: {
    margin: 16, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0a1529', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { color: '#666', fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  threadItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  threadDetails: { flex: 1, marginLeft: 16 },
  threadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  otherName: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
  timeText: { color: '#666', fontSize: 12 },
  listingTitle: { color: '#00e5ff', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { color: '#888', fontSize: 14, flex: 1, paddingRight: 8 },
  lastMessageUnread: { color: '#fff', fontWeight: 'bold' },
  unreadBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00e5ff' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIconBox: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyText: { color: '#666', fontSize: 14, fontWeight: 'bold' },
});
