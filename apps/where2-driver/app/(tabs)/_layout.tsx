import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { colors, shadows } from "@/src/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: -2 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
          ...shadows.md,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "car-sport" : "car-sport-outline"} color={color as string} size={focused ? 26 : 24} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "wallet" : "wallet-outline"} color={color as string} size={focused ? 26 : 24} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "person-circle" : "person-circle-outline"}
              color={color as string}
              size={focused ? 26 : 24}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  name,
  color,
  size = 24,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size?: number;
  focused: boolean;
}) {
  const scale = useSharedValue(focused ? 1.15 : 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 12, stiffness: 300 }) }],
  }));

  return (
    <Animated.View style={[{ alignItems: "center", justifyContent: "center" }, animatedStyle]}>
      <Ionicons name={name} size={size} color={color as string} />
    </Animated.View>
  );
}
