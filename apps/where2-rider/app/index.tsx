import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Animated,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { SpringPress } from "@/src/components/spring-press";
import { getToken, getUserName } from "@/src/api";

let Haptics: any = null;
try {
  Haptics = require("expo-haptics");
} catch {}

const PHOTO =
  "https://images.unsplash.com/photo-1754164366303-d4e15c2e54b2?auto=format&fit=crop&w=800&q=80";

export default function Landing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState("");

  const arrowX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getToken().then((token) => {
      if (token) {
        getUserName().then((n) => {
          if (n) setUserName(n.split(" ")[0]);
        });
      }
    });
  }, []);

  const handleGetStarted = () => {
    if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    getToken().then((token) => {
      if (token) {
        router.replace("/(tabs)/home");
      } else {
        router.push("/auth");
      }
    });
  };

  const handlePressIn = () => {
    Animated.spring(arrowX, {
      toValue: 4,
      useNativeDriver: true,
      damping: 12,
      stiffness: 300,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(arrowX, {
      toValue: 0,
      useNativeDriver: true,
      damping: 12,
      stiffness: 300,
    }).start();
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={{ uri: PHOTO }} style={styles.bg} resizeMode="cover">
        <LinearGradient
          colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.85)"]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top area — wordmark + name */}
        <View style={[styles.top, { paddingTop: insets.top + spacing.xl }]}>
          <Text style={styles.wordmark}>where2!?</Text>
          {userName ? (
            <Text style={styles.name}>{userName}</Text>
          ) : (
            <Text style={styles.tagline}>Your way around Sakleshpura</Text>
          )}
        </View>

        {/* Bottom CTA */}
        <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + spacing.lg }]}>
          <SpringPress
            style={styles.cta}
            onPress={handleGetStarted}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            testID="landing-continue-button"
          >
            <Text style={styles.ctaText}>Get Started</Text>
            <Animated.View style={{ transform: [{ translateX: arrowX }] }}>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Animated.View>
          </SpringPress>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bg: {
    flex: 1,
  },

  // Top
  top: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  wordmark: {
    fontSize: 44,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -1,
  },
  name: {
    fontSize: 32,
    fontWeight: "600",
    color: "#fff",
    marginTop: spacing.sm,
  },
  tagline: {
    fontSize: font.body,
    fontWeight: "400",
    color: "rgba(255,255,255,0.75)",
    marginTop: spacing.sm,
    textAlign: "center",
  },

  // CTA
  ctaWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  cta: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadows.accent,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
