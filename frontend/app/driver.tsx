import { useState } from "react";
import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius } from "@/src/theme";
import { driverProfile } from "@/src/data/mock";

export default function Driver() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [online, setOnline] = useState(true);

  return (
    <View style={styles.root} testID="driver-screen">
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* Top row */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
            testID="driver-back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Driver</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Online toggle card */}
        <View
          style={[
            styles.toggleCard,
            online && styles.toggleCardOn,
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleLabel, online && { color: colors.accent }]}>
              {online ? "YOU'RE ONLINE" : "YOU'RE OFFLINE"}
            </Text>
            <Text style={styles.toggleSub}>
              {online ? "Accepting ride requests" : "Go online to receive rides"}
            </Text>
          </View>
          <Switch
            value={online}
            onValueChange={setOnline}
            trackColor={{ false: "#2A2C30", true: colors.accentDim }}
            thumbColor={online ? colors.accent : "#f4f3f4"}
            ios_backgroundColor="#2A2C30"
            testID="online-toggle"
          />
        </View>

        {/* Profile */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=70",
            }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{driverProfile.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.rating}>{driverProfile.rating.toFixed(2)}</Text>
              <Text style={styles.tripCount}>· {driverProfile.trips} trips</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.uploadBtn} testID="upload-photo-button">
            <Ionicons name="camera-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Personal */}
        <Section title="Personal information">
          <Field label="Full name" value={driverProfile.name} />
          <Field label="Contact number" value={driverProfile.phone} />
          <Field label="Address" value={driverProfile.address} last />
        </Section>

        {/* Documents */}
        <Section title="Documents">
          <Field label="Aadhaar" value={driverProfile.aadhaar} verified />
          <Field label="Driving license" value={driverProfile.license} verified />
          <Field label="Permit" value={driverProfile.permit} verified last />
        </Section>

        {/* Vehicle */}
        <Section title="Vehicle">
          <Field label="Type" value={driverProfile.vehicle.type} />
          <Field label="Registration" value={driverProfile.vehicle.reg} />
          <Field label="Seats" value={String(driverProfile.vehicle.seats)} last />
        </Section>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => router.replace("/")}
          testID="driver-signout-button"
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Field({
  label,
  value,
  verified,
  last,
}: {
  label: string;
  value: string;
  verified?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.field, !last && styles.fieldDivider]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
      {verified && (
        <View style={styles.verifiedPill}>
          <Ionicons name="shield-checkmark" size={11} color={colors.success} />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  toggleCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleCardOn: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  toggleLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  toggleSub: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 6 },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  name: { color: "#fff", fontSize: 17, fontWeight: "700" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rating: { color: "#fff", fontSize: 12, fontWeight: "600" },
  tripCount: { color: colors.textMuted, fontSize: 12 },
  uploadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginHorizontal: 20,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  field: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fieldDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  fieldLabel: { color: colors.textMuted, fontSize: 12 },
  fieldValue: { color: "#fff", fontSize: 15, fontWeight: "500", marginTop: 3 },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.10)",
  },
  verifiedText: { color: colors.success, fontSize: 11, fontWeight: "700" },
  signOutBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
