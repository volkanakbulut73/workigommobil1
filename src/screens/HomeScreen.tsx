import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollState, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useMessageStore } from '../store/useMessageStore';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Plus, ShoppingBag, MessageSquare, Bell, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const { unreadCount, fetchCounts } = useNotificationStore();
  const { threads, fetchThreads } = useMessageStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (profile?.id) {
      fetchCounts(profile.id);
      fetchThreads(profile.id);
    }
  }, [profile?.id]);

  const latestThread = threads[0];

  return (
    <Layout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Merhaba,</Text>
          <Text style={styles.nameText}>{profile?.full_name || 'Kullanıcı'}</Text>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('Talepler')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#1A3F1A' }]}>
              <Plus color="#00FF00" size={24} />
            </View>
            <Text style={styles.actionLabel}>Talep Aç</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('Market')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#1A1A3F' }]}>
              <ShoppingBag color="#5555FF" size={24} />
            </View>
            <Text style={styles.actionLabel}>İlan Ver</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('Muhabbet')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#3F1A1A' }]}>
              <MessageSquare color="#FF5555" size={24} />
            </View>
            <Text style={styles.actionLabel}>Muhabbet</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Notifications Preview */}
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Card style={styles.notifCard}>
              <View style={styles.row}>
                <Bell color="#00FF00" size={20} />
                <Text style={styles.notifText}>{unreadCount} yeni bildiriminiz var</Text>
                <ChevronRight color="#666" size={20} />
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Messages Preview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Son Mesajlar</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MainStack', { screen: 'MessagesList' })}>
            <Text style={styles.seeAll}>Tümü</Text>
          </TouchableOpacity>
        </View>

        {latestThread ? (
          <TouchableOpacity onPress={() => navigation.navigate('MainStack', { screen: 'Chat', params: { id: latestThread.id } })}>
            <Card style={styles.messagePreview}>
              <View style={styles.row}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {(latestThread.seller?.full_name || 'U')[0]}
                  </Text>
                </View>
                <View style={styles.messageContent}>
                  <Text style={styles.messageName}>{latestThread.seller?.full_name || 'Biri'}</Text>
                  <Text style={styles.messageSnippet} numberOfLines={1}>
                    {latestThread.listing?.title || 'İlan hakkında...'}
                  </Text>
                </View>
                <ChevronRight color="#666" size={20} />
              </View>
            </Card>
          </TouchableOpacity>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Henüz mesajınız yok.</Text>
          </Card>
        )}

        {/* Featured Card */}
        <Text style={styles.sectionTitle}>Öne Çıkanlar</Text>
        <Card style={styles.featuredCard}>
          <View style={styles.featuredOverlay}>
            <Text style={styles.featuredTitle}>Workigom Market</Text>
            <Text style={styles.featuredSub}>Topluluğumuzda bugün neler var?</Text>
            <Button 
              title="Göz At" 
              variant="outline" 
              onPress={() => navigation.navigate('Market')}
              style={{ marginTop: 10, alignSelf: 'flex-start' }}
            />
          </View>
        </Card>

        <View style={{ height: 30 }} />
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#888',
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    color: '#00FF00',
    fontSize: 14,
  },
  actionsContainer: {
    paddingRight: 16,
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifCard: {
    backgroundColor: '#0F2F0F',
    borderColor: '#006400',
    marginBottom: 24,
    paddingVertical: 12,
  },
  notifText: {
    color: '#00FF00',
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  messagePreview: {
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  messageSnippet: {
    color: '#888',
    fontSize: 13,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    color: '#666',
  },
  featuredCard: {
    minHeight: 160,
    backgroundColor: '#111',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  featuredOverlay: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  featuredSub: {
    color: '#aaa',
    fontSize: 14,
  },
});
