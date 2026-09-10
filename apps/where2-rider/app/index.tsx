import { useRef } from "react";
import { useRouter } from "expo-router";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

let Haptics: any = null;
try {
  Haptics = require("expo-haptics");
} catch {}

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { SpringPress } from "@/src/components/spring-press";
import { storage } from "@/src/utils/storage";
import { TOURIST_PLACES } from "@/src/utils/location";

const PHOTO =
  "https://images.unsplash.com/photo-1754164366303-d4e15c2e54b2?auto=format&fit=crop&w=800&q=80";

// Sakleshpura center for distance calculation
const CENTER = { lat: 13.037, lng: 75.784 };

function getDistanceKm(lat: number, lng: number): number {
  const R = 6371;
  const dLat = ((lat - CENTER.lat) * Math.PI) / 180;
  const dLng = ((lng - CENTER.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((CENTER.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PLACES = TOURIST_PLACES.slice(0, 5).map((p) => ({
  ...p,
  distance: getDistanceKm(p.lat, p.lng).toFixed(1),
}));

export default function Landing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const arrowX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const handleGetStarted = () => {
    if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/auth");
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
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {/* Wordmark + tagline */}
        <View style={styles.brand}>
          <Text style={styles.wordmark}>where2</Text>
          <Text style={styles.tagline}>Your way around Sakleshpura</Text>
        </View>

        {/* Landscape photo */}
        <Image
          source={{ uri: PHOTO }}
          style={styles.photo}
          resizeMode="cover"
        />

        {/* Question */}
        <Text style={styles.question}>
          Where do you want{"\n"}to go?
        </Text>

        {/* Search bar — tap opens location picker */}
        <SpringPress
          style={styles.searchBar}
          onPress={() => router.push("/location-picker?target=dropoff")}
        >
          <Ionicons name="search" size={18} color={colors.textDim} />
          <Text style={styles.searchPlaceholder}>Search destination...</Text>
        </SpringPress>

        <Text style={styles.locationLabel}>Sakleshpura, Karnataka</Text>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Explore nearby — outlined button */}
        <SpringPress
          style={styles.exploreBtn}
          onPress={() => scrollRef.current?.scrollTo({ y: 480, animated: true })}
        >
          <Text style={styles.exploreBtnText}>Explore nearby places</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
        </SpringPress>

        {/* Tourist places */}
        <View style={styles.placesSection}>
          {PLACES.map((place, i) => (
            <SpringPress
              key={place.name}
              style={styles.placeRow}
              onPress={() => {
                storage.setItem(
                  "dropoff_location",
                  { lat: place.lat, lng: place.lng, label: place.name } as any,
                );
                router.push("/location-picker?target=dropoff");
              }}
            >
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeMeta}>
                  {place.tag} · {place.distance} km
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textDim}
              />
            </SpringPress>
          ))}
        </View>

        {/* Legal */}
        <Text style={styles.legal}>
          By continuing you agree to our{" "}
          <Text
            style={styles.legal}
            onPress={() => router.push("/terms")}
          >
            Terms
          </Text>
          {" & "}
          <Text
            style={styles.legal}
            onPress={() => router.push("/privacy")}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </ScrollView>

      {/* CTA — pinned at bottom */}
      <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + spacing.md }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },

  // Brand
  brand: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  wordmark: {
    fontSize: 18,
    fontWeight: "400",
    color: colors.text,
    letterSpacing: 2,
    textTransform: "lowercase",
  },
  tagline: {
    fontSize: font.caption,
    fontWeight: "400",
    color: colors.textMuted,
    marginTop: 2,
  },

  // Photo
  photo: {
    width: "100%",
    aspectRatio: 1.5,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },

  // Question
  question: {
    fontSize: font.h3,
    fontWeight: "500",
    color: colors.text,
    lineHeight: 28,
    marginBottom: spacing.md,
  },

  // Search bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: font.body,
    color: colors.textDim,
    flex: 1,
  },

  // Location
  locationLabel: {
    fontSize: font.caption,
    color: colors.textDim,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: font.caption,
    color: colors.textDim,
  },

  // Explore button
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  exploreBtnText: {
    fontSize: font.body,
    fontWeight: "500",
    color: colors.text,
  },

  // Tourist places
  placesSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: font.body,
    fontWeight: "500",
    color: colors.text,
  },
  placeMeta: {
    fontSize: font.caption,
    fontWeight: "400",
    color: colors.textMuted,
    marginTop: 2,
  },

  // Legal
  legal: {
    fontSize: font.caption,
    fontWeight: "400",
    color: colors.textDim,
    textAlign: "center",
    marginTop: spacing.xl,
    lineHeight: 18,
  },

  // CTA — pinned bottom
  ctaWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
  },
  cta: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadows.accent,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
