import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { MainStack } from './MainStack';
import AuthScreen from '../screens/AuthScreen';
import { View, ActivityIndicator } from 'react-native';
import { linking } from './linking';

export function RootNavigator() {
  const { session, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#00FF00" />
      </View>
    );
  }

  return (
    <NavigationContainer 
      linking={linking}
      theme={{ dark: true, colors: { background: '#000', card: '#111', text: '#fff', border: '#333', primary: '#00FF00', notification: '#00FF00' } }}
    >
      {session ? <MainStack /> : <AuthScreen />}
    </NavigationContainer>
  );
}
