import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Bell, MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotificationStore } from '../store/useNotificationStore';

export function Header() {
  const navigation = useNavigation<any>();
  const { unreadCount, unreadMessageCount } = useNotificationStore();

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.logo}>Workigom</Text>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('MessagesList')}
          >
            <MessageCircle color="#fff" size={24} />
            {unreadMessageCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadMessageCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell color="#fff" size={24} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#00FF00',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 10,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
