import * as Sentry from '@sentry/react-native';
import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AnalyticsService } from './src/services/analyticsService';
import { supabase } from './src/lib/supabase';
import Toast from 'react-native-toast-message';
import NetInfo from '@react-native-community/netinfo';
import * as SplashScreen from 'expo-splash-screen';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    enableAutoPerformanceTracing: true,
    enableNativeFramesTracking: true,
    tracesSampleRate: 1.0,
  });
}

// Initialize Analytics globally
AnalyticsService.init();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

const FallbackComponent = (props: { error: unknown; resetError: () => void }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Oops! Bir şeyler ters gitti.</Text>
    <Text style={styles.errorText}>Lütfen uygulamayı yeniden başlatın veya tekrar deneyin.</Text>
    <Text onPress={props.resetError} style={styles.resetButton}>Yeniden Dene</Text>
  </View>
);

function App() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    // Hide splash screen unconditionally to prevent locking
    SplashScreen.hideAsync().catch(() => {});

    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setIsConnected(state.isConnected);
    });

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, []);

  return (
    <Sentry.ErrorBoundary fallback={FallbackComponent}>
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>İnternet bağlantısı yok</Text>
        </View>
      )}
      <RootNavigator />
      <Toast />
    </Sentry.ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0b1e', padding: 20 },
  errorTitle: { color: '#ff3333', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  errorText: { color: '#fff', textAlign: 'center', marginBottom: 20 },
  resetButton: { color: '#00e5ff', padding: 10, borderWidth: 1, borderColor: '#00e5ff', borderRadius: 8, fontWeight: 'bold' },
  offlineBanner: { backgroundColor: '#ff3333', padding: 10, alignItems: 'center', paddingTop: 40, zIndex: 100 },
  offlineText: { color: '#fff', fontWeight: 'bold' }
});

export default Sentry.wrap(App);
