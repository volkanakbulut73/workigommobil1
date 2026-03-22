import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { MainStack } from './MainStack';
import AuthScreen from '../screens/AuthScreen';
import { View, ActivityIndicator } from 'react-native';
import { linking } from './linking';

export function RootNavigator() {
  const { session, loading, initialize } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const init = async () => {
      // Fail-safe timeout
      timeoutId = setTimeout(() => {
        setIsReady(true);
      }, 5000);

      await initialize();
      setIsReady(true);
      clearTimeout(timeoutId);
    };

    init();

    return () => clearTimeout(timeoutId);
  }, []);

  if (loading && !isReady) {
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
