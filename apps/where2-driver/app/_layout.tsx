import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { LogBox, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { colors } from "@/src/theme";
import { api } from "@/src/api";
import { loadNotificationSound, playNotificationSound } from "@/src/utils/notification-sound";

// Guard expo-notifications — removed from Expo Go in SDK 53+
let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
} catch {}

// Guard expo-haptics for Expo Go compatibility
let Haptics: any = null;
try {
  Haptics = require("expo-haptics");
} catch {}

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  enableAutoSessionTracking: true,
});

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function registerForPushNotifications() {
  if (!Notifications) return;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    const token = await Notifications.getExpoPushTokenAsync();
    await api.registerPushToken(token.data);
  } catch {}
}

export default Sentry.wrap(function RootLayout() {
  const [loaded, error] = useIconFonts();
  const notificationListener = useRef<any>(null);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    loadNotificationSound();

    if (Notifications) {
      registerForPushNotifications();

      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification: any) => {
          // Foreground notification — play sound + haptic for new ride requests
          playNotificationSound();
          if (Haptics) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      );
    }

    return () => {
      if (Notifications && notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
    };
  }, []);

  // If the CDN is unreachable we fall through on error rather than wedging
  // the app — icons will tofu, but the app still boots.
  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="ride" options={{ animation: "fade" }} />
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});
