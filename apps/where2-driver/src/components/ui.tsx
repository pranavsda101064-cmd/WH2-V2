import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { SpringPress } from "@/src/components/spring-press";

// ---------- PrimaryButton ----------
export function PrimaryButton({
  title,
  onPress,
  icon,
  disabled,
  testID,
  variant = "solid",
}: {
  title: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  testID?: string;
  variant?: "solid" | "outline-danger" | "ghost";
}) {
  const style =
    variant === "solid" ? s.primary : variant === "outline-danger" ? s.dangerOutline : s.ghost;
  const textStyle =
    variant === "solid" ? s.primaryText : variant === "outline-danger" ? s.dangerText : s.ghostText;
  const iconColor = variant === "solid" ? "#fff" : variant === "outline-danger" ? colors.danger : colors.accent;
  return (
    <SpringPress style={[style, disabled && s.disabled]} onPress={onPress} testID={testID} disabled={disabled}>
      <Text style={textStyle}>{title}</Text>
      {icon ? <Ionicons name={icon} size={16} color={iconColor} /> : null}
    </SpringPress>
  );
}

// ---------- StatCard ----------
export function StatCard({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint?: string;
}) {
  const t = tint || colors.accent;
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: `${t}1A` }]}>
        <Ionicons name={icon} size={18} color={t} />
      </View>
      <Text style={s.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ---------- SectionHeader ----------
export function SectionHeader({
  title,
  right,
  dot,
}: {
  title: string;
  right?: string;
  dot?: boolean;
}) {
  return (
    <View style={s.sectionHead}>
      <View style={s.sectionLeft}>
        {dot ? <View style={s.liveDot} /> : null}
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {right ? <Text style={s.sectionRight}>{right}</Text> : null}
    </View>
  );
}

// ---------- QuickAction ----------
export function QuickAction({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <SpringPress style={s.qa} onPress={onPress} testID={testID}>
      <View style={s.qaIcon}>
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
      <Text style={s.qaLabel} numberOfLines={2}>
        {label}
      </Text>
    </SpringPress>
  );
}

const s = StyleSheet.create({
  primary: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...shadows.glow(colors.accentGlow),
  },
  primaryText: { fontSize: font.body, fontWeight: "800", color: "#fff" },
  dangerOutline: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dangerText: { fontSize: font.label, fontWeight: "700", color: colors.danger },
  ghost: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTint,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  ghostText: { fontSize: font.label, fontWeight: "700", color: colors.accentDim },
  disabled: { opacity: 0.6 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: "center",
    ...shadows.sm,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: { fontSize: font.title, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: font.micro, color: colors.textMuted, marginTop: 2, fontWeight: "600" },
  sectionHead: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md + 4,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  sectionRight: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  qa: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: "center",
    gap: 6,
    ...shadows.sm,
  },
  qaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  qaLabel: { fontSize: font.micro, fontWeight: "700", color: colors.text, textAlign: "center" },
});
