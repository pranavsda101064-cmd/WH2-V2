import { useEffect, useState } from "react";
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
import { api, getUserEmail, getUserName } from "@/src/api";

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
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    getUserEmail().then(setUserEmail);
    getUserName().then(setUserName);
    api.getProfile().then((p) => {
      if (p) {
        setUserName(p.full_name);
        setAvatarUrl(p.avatar_url);
      }
    }).catch(() => {});
  }, []);

  const displayName = userName || "Explorer";

  const getAvatarSource = () => {
    if (avatarUrl && avatarUrl.startsWith("http")) return { uri: avatarUrl };
    if (avatarUrl && avatarUrl.startsWith("/")) {
      return { uri: `${process.env.EXPO_PUBLIC_BACKEND_URL}${avatarUrl}` };
    }
    return { uri: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=70" };
  };

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
          <Image source={getAvatarSource()} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.phone}>{userEmail || "Not signed in"}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.rating}>4.92 rider rating</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push("/profile-setup")}
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
              onPress={async () => {
                if (row.action === "driver") router.push("/driver");
                else if (row.label === "Sign out") {
                  await api.logout();
                  router.replace("/");
                } else if (row.label === "Personal information") {
                  router.push("/profile-setup");
                }
              }}
            >
              <Ionicons name={row.icon} size={20} color="#fff" />
              <Text style={styles.rowLabel}>{row.label}</Text>
              {row.hint && <Text style={styles.rowHint}>{row.hint}</Text>}
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
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
    marginBottom: 20,
  },
  h1: { color: "#fff", fontSize: 28, fontWeight: "800" },
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
    marginHorizontal: 20,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceAlt,
  },
  name: { color: "#fff", fontSize: 17, fontWeight: "700" },
  phone: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rating: { color: colors.textMuted, fontSize: 12 },
  editBtn: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  editText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: colors.border },
  list: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "500" },
  rowHint: { color: colors.textDim, fontSize: 13 },
});
