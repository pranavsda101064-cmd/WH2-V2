import { useState } from "react";
import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius } from "@/src/theme";
import { api } from "@/src/api";
import { storage } from "@/src/utils/storage";

const TIP_PRESETS = [0, 50, 100, 200];
const COMPLIMENTS = [
  { id: "c1", label: "Safe driving", icon: "shield-checkmark-outline" as const },
  { id: "c2", label: "Clean car", icon: "sparkles-outline" as const },
  { id: "c3", label: "Great music", icon: "musical-notes-outline" as const },
  { id: "c4", label: "Local tips", icon: "compass-outline" as const },
  { id: "c5", label: "Friendly", icon: "happy-outline" as const },
  { id: "c6", label: "On time", icon: "time-outline" as const },
];

export default function Rating() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stars, setStars] = useState(0);
  const [tip, setTip] = useState<number>(50);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
    setTimeout(() => router.replace("/(tabs)/home"), 1400);
  };

  if (submitted) {
    return (
      <View style={styles.done} testID="rating-success">
        <View style={styles.successCircle}>
          <Ionicons name="heart" size={40} color="#fff" />
        </View>
        <Text style={styles.doneTitle}>Thanks for rating</Text>
        <Text style={styles.doneSub}>
          Your feedback helps us improve every ride
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="rating-screen">
      <StatusBar style="light" />
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
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.replace("/(tabs)/home")}
            testID="rating-close"
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Driver */}
          <View style={styles.driverBlock}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color="#fff" />
            </View>
            <Text style={styles.driverName}>Ravi Kumar</Text>
            <Text style={styles.driverSub}>Silver SUV · KA 13 X 4421</Text>
          </View>

          <Text style={styles.q}>How was your ride?</Text>

          {/* Stars */}
          <View style={styles.starsRow} testID="stars-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setStars(n)}
                style={styles.starBtn}
                testID={`star-${n}`}
              >
                <Ionicons
                  name={n <= stars ? "star" : "star-outline"}
                  size={40}
                  color={n <= stars ? colors.accent : colors.borderStrong}
                />
              </TouchableOpacity>
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
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => toggle(c.id)}
                    style={[styles.tag, active && styles.tagActive]}
                    testID={`tag-${c.id}`}
                  >
                    <Ionicons
                      name={c.icon}
                      size={14}
                      color={active ? colors.accent : "#fff"}
                    />
                    <Text
                      style={[styles.tagText, active && { color: colors.accent }]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
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
                <TouchableOpacity
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
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Submit */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            onPress={submit}
            disabled={stars === 0}
            activeOpacity={0.85}
            style={[styles.submit, stars === 0 && styles.submitDisabled]}
            testID="submit-rating-button"
          >
            <Text style={styles.submitText}>
              {tip > 0 ? `Submit + Tip ₹${tip}` : "Submit rating"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  driverBlock: { alignItems: "center", marginBottom: 28 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  driverName: { color: "#fff", fontSize: 20, fontWeight: "800" },
  driverSub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  q: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  starBtn: { padding: 4 },
  starHint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
    justifyContent: "center",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagActive: {
    borderColor: colors.accent,
    backgroundColor: "rgba(30,107,255,0.12)",
  },
  tagText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  section: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  sectionSub: { color: colors.textMuted, fontSize: 12, marginBottom: 10 },
  noteInput: {
    minHeight: 90,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  tipRow: { flexDirection: "row", gap: 8 },
  tipBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tipBtnActive: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: "rgba(30,107,255,0.12)",
  },
  tipText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  submit: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  submitDisabled: {
    backgroundColor: colors.surfaceAlt,
    shadowOpacity: 0,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  done: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  doneTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  doneSub: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
  },
});
