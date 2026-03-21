import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TabNavigator } from './TabNavigator';
import { TaleplerCreateScreen } from '../screens/TaleplerCreateScreen';
import { MarketCreateScreen } from '../screens/MarketCreateScreen';
import { MarketDetailScreen } from '../screens/MarketDetailScreen';
import { MessagesListScreen } from '../screens/MessagesListScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { TalepDetailScreen } from '../screens/TalepDetailScreen';

const Stack = createStackNavigator();

export function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#000', elevation: 0, shadowOpacity: 0 },
        headerTintColor: '#fff',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="TaleplerCreate" 
        component={TaleplerCreateScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="MarketCreate" 
        component={MarketCreateScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="MarketDetail" 
        component={MarketDetailScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Tracker" 
        component={TrackerScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="MessagesList" 
        component={MessagesListScreen} 
        options={{ title: 'Mesajlar' }} 
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={({ route }: any) => ({ title: route.params?.title ?? 'Sohbet' })} 
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Details" 
        component={TalepDetailScreen} 
        options={{ title: 'Detaylar' }} 
      />
    </Stack.Navigator>
  );
}
