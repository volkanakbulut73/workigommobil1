import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Bell, BellDot, MessageSquare, ArrowRightLeft } from 'lucide-react-native';

export function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuthStore();
  const { fetchCounts } = useNotificationStore();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setNotifications(data || []);
      
      // Attempt to mark all unread as read since we are viewing them
      const unreadIds = data?.filter(n => !n.read).map(n => n.id) || [];
      if (unreadIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', unreadIds);
          
        // Refresh the global badge count
        fetchCounts(profile.id);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [profile?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = (item: any) => {
    if (item.type === 'new_message' && item.thread_id) {
      navigation.navigate('Chat', { threadId: item.thread_id });
    } else if (item.type === 'transaction_update' && item.transaction_id) {
      navigation.navigate('Tracker', { id: item.transaction_id });
    }
    // other types...
  };

  const getIconForType = (type: string, read: boolean) => {
    const color = read ? '#666' : '#00e5ff';
    if (type === 'new_message') {
      return <MessageSquare color={color} size={24} />;
    } else if (type === 'transaction_update') {
      return <ArrowRightLeft color={color} size={24} />;
    }
    return <Bell color={color} size={24} />;
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.read && styles.notificationItemUnread]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.iconContainer}>
          {getIconForType(item.type, item.read)}
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{item.content}</Text>
          <Text style={styles.time}>
            {new Date(item.created_at).toLocaleDateString('tr-TR')} {new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BİLDİRİMLER</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#39ff14" size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#39ff14" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Bell color="rgba(255,255,255,0.2)" size={48} />
              </View>
              <Text style={styles.emptyText}>Hiç bildiriminiz yok.</Text>
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
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  notificationItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  notificationItemUnread: {
    backgroundColor: 'rgba(0, 229, 255, 0.03)',
    borderRadius: 8,
    marginVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  contentContainer: { flex: 1 },
  title: { color: '#ddd', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  titleUnread: { color: '#fff' },
  message: { color: '#888', fontSize: 13, lineHeight: 18, marginBottom: 6 },
  time: { color: '#555', fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00e5ff', marginLeft: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIconBox: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyText: { color: '#666', fontSize: 14, fontWeight: 'bold' },
});
