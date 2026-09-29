import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import type { DriverRequest } from "@/src/api";
import { FadeIn } from "@/src/components/fade-in";
import { SpringPress } from "@/src/components/spring-press";

type Props = {
  request: DriverRequest | null;
  remaining?: number;
  total?: number;
  accepting?: boolean;
  declining?: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onClose: () => void;
};

function RouteRow({ dot, label, sub }: { dot: string; label: string; sub: string }) {
  return (
    <View style={s.routeRow}>
      <View style={[s.dot, { backgroundColor: dot }]} />
      <View style={{ flex: 1 }}>
        <Text style={s.routeLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={s.routeSub}>{sub}</Text>
      </View>
    </View>
  );
}

export function RequestSheet({
  request,
  remaining = 30,
  total = 30,
  accepting = false,
  declining = false,
  onAccept,
  onDecline,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  if (!request) return null;

  const progress = Math.max(0, Math.min(1, remaining / total));
  const barColor =
    progress > 0.5 ? colors.accent : progress > 0.25 ? colors.pending : colors.danger;
  const initial = (request.rider || "R").trim().charAt(0).toUpperCase();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={s.backdrop} onPress={onClose} testID="request-sheet-backdrop" />
      <FadeIn direction="up" duration={320} scale>
        <View style={[s.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={s.grabber} />

          <View style={s.countdownBg}>
            <View style={[s.countdownFill, { width: `${progress * 100}%`, backgroundColor: barColor }]} />
          </View>

          <View style={s.headRow}>
            <View style={s.headLeft}>
              <View style={s.pulse}>
                <View style={s.pulseDot} />
              </View>
              <Text style={s.headTitle}>New ride request</Text>
            </View>
            <View style={[s.timerChip, { borderColor: barColor }]}>
              <Ionicons name="timer-outline" size={14} color={barColor} />
              <Text style={[s.timerText, { color: barColor }]}>{remaining}s</Text>
            </View>
          </View>

          <View style={s.riderRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.riderName} numberOfLines={1}>
                {request.rider}
              </Text>
              <View style={s.riderMeta}>
                <Ionicons name="star" size={13} color={colors.pending} />
                <Text style={s.metaText}>{request.rating.toFixed(1)}</Text>
                <Text style={s.metaDot}>·</Text>
                <Text style={s.metaText}>{request.tag}</Text>
              </View>
            </View>
            <View style={s.fareBox}>
              <Text style={s.fare}>₹{request.fare}</Text>
              <Text style={s.fareSub}>estimated</Text>
            </View>
          </View>

          <View style={s.routeBox}>
            <RouteRow dot={colors.success} label={request.pickup} sub="Pickup" />
            <View style={s.connector}>
              <View style={s.dash} />
            </View>
            <RouteRow dot={colors.danger} label={request.drop} sub="Drop-off" />
          </View>

          <View style={s.chips}>
            <View style={s.chip}>
              <Ionicons name="navigate-outline" size={13} color={colors.accent} />
              <Text style={s.chipText}>{request.distance}</Text>
            </View>
            <View style={s.chip}>
              <Ionicons name="time-outline" size={13} color={colors.accent} />
              <Text style={s.chipText}>{request.duration}</Text>
            </View>
          </View>

          <View style={s.actions}>
            <SpringPress
              style={[s.declineBtn, declining && s.btnDisabled]}
              onPress={() => onDecline(request.id)}
              testID={`sheet-decline-${request.id}`}
              disabled={declining || accepting}
            >
              <Text style={s.declineText}>{declining ? "Declining…" : "Decline"}</Text>
            </SpringPress>
            <SpringPress
              style={[s.acceptBtn, accepting && s.btnDisabled]}
              onPress={() => onAccept(request.id)}
              testID={`sheet-accept-${request.id}`}
              disabled={accepting || declining}
            >
              <Text style={s.acceptText}>{accepting ? "Accepting…" : "Accept ride"}</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </SpringPress>
          </View>
        </View>
      </FadeIn>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    ...shadows.lg,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  countdownBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  countdownFill: {
    height: 6,
    borderRadius: 3,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  headLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pulse: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  headTitle: {
    fontSize: font.label,
    fontWeight: "700",
    color: colors.text,
  },
  timerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timerText: {
    fontSize: font.small,
    fontWeight: "800",
  },
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: font.h3,
    fontWeight: "800",
  },
  riderName: {
    fontSize: font.body,
    fontWeight: "700",
    color: colors.text,
  },
  riderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: font.small,
    color: colors.textMuted,
    fontWeight: "600",
  },
  metaDot: {
    fontSize: font.small,
    color: colors.textDim,
  },
  fareBox: {
    alignItems: "flex-end",
  },
  fare: {
    fontSize: font.h2,
    fontWeight: "800",
    color: colors.text,
  },
  fareSub: {
    fontSize: font.micro,
    color: colors.textDim,
  },
  routeBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLabel: {
    fontSize: font.label,
    fontWeight: "600",
    color: colors.text,
  },
  routeSub: {
    fontSize: font.caption,
    color: colors.textDim,
  },
  connector: {
    paddingLeft: 5,
    paddingVertical: 2,
  },
  dash: {
    width: 2,
    height: 12,
    backgroundColor: colors.borderStrong,
    borderRadius: 1,
  },
  chips: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.accentDim,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  declineBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  declineText: {
    fontSize: font.label,
    fontWeight: "700",
    color: colors.danger,
  },
  acceptBtn: {
    flex: 2,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...shadows.glow(colors.accentGlow),
  },
  acceptText: {
    fontSize: font.body,
    fontWeight: "800",
    color: "#fff",
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
