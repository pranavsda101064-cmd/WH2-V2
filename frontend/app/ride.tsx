import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { colors, radius } from "@/src/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const PINS = [
  { x: 0.18, y: 0.72, label: "Pickup" },
  { x: 0.5, y: 0.42, label: "Stop" },
  { x: 0.82, y: 0.25, label: "Drop" },
];

type Phase = "arriving" | "onboard" | "arrived";

export default function Ride() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>("arriving");
  const [eta, setEta] = useState(4);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [pulse]);

  useEffect(() => {
    const t = setInterval(() => {
      setEta((e) => {
        if (e > 1) return e - 1;
        // phase transitions
        setPhase((p) =>
          p === "arriving" ? "onboard" : p === "onboard" ? "arrived" : "arrived",
        );
        return 6;
      });
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const status =
    phase === "arriving"
      ? "Driver is on the way"
      : phase === "onboard"
        ? "On the way to your destination"
        : "You've arrived";

  const carPos = phase === "arriving" ? PINS[0] : phase === "onboard" ? PINS[1] : PINS[2];

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <View style={styles.root} testID="ride-screen">
      <StatusBar style="light" />
      <View style={styles.map}>
        <MockMap
          carPos={carPos}
          pulseScale={scale}
          pulseOpacity={opacity}
        />
        <View style={[styles.mapTop, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.mapIcon}
            onPress={() => router.back()}
            testID="ride-back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.etaPill}>
            <View style={styles.etaDot} />
            <Text style={styles.etaText}>
              {phase === "arrived" ? "ARRIVED" : `${eta} MIN AWAY`}
            </Text>
          </View>
          <TouchableOpacity style={styles.mapIcon} testID="ride-share">
            <Ionicons name="share-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.grabber} />

        <Text style={styles.kicker}>{status.toUpperCase()}</Text>
        <Text style={styles.headline}>
          {phase === "arriving"
            ? `Arriving in ${eta} min`
            : phase === "onboard"
              ? `${eta} min to destination`
              : "Ride complete"}
        </Text>

        {/* Driver card */}
        <View style={styles.driverCard}>
          <View style={styles.driverPhoto}>
            <Ionicons name="person" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>Ravi Kumar</Text>
            <View style={styles.driverMeta}>
              <Ionicons name="star" size={11} color="#fff" />
              <Text style={styles.driverRating}>4.87</Text>
              <Text style={styles.driverDot}> · </Text>
              <Text style={styles.driverPlate}>KA 13 X 4421</Text>
            </View>
            <Text style={styles.driverCar}>Silver SUV · Ertiga</Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actBtn} testID="ride-message">
              <Ionicons name="chatbubble-outline" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actBtn, styles.actBtnAccent]}
              testID="ride-call"
            >
              <Ionicons name="call" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Trip progress */}
        <View style={styles.progressRow}>
          <View style={[styles.progStep, styles.progStepDone]}>
            <Text style={styles.progText}>Pickup</Text>
          </View>
          <View
            style={[
              styles.progLine,
              (phase === "onboard" || phase === "arrived") && styles.progLineDone,
            ]}
          />
          <View
            style={[
              styles.progStep,
              (phase === "onboard" || phase === "arrived") && styles.progStepDone,
            ]}
          >
            <Text style={styles.progText}>Manjarabad</Text>
          </View>
          <View
            style={[styles.progLine, phase === "arrived" && styles.progLineDone]}
          />
          <View
            style={[
              styles.progStep,
              phase === "arrived" && styles.progStepDone,
            ]}
          >
            <Text style={styles.progText}>Bisle Ghat</Text>
          </View>
        </View>

        {phase === "arrived" ? (
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.replace("/rating")}
            activeOpacity={0.85}
            testID="ride-complete-button"
          >
            <Text style={styles.doneText}>Rate your ride</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.secondaryBtn} testID="ride-safety">
              <Ionicons name="shield-checkmark-outline" size={16} color="#fff" />
              <Text style={styles.secondaryText}>Safety</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, styles.cancelBtn]}
              onPress={() => router.replace("/(tabs)/home")}
              testID="ride-cancel"
            >
              <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
              <Text style={[styles.secondaryText, { color: colors.danger }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function MockMap({
  carPos,
  pulseScale,
  pulseOpacity,
}: {
  carPos: { x: number; y: number };
  pulseScale: Animated.AnimatedInterpolation<number>;
  pulseOpacity: Animated.AnimatedInterpolation<number>;
}) {
  const [dims, setDims] = useState({
    w: SCREEN_W,
    h: Math.round(SCREEN_H * 0.55),
  });
  const { w, h } = dims;
  const pts = PINS.map((p) => ({ x: p.x * w, y: p.y * h }));
  const pathD = `M ${pts[0].x} ${pts[0].y} Q ${(pts[0].x + pts[1].x) / 2 + 20} ${pts[1].y + 30}, ${pts[1].x} ${pts[1].y} T ${pts[2].x} ${pts[2].y}`;
  const car = { x: carPos.x * w, y: carPos.y * h };

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(e) =>
        setDims({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
    >
      <Svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        {[...Array(10)].map((_, i) => (
          <Line
            key={"h" + i}
            x1={0}
            y1={(h / 10) * i + 10}
            x2={w}
            y2={(h / 10) * i + 20}
            stroke="#1B1D22"
            strokeWidth={1}
          />
        ))}
        {[...Array(10)].map((_, i) => (
          <Line
            key={"v" + i}
            x1={(w / 10) * i + 15}
            y1={0}
            x2={(w / 10) * i - 15}
            y2={h}
            stroke="#1B1D22"
            strokeWidth={1}
          />
        ))}
        <Path
          d={pathD}
          stroke={colors.accent}
          strokeWidth={3.5}
          strokeLinecap="round"
          fill="none"
        />
        {pts.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={7}
            fill={i === pts.length - 1 ? colors.accent : "#fff"}
            stroke="#000"
            strokeWidth={2}
          />
        ))}
      </Svg>

      {/* Animated car pin */}
      <View
        style={{
          position: "absolute",
          left: car.x - 20,
          top: car.y - 20,
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
        }}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            styles.pulse,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
        <View style={styles.carPin}>
          <Ionicons name="car-sport" size={16} color="#fff" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  map: {
    height: "55%",
    backgroundColor: "#0B0D10",
    overflow: "hidden",
  },
  mapTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mapIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  etaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  etaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  etaText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  carPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  pulse: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 14,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  headline: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  driverCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  driverPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  driverName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  driverMeta: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  driverRating: { color: "#fff", fontSize: 12, marginLeft: 3 },
  driverDot: { color: colors.textDim, fontSize: 12 },
  driverPlate: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  driverCar: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  actionRow: { flexDirection: "row", gap: 8 },
  actBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  actBtnAccent: { backgroundColor: colors.accent, borderColor: colors.accent },
  progressRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progStep: {
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  progStepDone: {
    backgroundColor: "rgba(30,107,255,0.15)",
    borderColor: colors.accent,
  },
  progText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  progLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  progLineDone: { backgroundColor: colors.accent },
  bottomActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelBtn: { borderColor: "rgba(228,72,60,0.35)" },
  secondaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  doneBtn: {
    marginTop: 22,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  doneText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
