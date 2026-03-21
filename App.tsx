import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AnalyticsService } from './src/services/analyticsService';
import * as Sentry from '@sentry/react-native';
import Toast from 'react-native-toast-message';
import NetInfo from '@react-native-community/netinfo';

const FallbackComponent = (props: { error: Error; resetError: () => void }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Oops! Bir şeyler ters gitti.</Text>
    <Text style={styles.errorText}>Lütfen uygulamayı yeniden başlatın veya tekrar deneyin.</Text>
    <Text onPress={props.resetError} style={styles.resetButton}>Yeniden Dene</Text>
  </View>
);

function App() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    AnalyticsService.init();

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
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
