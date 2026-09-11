import * as Sentry from "@sentry/react-native";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Constants from "expo-constants";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { colors } from "@/src/theme";
import { api } from "@/src/api";
import { storage } from "@/src/utils/storage";
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

// Guard Sentry — crashes in Expo Go on SDK 57 (v7.11.0 mobileReplayIntegration SIGABRT)
const isExpoGo = Constants.appOwnership === "expo";
if (!isExpoGo) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
  });
}

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

async function registerNotificationCategories() {
  if (!Notifications) return;
  try {
    await Notifications.setNotificationCategoryAsync("ride-request", [
      {
        identifier: "accept",
        buttonTitle: "Accept",
        options: { opensAppToForeground: true },
      },
      {
        identifier: "decline",
        buttonTitle: "Decline",
        options: { isDestructive: true, opensAppToForeground: false },
      },
    ]);
    await Notifications.setNotificationCategoryAsync("ride-update", [
      {
        identifier: "view",
        buttonTitle: "View",
        options: { opensAppToForeground: true },
      },
    ]);
  } catch {}
}

function RootLayout() {
  const [loaded, error] = useIconFonts();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    loadNotificationSound();

    if (Notifications) {
      registerForPushNotifications();
      registerNotificationCategories();

      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification: any) => {
          playNotificationSound();
          if (Haptics) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      );

      // Handle notification response (action button taps)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        async (response: any) => {
          const actionId = response.actionIdentifier;
          const data = response.notification.request.content.data;

          if (actionId === "accept" && data.ride_id) {
            try {
              const ride = await api.acceptRequest(data.ride_id);
              if (ride?.id) {
                await storage.setItem("active_ride_id", ride.id);
                router.push("/ride");
              }
            } catch {}
          } else if (actionId === "decline" && data.ride_id) {
            api.declineRequest(data.ride_id).catch(() => {});
          } else if (data.type === "new_request" || data.ride_id) {
            router.push("/(tabs)");
          }
        },
      );
    }

    return () => {
      if (Notifications) {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
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
            <Stack.Screen name="chat" options={{ animation: "slide_from_right" }} />
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default isExpoGo ? RootLayout : Sentry.wrap(RootLayout);
