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
import { colors } from "@/src/theme";
import { api, getToken, getProfileCompleted } from "@/src/api";

// Guard expo-notifications — removed from Expo Go in SDK 53+
let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
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

function RootLayout() {
  const [loaded, error] = useIconFonts();
  const notificationListener = useRef<any>(null);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Auth check: if token exists, skip landing page
  useEffect(() => {
    getToken().then((token) => {
      if (token) {
        getProfileCompleted().then((completed) => {
          router.replace(completed ? "/(tabs)/home" : "/profile-setup");
        });
      }
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!Notifications) return;

    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification: any) => {
        // Foreground notification — could update UI, show toast, etc.
      },
    );

    return () => {
      if (notificationListener.current) {
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

export default isExpoGo ? RootLayout : Sentry.wrap(RootLayout);
