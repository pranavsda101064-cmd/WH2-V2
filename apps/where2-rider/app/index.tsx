import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
let Haptics: any = null;
try { Haptics = require("expo-haptics"); } catch {}
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";
import { storage } from "@/src/utils/storage";
import { TOURIST_PLACES } from "@/src/utils/location";

const BG =
  "https://images.unsplash.com/photo-b-GcKW0Vqpc?auto=format&fit=crop&w=1400&q=80";

const EASE = Easing.out(Easing.cubic);

export default function Landing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const contentOpacity = useSharedValue(1);
  const contentTranslateY = useSharedValue(0);
  const headlineScale = useSharedValue(1);
  const headlineOpacity = useSharedValue(1);

  const contentAnim = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const headlineAnim = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [{ scale: headlineScale.value }],
  }));

  const handleGetStarted = () => {
    if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    contentOpacity.value = withTiming(0, { duration: 350, easing: EASE });
    contentTranslateY.value = withTiming(40, { duration: 350, easing: EASE });

    headlineOpacity.value = withDelay(80, withTiming(0, { duration: 300, easing: EASE }));
    headlineScale.value = withDelay(80, withTiming(1.08, { duration: 300, easing: EASE }));

    setTimeout(() => router.push("/auth"), 380);
  };

  return (
    <View style={styles.root} testID="landing-screen">
      <ImageBackground source={{ uri: BG }} style={styles.bg} resizeMode="cover">
        {/* Top gradient — subtle sky darken */}
        <LinearGradient
          colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0)"]}
          style={styles.topFade}
          pointerEvents="none"
        />

        {/* Headline — left-aligned */}
        <Animated.View style={[styles.headlineWrap, headlineAnim]} pointerEvents="none">
          <FadeIn delay={300} duration={800} direction="up" scale={{ from: 0.85, to: 1 }}>
            <Text style={styles.headline} testID="landing-headline">
              Where2!?
            </Text>
          </FadeIn>
        </Animated.View>

        {/* Hills mask — lighter, more image visible */}
        <LinearGradient
          colors={[
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0.15)",
            "rgba(0,0,0,0.55)",
            "rgba(0,0,0,0.92)",
            "#000000",
          ]}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          style={styles.hillsMask}
          pointerEvents="none"
        />

        {/* Bottom content — animated exit */}
        <Animated.View
          style={[styles.bottom, { paddingBottom: insets.bottom + 24 }, contentAnim]}
        >
          <FadeIn delay={500} duration={600}>
            <Text style={styles.heroSub}>Go Beyond the Map.</Text>
          </FadeIn>

          <FadeIn delay={650} duration={600}>
            <Text style={styles.heroDesc}>
              Discover new places, create{"\n"}unforgettable journeys.
            </Text>
          </FadeIn>

          {/* Destination suggestions */}
          <FadeIn delay={800} duration={500}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsRow}
            >
              {TOURIST_PLACES.slice(0, 6).map((place) => (
                <SpringPress
                  key={place.name}
                  style={styles.chip}
                  onPress={() => {
                    storage.setItem(
                      "dropoff_location",
                      { lat: place.lat, lng: place.lng, label: place.name },
                    );
                    router.push("/location-picker?target=dropoff");
                  }}
                >
                  <Text style={styles.chipTag}>{place.tag}</Text>
                  <Text style={styles.chipName}>{place.name}</Text>
                </SpringPress>
              ))}
            </ScrollView>
          </FadeIn>

          {/* Glossy CTA button */}
          <FadeIn delay={900} duration={500}>
            <LinearGradient
              colors={["#1E6BFF", "#4A90FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <SpringPress
                style={styles.cta}
                onPress={handleGetStarted}
                testID="landing-continue-button"
              >
                <View style={styles.ctaShine} pointerEvents="none" />
                <Text style={styles.ctaText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </SpringPress>
            </LinearGradient>
          </FadeIn>

          {/* Tappable legal */}
          <FadeIn delay={1000} duration={500}>
            <Text style={styles.legal}>
              By continuing you agree to our{" "}
              <Text style={styles.legalLink} onPress={() => router.push("/terms")}>
                Terms
              </Text>
              {" & "}
              <Text style={styles.legalLink} onPress={() => router.push("/privacy")}>
                Privacy Policy
              </Text>.
            </Text>
          </FadeIn>
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bg: { flex: 1 },
  topFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "25%",
  },
  headlineWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headline: {
    color: "#fff",
    fontSize: 62,
    fontWeight: "900",
    letterSpacing: -2,
    textAlign: "left",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 4 },
  },
  hillsMask: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "58%",
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
  },
  heroSub: {
    color: "#fff",
    fontSize: font.title,
    fontWeight: "600",
    letterSpacing: -0.3,
    marginTop: spacing.sm,
  },
  heroDesc: {
    color: colors.textMuted,
    fontSize: font.body,
    fontWeight: "400",
    marginTop: 6,
    lineHeight: 22,
  },
  suggestionsRow: {
    gap: 10,
    marginTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    minWidth: 120,
  },
  chipTag: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  chipName: {
    color: "#fff",
    fontSize: font.small,
    fontWeight: "600",
    marginTop: 3,
  },
  ctaGradient: {
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    ...shadows.accent,
  },
  cta: {
    height: 58,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 36,
    overflow: "hidden",
  },
  ctaShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  ctaText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  legal: {
    color: colors.textDim,
    fontSize: font.caption,
    textAlign: "center",
    marginTop: spacing.md,
  },
  legalLink: {
    color: colors.accent,
    fontWeight: "600",
  },
});
