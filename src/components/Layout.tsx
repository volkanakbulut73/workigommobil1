import React from 'react';
import { StyleSheet, View, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Header } from './Header';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface LayoutProps {
  children: React.ReactNode;
  withHeader?: boolean;
  headerProps?: {
    showActions?: boolean;
    logoMode?: 'full' | 'compact' | 'none';
  };
}

export function Layout({ children, withHeader = true, headerProps }: LayoutProps) {
  usePushNotifications(); // Initializes push notifications in the background

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0c0e16" />
      {withHeader && <Header {...headerProps} />}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0e16',
  },
  content: {
    flex: 1,
  },
});
