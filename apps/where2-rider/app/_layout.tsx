import * as Sentry from "@sentry/react-native";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { LogBox, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Constants from "expo-constants";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import AppSplash from "@/src/AppSplash";
import { colors } from "@/src/theme";
import { api, getToken, getProfileCompleted } from "@/src/api";

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

LogBox.ignoreLogs(["Require cycle:", "Constants.installationId"]);

try {
  SplashScreen.preventAutoHideAsync().catch(() => {});
} catch {}

if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {}
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

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const token = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    await api.registerPushToken(token.data);
  } catch {}
}

function RootLayout() {
  const [loaded, error] = useIconFonts();
  const notificationListener = useRef<any>(null);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (loaded || error) {
      try {
        SplashScreen.hideAsync().catch(() => {});
      } catch {}
    }
  }, [loaded, error]);

  useEffect(() => {
    let cancelled = false;
    getToken()
      .then((token) => {
        if (cancelled) return;
        if (token) {
          return getProfileCompleted()
            .then((completed) => {
              if (cancelled) return;
              try {
                router.replace(completed ? "/(tabs)/home" : "/profile-setup");
              } catch {}
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAuthChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!Notifications) return;

    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification: any) => {
        if (Haptics) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
    };
  }, []);

  if (!loaded && !error) return <AppSplash />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: "slide_from_right",
              animationDuration: 350,
            }}
          >
            <Stack.Screen name="index" options={{ animation: "fade", animationDuration: 400 }} />
            <Stack.Screen name="checkout" options={{ animation: "slide_from_bottom" }} />
            <Stack.Screen name="rating" options={{ animation: "fade" }} />
            <Stack.Screen name="ride" options={{ animation: "fade" }} />
            <Stack.Screen name="vehicles" options={{ animation: "slide_from_bottom" }} />
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default (isExpoGo || !process.env.EXPO_PUBLIC_SENTRY_DSN) ? RootLayout : Sentry.wrap(RootLayout);
