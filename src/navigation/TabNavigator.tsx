import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, ClipboardList, ShoppingCart, MessageSquare, User } from 'lucide-react-native';
import { useNotificationStore } from '../store/useNotificationStore';

// Screens (Placeholders for now)
import HomeScreen from '../screens/HomeScreen';
import { TaleplerScreen } from '../screens/TaleplerScreen';
import { MarketScreen } from '../screens/MarketScreen';
import MuhabbetScreen from '../screens/MuhabbetScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const unreadMessageCount = useNotificationStore(state => state.unreadMessageCount);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { 
          backgroundColor: '#0c0e16', 
          borderTopColor: 'rgba(142, 255, 113, 0.05)', 
          height: 65 + insets.bottom, 
          paddingBottom: 10 + insets.bottom,
          paddingTop: 12,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#8eff71',
        tabBarInactiveTintColor: '#aaaab6',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Home color={color} size={focused ? 24 : 22} />
            </View>
          ) 
        }}
      />
      <Tab.Screen 
        name="Talepler" 
        component={TaleplerScreen} 
        options={{ 
          tabBarLabel: 'İşlemler',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <ClipboardList color={color} size={focused ? 24 : 22} />
            </View>
          ) 
        }}
      />
      <Tab.Screen 
        name="Market" 
        component={MarketScreen} 
        options={{ 
          tabBarLabel: 'Market',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <ShoppingCart color={color} size={focused ? 24 : 22} />
            </View>
          ) 
        }}
      />
      <Tab.Screen 
        name="Muhabbet" 
        component={MuhabbetScreen} 
        options={{ 
          tabBarLabel: 'Muhabbet',
          tabBarBadge: undefined,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MessageSquare color={color} size={focused ? 24 : 22} />
            </View>
          ) 
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <User color={color} size={focused ? 24 : 22} />
            </View>
          ) 
        }}
      />
    </Tab.Navigator>
  );
}

const styles = {
  iconContainer: {
    width: 44,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
  },
};
