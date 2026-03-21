import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  
  const { profile } = useAuthStore();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      if (token && profile?.id) {
        saveTokenToDatabase(token, profile.id);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Response:', response);
      // Handle deep linking or routing here if necessary
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [profile?.id]); // Re-run if user profile changes

  const saveTokenToDatabase = async (token: string, userId: string) => {
    try {
      // Sadece token değişmişse veya ilk defa ekleniyorsa update et
      if (profile?.expo_push_token === token) return;

      const { error } = await supabase
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('id', userId);

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token successfully saved to Supabase:', token);
      }
    } catch (err) {
      console.log('Exception in saveTokenToDatabase:', err);
    }
  };

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00e5ff',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // projectId requires explicitly passing it or using app.json slug
    try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
    } catch (e: any) {
        console.log('Error getting Expo token. Are you running in simulator?', e.message);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
