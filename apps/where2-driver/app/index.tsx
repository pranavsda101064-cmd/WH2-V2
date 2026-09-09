import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius } from "@/src/theme";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";

// Green mountain ranges, Chikmagalur — Karnataka, Western Ghats.
const BG =
  "https://images.unsplash.com/photo-eyNsCCb4RBc?auto=format&fit=crop&w=1400&q=80";

export default function Landing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root} testID="landing-screen">
      <StatusBar style="light" />
      <ImageBackground source={{ uri: BG }} style={styles.bg} resizeMode="cover">
        {/* Sky darken top-down (subtle) */}
        <LinearGradient
          colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)"]}
          style={styles.topFade}
          pointerEvents="none"
        />

        {/* Headline — sits mid-screen so lower half is masked by hills gradient */}
        <View style={styles.headlineWrap} pointerEvents="none">
          <FadeIn delay={300} duration={800} direction="up" scale>
            <Text style={styles.headline} testID="landing-headline">
              WHERE TO ?!
            </Text>
          </FadeIn>
        </View>

        {/* Hills mask — solid dark base with soft top edge, masks bottom of headline */}
        <LinearGradient
          colors={[
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0.2)",
            "rgba(0,0,0,0.65)",
            "rgba(0,0,0,0.95)",
            "#000000",
          ]}
          locations={[0, 0.18, 0.45, 0.7, 1]}
          style={styles.hillsMask}
          pointerEvents="none"
        />

        {/* Bottom content */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
          <FadeIn delay={400}>
            <Text style={styles.tagline}>Sakleshpura · Karnataka</Text>
          </FadeIn>
          <FadeIn delay={600}>
            <Text style={styles.sub}>Curated tourist rides through the hills</Text>
          </FadeIn>

          <FadeIn delay={800}>
            <SpringPress
              style={styles.cta}
              onPress={() => router.push("/auth")}
              testID="landing-continue-button"
            >
              <Text style={styles.ctaText}>Get started</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </SpringPress>
          </FadeIn>

          <FadeIn delay={1000}>
            <Text style={styles.legal}>
              By continuing you agree to our Terms & Privacy Policy.
            </Text>
          </FadeIn>
        </View>
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
    height: "62%",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 8,
  },
  headline: {
    color: "#fff",
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: -1.5,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 4 },
    textAlign: "center",
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
    paddingHorizontal: 24,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sub: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 28,
    letterSpacing: -0.3,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  legal: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },
});
