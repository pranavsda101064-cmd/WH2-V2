import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { api } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { SpringPress } from "@/src/components/spring-press";

const { width: SCREEN_W } = Dimensions.get("window");

const TIP_PRESETS = [0, 50, 100, 200];
const COMPLIMENTS = [
  { id: "c1", label: "Safe driving", icon: "shield-checkmark-outline" as const },
  { id: "c2", label: "Clean car", icon: "sparkles-outline" as const },
  { id: "c3", label: "Great music", icon: "musical-notes-outline" as const },
  { id: "c4", label: "Local tips", icon: "compass-outline" as const },
  { id: "c5", label: "Friendly", icon: "happy-outline" as const },
  { id: "c6", label: "On time", icon: "time-outline" as const },
];

const CONFETTI_COLORS = [colors.accent, "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#F7DC6F"];

/* ── Confetti particle ──────────────────────────────────── */
function ConfettiParticle({ delay, color, startX }: { delay: number; color: string; startX: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, {
          toValue: -300 - (delay % 200),
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateX, {
          toValue: ((delay % 100) - 50) * 4,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 800,
          delay: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        bottom: SCREEN_W * 0.5,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity,
        transform: [
          { translateY },
          { translateX },
          { rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) },
        ],
      }}
    />
  );
}

/* ── Animated star ──────────────────────────────────────── */
function AnimatedStar({ index, selected, onPress }: { index: number; selected: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.35, friction: 4, tension: 300, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <SpringPress onPress={handlePress} testID={`star-${index}`}>
      <Animated.View style={{ transform: [{ scale }], padding: 4 }}>
        <Ionicons
          name={selected ? "star" : "star-outline"}
          size={40}
          color={selected ? colors.accent : colors.borderStrong}
        />
      </Animated.View>
    </SpringPress>
  );
}

/* ── Success screen with animated checkmark ─────────────── */
function SuccessScreen() {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
      Animated.timing(checkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.done} testID="rating-success">
      {/* Confetti — deterministic positions */}
      {Array.from({ length: 18 }).map((_, i) => (
        <ConfettiParticle
          key={i}
          delay={i * 40}
          color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
          startX={SCREEN_W * 0.3 + (i * 37) % (SCREEN_W * 0.4)}
        />
      ))}

      <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={{ opacity: checkOpacity }}>
          <Ionicons name="checkmark" size={48} color="#fff" />
        </Animated.View>
      </Animated.View>
      <Animated.Text style={[styles.doneTitle, { opacity: checkOpacity }]}>
        Thanks for rating
      </Animated.Text>
      <Animated.Text style={[styles.doneSub, { opacity: checkOpacity }]}>
        Your feedback helps us improve every ride
      </Animated.Text>
    </View>
  );
}

export default function Rating() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stars, setStars] = useState(0);
  const [tip, setTip] = useState<number>(50);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [driverName, setDriverName] = useState("Driver");
  const [driverVehicle, setDriverVehicle] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const rideId = await storage.getItem<string>("active_ride_id", "");
        if (rideId) {
          const driver = await api.getRideDriver(rideId);
          if (driver?.name) setDriverName(driver.name);
          const vehicleParts = [driver?.vehicle_make, driver?.vehicle_model].filter(Boolean);
          if (vehicleParts.length > 0) setDriverVehicle(vehicleParts.join(" "));
          if (driver?.vehicle_reg) setDriverVehicle((prev) => prev ? `${prev} · ${driver.vehicle_reg}` : driver.vehicle_reg || "");
        }
      } catch {}
    })();
  }, []);

  const toggle = (id: string) =>
    setTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );

  const submit = async () => {
    setSubmitted(true);
    const rideId = await storage.getItem<string>("active_ride_id", "");
    if (rideId) {
      api
        .submitRating({
          ride_id: rideId,
          stars,
          tags,
          note: note || undefined,
          tip,
        })
        .catch(() => {});
    }
    setTimeout(() => router.replace("/(tabs)/home"), 2800);
  };

  if (submitted) {
    return <SuccessScreen />;
  }

  return (
    <View style={styles.root} testID="rating-screen">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 140,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <SpringPress
            style={styles.closeBtn}
            onPress={() => router.replace("/(tabs)/home")}
            testID="rating-close"
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </SpringPress>

          {/* Driver */}
          <View style={styles.driverBlock}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color={colors.accent} />
            </View>
            <Text style={styles.driverName}>{driverName}</Text>
            {driverVehicle ? (
              <Text style={styles.driverSub}>{driverVehicle}</Text>
            ) : null}
          </View>

          <Text style={styles.q}>How was your ride?</Text>

          {/* Stars */}
          <View style={styles.starsRow} testID="stars-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <AnimatedStar
                key={n}
                index={n}
                selected={n <= stars}
                onPress={() => setStars(n)}
              />
            ))}
          </View>

          {stars > 0 && (
            <Text style={styles.starHint}>
              {stars === 5
                ? "Amazing! What made it great?"
                : stars >= 4
                  ? "Glad it was good — anything to highlight?"
                  : stars >= 3
                    ? "Thanks — how can we do better?"
                    : "Sorry to hear that. Tell us what happened."}
            </Text>
          )}

          {/* Compliments */}
          {stars > 0 && (
            <View style={styles.tagsWrap} testID="compliment-tags">
              {COMPLIMENTS.map((c) => {
                const active = tags.includes(c.id);
                return (
                  <SpringPress
                    key={c.id}
                    onPress={() => toggle(c.id)}
                    style={[styles.tag, active && styles.tagActive]}
                    testID={`tag-${c.id}`}
                  >
                    <Ionicons
                      name={c.icon}
                      size={14}
                      color={active ? colors.accent : colors.textMuted}
                    />
                    <Text
                      style={[styles.tagText, active && { color: colors.accent }]}
                    >
                      {c.label}
                    </Text>
                  </SpringPress>
                );
              })}
            </View>
          )}

          {/* Note */}
          <Text style={styles.section}>Add a note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Anything else you want to share?"
            placeholderTextColor={colors.textDim}
            style={styles.noteInput}
            testID="note-input"
          />

          {/* Tip */}
          <Text style={styles.section}>Add a tip</Text>
          <Text style={styles.sectionSub}>100% goes to your driver</Text>
          <View style={styles.tipRow}>
            {TIP_PRESETS.map((amt) => {
              const active = tip === amt;
              return (
                <SpringPress
                  key={amt}
                  onPress={() => setTip(amt)}
                  style={[styles.tipBtn, active && styles.tipBtnActive]}
                  testID={`tip-${amt}`}
                >
                  <Text
                    style={[styles.tipText, active && { color: colors.accent }]}
                  >
                    {amt === 0 ? "No tip" : `₹${amt}`}
                  </Text>
                </SpringPress>
              );
            })}
          </View>
        </ScrollView>

        {/* Submit */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <SpringPress
            onPress={submit}
            disabled={stars === 0}
            style={[styles.submit, stars === 0 && styles.submitDisabled]}
            testID="submit-rating-button"
          >
            <Text style={styles.submitText}>
              {tip > 0 ? `Submit + Tip ₹${tip}` : "Submit rating"}
            </Text>
          </SpringPress>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  driverBlock: { alignItems: "center", marginBottom: 28 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  driverName: { color: colors.text, fontSize: font.subtitle, fontWeight: "600" },
  driverSub: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.xs },
  q: {
    color: colors.text, fontSize: font.title, fontWeight: "600",
    textAlign: "center", marginBottom: 20,
  },
  starsRow: {
    flexDirection: "row", justifyContent: "space-between",
    marginBottom: spacing.md, paddingHorizontal: 8,
  },
  starHint: {
    color: colors.textMuted, fontSize: font.small,
    textAlign: "center", marginBottom: 20,
  },
  tagsWrap: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
    marginBottom: spacing.lg, justifyContent: "center",
  },
  tag: {
    flexDirection: "row", alignItems: "center", gap: 6, height: 36,
    paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  tagActive: { borderColor: colors.accent, backgroundColor: "rgba(0,137,123,0.12)" },
  tagText: { color: colors.text, fontSize: font.small, fontWeight: "600" },
  section: {
    color: colors.text, fontSize: font.body, fontWeight: "600",
    marginTop: 8, marginBottom: 4,
  },
  sectionSub: { color: colors.textMuted, fontSize: font.caption, marginBottom: 10 },
  noteInput: {
    minHeight: 90, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, padding: 14,
    color: colors.text, fontSize: font.label, textAlignVertical: "top", marginBottom: 8,
  },
  tipRow: { flexDirection: "row", gap: 8 },
  tipBtn: {
    flex: 1, height: 46, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  tipBtnActive: { borderColor: colors.accent, borderWidth: 2, backgroundColor: "rgba(0,137,123,0.12)" },
  tipText: { color: colors.text, fontSize: font.label, fontWeight: "600" },
  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: 20, paddingTop: 14,
  },
  submit: {
    height: 56, borderRadius: radius.pill, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center", ...shadows.accent,
  },
  submitDisabled: { backgroundColor: colors.surfaceAlt, shadowOpacity: 0 },
  submitText: { color: "#fff", fontSize: font.subtitle, fontWeight: "700" },
  done: {
    flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  successCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center", marginBottom: 24, ...shadows.accent,
  },
  doneTitle: { color: colors.text, fontSize: 22, fontWeight: "600" },
  doneSub: { color: colors.textMuted, fontSize: font.body, marginTop: 8, textAlign: "center" },
});
