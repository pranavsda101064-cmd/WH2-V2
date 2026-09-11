import { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius } from "@/src/theme";

const { width: SCREEN_W } = Dimensions.get("window");

/* ── Shimmer gradient bar ─────────────────────────────────── */

function ShimmerBar({ style }: { style?: object }) {
  const translateX = useSharedValue(-SCREEN_W);

  useEffect(() => {
    translateX.value = withDelay(
      200,
      withRepeat(
        withTiming(SCREEN_W, { duration: 1200, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, []);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { overflow: "hidden" }, style]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, anim]}>
        <LinearGradient
          colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.06)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

/* ── Skeleton block (rectangle) ────────────────────────────── */

export function SkeletonBlock({
  width,
  height,
  borderRadius = radius.sm,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceAlt,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <ShimmerBar />
    </View>
  );
}

/* ── Skeleton circle ───────────────────────────────────────── */

export function SkeletonCircle({
  size,
  style,
}: {
  size: number;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surfaceAlt,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <ShimmerBar />
    </View>
  );
}

/* ── Full-page branded skeleton ────────────────────────────── */

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <View style={styles.page}>
      <SkeletonBlock width={100} height={14} style={{ marginTop: 16 }} />
      <SkeletonBlock width={160} height={28} style={{ marginTop: 6 }} />
      <SkeletonBlock
        width={SCREEN_W - 40}
        height={52}
        borderRadius={26}
        style={{ marginTop: 20 }}
      />
      <SkeletonBlock
        width={SCREEN_W - 32}
        height={Math.round(SCREEN_W * 0.65)}
        borderRadius={radius.lg}
        style={{ marginTop: 20 }}
      />
      <SkeletonBlock
        width={SCREEN_W - 32}
        height={80}
        borderRadius={radius.lg}
        style={{ marginTop: 12 }}
      />
    </View>
  );
}

/* ── Dashboard skeleton ───────────────────────────────────── */

export function DashboardSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <SkeletonBlock width={120} height={14} />
      <SkeletonBlock width={180} height={28} style={{ marginTop: 6 }} />
      <SkeletonBlock
        width={SCREEN_W - 32}
        height={72}
        borderRadius={radius.lg}
        style={{ marginTop: 20 }}
      />
      <View style={styles.statsRow}>
        <SkeletonBlock width="0" height={70} borderRadius={radius.lg} style={{ flex: 1 }} />
        <SkeletonBlock width="0" height={70} borderRadius={radius.lg} style={{ flex: 1 }} />
        <SkeletonBlock width="0" height={70} borderRadius={radius.lg} style={{ flex: 1 }} />
      </View>
      <SkeletonBlock width={160} height={16} style={{ marginTop: 28 }} />
      {[0, 1, 2].map((i) => (
        <SkeletonBlock
          key={i}
          width={SCREEN_W - 32}
          height={140}
          borderRadius={radius.lg}
          style={{ marginTop: 12 }}
        />
      ))}
    </View>
  );
}

/* ── Earnings skeleton ────────────────────────────────────── */

export function EarningsSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <SkeletonBlock width={120} height={14} />
      <SkeletonBlock width={160} height={28} style={{ marginTop: 6 }} />
      <View style={styles.statsRow}>
        <SkeletonBlock width="0" height={70} borderRadius={radius.lg} style={{ flex: 1 }} />
        <SkeletonBlock width="0" height={70} borderRadius={radius.lg} style={{ flex: 1 }} />
        <SkeletonBlock width="0" height={70} borderRadius={radius.lg} style={{ flex: 1 }} />
      </View>
      <SkeletonBlock width={160} height={16} style={{ marginTop: 28 }} />
      {[0, 1, 2, 3].map((i) => (
        <SkeletonBlock
          key={i}
          width={SCREEN_W - 32}
          height={90}
          borderRadius={radius.md}
          style={{ marginTop: 10 }}
        />
      ))}
    </View>
  );
}

/* ── Small inline bar loader ──────────────────────────────── */

export function LoadingBar() {
  return (
    <View style={styles.bar}>
      <SkeletonBlock width={SCREEN_W - 80} height={4} borderRadius={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
  },
  bar: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
});
