import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Alert, StatusBar as RNStatusBar, Dimensions
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useMessageStore } from '../store/useMessageStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { supabase } from '../lib/supabase';
import {
  ChevronLeft, Search, MessageCircle,
  Filter, Bell, ShieldCheck, AlertTriangle, Trash2
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SystemNotification {
  id: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  created_at: string;
}

export function MessagesListScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();

  const threads = useMessageStore((state: any) => state.threads);
  const loading = useMessageStore((state: any) => state.loading);
  const fetchThreads = useMessageStore((state: any) => state.fetchThreads);
  const deleteThread = useMessageStore((state: any) => state.deleteThread);
  const unreadThreadIds = useNotificationStore((state: any) => state.unreadThreadIds);
  const fetchCounts = useNotificationStore((state: any) => state.fetchCounts);
  const [refreshing, setRefreshing] = useState(false);

  // Admin system notifications
  const [systemNotifs, setSystemNotifs] = useState<SystemNotification[]>([]);

  const fetchSystemNotifications = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, content, type, read, created_at')
        .eq('user_id', profile.id)
        .in('type', ['system', 'transaction'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setSystemNotifs(data);

        // Mark unread ones as read
        const unreadIds = data.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length > 0) {
          await supabase
            .from('notifications')
            .update({ read: true })
            .in('id', unreadIds);
          // Refresh badge count
          fetchCounts(profile.id);
        }
      }
    } catch (err) {
      console.error('System notifs fetch error:', err);
    }
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      if (profile?.id) {
        fetchThreads(profile.id);
        fetchSystemNotifications();
      }
    }, [profile?.id])
  );

  const onRefresh = async () => {
    if (profile?.id) {
      setRefreshing(true);
      await Promise.all([
        fetchThreads(profile.id),
        fetchSystemNotifications(),
      ]);
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

  // Delete a system notification
  const deleteSystemNotif = (id: string, title: string) => {
    Alert.alert(
      "Bildirimi Sil",
      `"${title}" bildirimini silmek istediğinize emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            setSystemNotifs(prev => prev.filter(n => n.id !== id));
            try {
              await supabase.from('notifications').delete().eq('id', id);
            } catch (err) {
              console.error('Delete notif error:', err);
              fetchSystemNotifications();
            }
          }
        }
      ]
    );
  };

  const getNotifIcon = (type: string) => {
    if (type === 'transaction') return <AlertTriangle size={18} color="#facc15" />;
    return <ShieldCheck size={18} color="#39ff14" />;
  };

  /* ═══ Combined list data ═══ */
  type ListItem = { _kind: 'system_header' } | { _kind: 'system'; data: SystemNotification } | { _kind: 'threads_header' } | { _kind: 'thread'; data: any };

  const listData: ListItem[] = [];

  // System notifications section
  if (systemNotifs.length > 0) {
    listData.push({ _kind: 'system_header' });
    systemNotifs.forEach(n => listData.push({ _kind: 'system', data: n }));
  }

  // Threads section
  listData.push({ _kind: 'threads_header' });
  threads.forEach((t: any) => listData.push({ _kind: 'thread', data: t }));

  const renderCombinedItem = ({ item }: { item: ListItem }) => {
    if (item._kind === 'system_header') {
      return (
        <View style={styles.sectionHeader}>
          <Bell size={12} color="#39ff14" />
          <Text style={styles.sectionHeaderText}>SİSTEM MESAJLARI</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{systemNotifs.filter(n => !n.read).length > 0 ? 'YENİ' : `${systemNotifs.length}`}</Text>
          </View>
        </View>
      );
    }

    if (item._kind === 'system') {
      const n = item.data;
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => deleteSystemNotif(n.id, n.title)}
          style={[styles.systemCard, !n.read && styles.systemCardUnread]}
        >
          <View style={styles.systemIconBox}>
            {getNotifIcon(n.type)}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.systemTitle} numberOfLines={1}>{n.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.systemTime}>
                  {new Date(n.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                  {' '}
                  {new Date(n.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <TouchableOpacity
                  onPress={() => deleteSystemNotif(n.id, n.title)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ padding: 4, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 6 }}
                >
                  <Trash2 size={12} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.systemContent} numberOfLines={2}>{n.content}</Text>
            <View style={styles.systemTypeBadge}>
              <Text style={[styles.systemTypeText, { color: n.type === 'transaction' ? '#facc15' : '#39ff14' }]}>
                {n.type === 'transaction' ? 'İŞLEM' : 'SİSTEM'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (item._kind === 'threads_header') {
      return (
        <View style={[styles.sectionHeader, { marginTop: systemNotifs.length > 0 ? 16 : 0 }]}>
          <MessageCircle size={12} color="#FF007F" />
          <Text style={[styles.sectionHeaderText, { color: '#FF007F' }]}>SOHBETLER</Text>
        </View>
      );
    }

    // Thread item
    const t = item.data;
    const isBuyer = profile?.id === t.buyer_id;
    const otherUser = isBuyer ? t.seller : t.buyer;
    const otherName = otherUser?.full_name || 'İsimsiz Kullanıcı';
    const otherAvatar = otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${otherName.replace(' ', '+')}&background=1d1f2a&color=FF007F&rounded=true&bold=true`;
    const listingTitle = t.listing?.title;
    const unread = unreadThreadIds.includes(t.id);

    return (
      <TouchableOpacity
        style={styles.threadItem}
        onPress={() => navigation.navigate('Chat', {
          threadId: t.id,
          title: listingTitle || otherName,
          receiverId: otherUser?.id
        })}
        onLongPress={() => handleDeleteThread(t.id, otherName)}
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
              {new Date(t.updated_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
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
              {t.last_message ? t.last_message : (t.messages && t.messages[0]?.content?.includes('[img]') ? '📷 Fotoğraf' : '🎵 Sesli Mesaj')}
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

  const getItemKey = (item: ListItem, index: number) => {
    if (item._kind === 'system_header') return 'sys-header';
    if (item._kind === 'threads_header') return 'threads-header';
    if (item._kind === 'system') return `sys-${item.data.id}`;
    if (item._kind === 'thread') return `thread-${item.data.id}`;
    return `item-${index}`;
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

      {/* Search Bar */}
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
          data={listData}
          keyExtractor={getItemKey}
          renderItem={renderCombinedItem}
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
                onPress={() => navigation.navigate('MainTabs', { screen: 'Muhabbet' })}
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

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  sectionHeaderText: {
    color: '#39ff14',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: 'rgba(57,255,20,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionBadgeText: {
    color: '#39ff14',
    fontSize: 8,
    fontWeight: '900',
  },

  // System notification cards
  systemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  systemCardUnread: {
    backgroundColor: 'rgba(57,255,20,0.03)',
    borderRadius: 8,
    marginVertical: 2,
    paddingHorizontal: 10,
  },
  systemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(57,255,20,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  systemTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  systemContent: {
    color: '#888',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  systemTime: {
    color: '#555',
    fontSize: 10,
    fontWeight: '600',
  },
  systemTypeBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: 'rgba(57,255,20,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  systemTypeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
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
