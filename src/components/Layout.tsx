import React from 'react';
import { StyleSheet, View, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Header } from './Header';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface LayoutProps {
  children: React.ReactNode;
  withHeader?: boolean;
}

export function Layout({ children, withHeader = true }: LayoutProps) {
  usePushNotifications(); // Initializes push notifications in the background

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {withHeader && <Header />}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
});
