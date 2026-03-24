import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, ClipboardList, ShoppingCart, MessageSquare, User } from 'lucide-react-native';

// Screens (Placeholders for now)
import HomeScreen from '../screens/HomeScreen';
import { TaleplerScreen } from '../screens/TaleplerScreen';
import { MarketScreen } from '../screens/MarketScreen';
import MuhabbetScreen from '../screens/MuhabbetScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { 
          backgroundColor: '#111', 
          borderTopColor: '#333', 
          height: 60 + insets.bottom, 
          paddingBottom: 10 + insets.bottom,
          paddingTop: 10
        },
        tabBarActiveTintColor: '#FF007F',
        tabBarInactiveTintColor: '#888',
        headerShown: false, // We use a custom global header
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ color }) => <Home color={color} size={24} /> }}
      />
      <Tab.Screen 
        name="Talepler" 
        component={TaleplerScreen} 
        options={{ tabBarIcon: ({ color }) => <ClipboardList color={color} size={24} /> }}
      />
      <Tab.Screen 
        name="Market" 
        component={MarketScreen} 
        options={{ tabBarIcon: ({ color }) => <ShoppingCart color={color} size={24} /> }}
      />
      <Tab.Screen 
        name="Muhabbet" 
        component={MuhabbetScreen} 
        options={{ tabBarIcon: ({ color }) => <MessageSquare color={color} size={24} /> }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarIcon: ({ color }) => <User color={color} size={24} /> }}
      />
    </Tab.Navigator>
  );
}
