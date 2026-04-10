import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';

export const linking: LinkingOptions<any> = {
  prefixes: [Linking.createURL('/')],
  async getInitialURL() {
    // 1. Deep link
    const url = await Linking.getInitialURL();
    if (url != null) return url;
    
    // 2. Push notification
    const response = await Notifications.getLastNotificationResponseAsync();
    const urlFromNotification = response?.notification.request.content.data?.url;
    if (typeof urlFromNotification === 'string') {
      return urlFromNotification;
    }
    return null;
  },
  subscribe(listener: (url: string) => void) {
    let lastHandledUrl: string | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const handleUrl = (url: string) => {
      // Deep Link Guard: prevent duplicate navigation from same push payload
      if (url === lastHandledUrl) return;
      
      lastHandledUrl = url;
      listener(url);
      
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastHandledUrl = null;
      }, 2000); // 2 seconds debounce
    };

    const linkingSubscription = Linking.addEventListener('url', ({ url }: { url: string }) => {
      handleUrl(url);
    });

    const notificationSubscription = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === 'string') {
        handleUrl(url);
      }
    });

    return () => {
      linkingSubscription.remove();
      notificationSubscription.remove();
      if (timeoutId) clearTimeout(timeoutId);
    };
  },
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Talepler: 'talepler',
          Market: 'market',
          Muhabbet: 'muhabbet',
          Profile: 'profile',
        },
      },
      MessagesList: 'messages',
      Chat: 'messages/:threadId',
      Details: 'details/:id',
      Tracker: 'tracker/:id',
      MarketDetail: 'market/:id',
      UserDetail: 'user/:userId',

    },
  },
};
