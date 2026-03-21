import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AppState, AppStateStatus } from 'react-native';
import { RealtimeService } from '../services/realtimeService';

export function useRealtime(
  subscribeFn: () => RealtimeChannel | undefined,
  dependencies: any[] = []
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // 1. Subscribe
    const channel = subscribeFn();
    if (channel) {
      channelRef.current = channel;
    }

    // 2. AppState Handling (Foreground/Background)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Re-subscribe if needed or sync data
        if (!channelRef.current) {
          channelRef.current = subscribeFn() || null;
        }
      } else {
        // App is backgrounded - optionally pause or keep alive
        // For heavy channels (Muhabbet), we might want to unsubscribe
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // 3. Cleanup on unmount
    return () => {
      if (channelRef.current) {
        RealtimeService.unsubscribe(channelRef.current);
        channelRef.current = null;
      }
      subscription.remove();
    };
  }, dependencies);

  return channelRef.current;
}
