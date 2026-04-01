import * as Sentry from '@sentry/react-native';

declare const __DEV__: boolean;

const IS_PROD = !__DEV__;

// PostHog disabled as per user request
export let posthog: any = null;


class AnalyticsServiceImpl {
  public init() {
    // Analytics initialization (PostHog disabled)
    console.log('[Analytics] Service started (PostHog disabled)');
  }


  public identifyUser(userId: string, properties?: Record<string, any>) {
    try {
      if (!IS_PROD) {
        console.log(`[Analytics] IDENTIFY USER: ${userId}`, properties);
        return;
      }

      if (posthog) {
        posthog.identify(userId, properties);
      }
      Sentry.setUser({ id: userId, ...properties });
    } catch (error) {
      console.error('[Analytics] Failed to identify user:', error);
    }
  }

  public trackEvent(eventName: string, properties?: Record<string, any>) {
    try {
      if (!IS_PROD) {
        console.log(`[Analytics] TRACK EVENT: ${eventName}`, properties || {});
        return;
      }

      if (posthog) {
        posthog.capture(eventName, properties);
      }
    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
    }
  }

  public captureException(error: any, context?: Record<string, any>) {
    try {
      if (!IS_PROD) {
        console.log(`[Analytics] CAPTURE EXCEPTION:`, error, context);
        return;
      }

      if (context) {
        Sentry.withScope((scope: any) => {
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
          Sentry.captureException(error);
        });
      } else {
        Sentry.captureException(error);
      }
    } catch (err) {
      console.error('[Analytics] Failed to capture exception:', err);
    }
  }

  public resetUser() {
    try {
      if (!IS_PROD) {
        console.log('[Analytics] RESET USER');
        return;
      }

      if (posthog) {
        posthog.reset();
      }
      Sentry.setUser(null);
    } catch (error) {
      console.error('[Analytics] Failed to reset user:', error);
    }
  }
}

export const AnalyticsService = new AnalyticsServiceImpl();
