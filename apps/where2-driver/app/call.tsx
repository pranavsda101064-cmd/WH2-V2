import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Linking, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Call() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { name, phone } = useLocalSearchParams<{ name: string; phone: string }>();
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [keypad, setKeypad] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const initial = ((name || "R") as string).trim().charAt(0).toUpperCase();

  return (
    <View style={[x.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}>
      <StatusBar style="light" />
      <FadeIn delay={0}>
        <Text style={x.kicker}>WHERE2 CALL</Text>
      </FadeIn>

      <FadeIn delay={100}>
        <View style={x.avatar}>
          <Text style={x.avatarText}>{initial}</Text>
        </View>
        <Text style={x.name}>{name || "Rider"}</Text>
        <View style={x.timerRow}>
          <View style={x.liveDot} />
          <Text style={x.timer}>{fmt(seconds)}</Text>
        </View>
        <Text style={x.hint}>In-app call · uses your phone dialer for audio</Text>
      </FadeIn>

      <View style={{ flex: 1 }} />

      <FadeIn delay={200}>
        <View style={x.controls}>
          <Control
            icon={muted ? "mic-off-outline" : "mic-outline"}
            label={muted ? "Unmute" : "Mute"}
            active={muted}
            onPress={() => setMuted((v) => !v)}
          />
          <Control
            icon="volume-high-outline"
            label="Speaker"
            active={speaker}
            onPress={() => setSpeaker((v) => !v)}
          />
          <Control
            icon="keypad-outline"
            label="Keypad"
            active={keypad}
            onPress={() => setKeypad((v) => !v)}
          />
          {phone ? (
            <Control
              icon="call-outline"
              label="Dialer"
              onPress={() => Linking.openURL(`tel:${phone}`)}
            />
          ) : null}
        </View>

        <SpringPress style={x.endBtn} onPress={() => router.back()} testID="end-call">
          <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </SpringPress>
        <Text style={x.endLabel}>End call</Text>
      </FadeIn>
    </View>
  );
}

function Control({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <SpringPress style={[x.ctrl, active && x.ctrlActive]} onPress={onPress}>
      <Ionicons name={icon} size={24} color={active ? "#fff" : colors.text} />
      <Text style={[x.ctrlLabel, active && x.ctrlLabelActive]}>{label}</Text>
    </SpringPress>
  );
}

const x = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  kicker: {
    color: "rgba(255,255,255,0.6)",
    fontSize: font.micro,
    fontWeight: "800",
    letterSpacing: 2,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  avatarText: { color: "#fff", fontSize: 44, fontWeight: "800" },
  name: { color: "#fff", fontSize: font.h1, fontWeight: "800", marginTop: spacing.md },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  timer: { color: "#fff", fontSize: font.title, fontWeight: "600" },
  hint: { color: "rgba(255,255,255,0.6)", fontSize: font.caption, marginTop: 8 },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  ctrl: {
    width: 72,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 4,
    ...shadows.md,
  },
  ctrlActive: { backgroundColor: colors.text },
  ctrlLabel: { fontSize: font.micro, fontWeight: "700", color: colors.textMuted },
  ctrlLabelActive: { color: "#fff" },
  endBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    ...shadows.glow("rgba(228,72,60,0.5)"),
  },
  endLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: font.small,
    textAlign: "center",
    marginTop: 8,
  },
});
