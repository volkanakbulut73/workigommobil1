import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Bell, MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotificationStore } from '../store/useNotificationStore';

interface HeaderProps {
  showActions?: boolean;
  logoMode?: 'full' | 'compact' | 'none';
}

export function Header({ showActions = true, logoMode = 'full' }: HeaderProps) {
  const navigation = useNavigation<any>();
  const { unreadCount, unreadMessageCount, setUnreadCount, setUnreadMessageCount } = useNotificationStore();

  // Admin system notifications + DM messages combined on message icon
  const totalInboxCount = unreadMessageCount + unreadCount;

  const handleMessagesPress = () => {
    // Immediately clear badge before navigating
    setUnreadCount(0);
    setUnreadMessageCount(0);
    navigation.navigate('MessagesList');
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        {logoMode === 'full' && <Text style={styles.logo}>Workigom</Text>}
        {logoMode === 'compact' && (
          <View style={styles.compactLogo}>
            <Text style={styles.compactLogoText}>W</Text>
          </View>
        )}
        
        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={handleMessagesPress}
            >
              <MessageCircle color="#8eff71" size={24} />
              {totalInboxCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalInboxCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Bell color="#8eff71" size={24} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0c0e16',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(12, 14, 22, 0.85)',
    zIndex: 100,
  },
  logo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#8eff71',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  compactLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 255, 113, 0.3)',
  },
  compactLogoText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#8eff71',
    marginTop: -1, // Visual adjustment
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#8eff71',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  badgeText: {
    color: '#0c0e16',
    fontSize: 9,
    fontWeight: '900',
  },
});
