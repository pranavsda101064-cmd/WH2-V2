import * as Sentry from "@sentry/react-native";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { LogBox, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Constants from "expo-constants";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import AppSplash from "@/src/AppSplash";
import { colors } from "@/src/theme";
import { api } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { loadNotificationSound, playNotificationSound } from "@/src/utils/notification-sound";

LogBox.ignoreLogs(["Require cycle:", "Constants.installationId"]);

let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
} catch {}

let Haptics: any = null;
try {
  Haptics = require("expo-haptics");
} catch {}

const isExpoGo = Constants.appOwnership === "expo";
if (!isExpoGo && process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
  });
}

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
    try {
      loadNotificationSound();
    } catch {}

    if (Notifications) {
      registerForPushNotifications();
      registerNotificationCategories();

      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification: any) => {
          try { playNotificationSound(); } catch {}
          if (Haptics) {
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
          }
        },
      );

      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        async (response: any) => {
          try {
            const actionId = response.actionIdentifier;
            const data = response.notification.request.content.data;

            if (actionId === "accept" && data.ride_id) {
              const ride = await api.acceptRequest(data.ride_id);
              if (ride?.id) {
                await storage.setItem("active_ride_id", ride.id);
                router.push("/ride");
              }
            } else if (actionId === "decline" && data.ride_id) {
              api.declineRequest(data.ride_id).catch(() => {});
            } else if (data.type === "new_request" || data.ride_id) {
              router.push("/(tabs)");
            }
          } catch {}
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

  if (!loaded && !error) return <AppSplash />;

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

export default (isExpoGo || !process.env.EXPO_PUBLIC_SENTRY_DSN) ? RootLayout : Sentry.wrap(RootLayout);
