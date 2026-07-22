import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius } from "@/src/theme";

const rows: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  action?: "driver";
}[] = [
  { icon: "person-outline", label: "Personal information" },
  { icon: "card-outline", label: "Payments" },
  { icon: "location-outline", label: "Saved addresses" },
  { icon: "notifications-outline", label: "Notifications" },
  { icon: "car-outline", label: "Switch to Driver", action: "driver" },
  { icon: "help-circle-outline", label: "Help" },
  { icon: "shield-checkmark-outline", label: "Privacy" },
  { icon: "log-out-outline", label: "Sign out" },
];

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.root} testID="profile-screen">
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <View style={styles.headRow}>
          <Text style={styles.h1}>Profile</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=70",
            }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Explorer</Text>
            <Text style={styles.phone}>+91 98765 43210</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.rating}>4.92 rider rating</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push("/auth")}
            testID="edit-profile-button"
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Trips" value="12" />
          <View style={styles.statDivider} />
          <Stat label="Distance" value="284 km" />
          <View style={styles.statDivider} />
          <Stat label="Saved" value="₹1,240" />
        </View>

        <View style={styles.list}>
          {rows.map((row, i) => (
            <TouchableOpacity
              key={row.label}
              style={[styles.row, i < rows.length - 1 && styles.rowDivider]}
              onPress={() => {
                if (row.action === "driver") router.push("/driver");
                else if (row.label === "Sign out") router.replace("/");
              }}
              activeOpacity={0.7}
              testID={`profile-row-${row.label.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <View style={styles.rowIcon}>
                <Ionicons name={row.icon} size={18} color={colors.textMuted} />
              </View>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version}>Sakleshpura Rides · v1.0</Text>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  h1: { color: "#fff", fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
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
  card: {
    marginHorizontal: 16,
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
  name: { color: "#fff", fontSize: 18, fontWeight: "700" },
  phone: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  rating: { color: "#fff", fontSize: 12 },
  editBtn: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  editText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  statsRow: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "700" },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  list: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "500" },
  version: {
    color: colors.textDim,
    textAlign: "center",
    fontSize: 11,
    marginTop: 24,
  },
});
