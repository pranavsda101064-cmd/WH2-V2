import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius, font, spacing } from "@/src/theme";
import { api, getUserEmail, getUserName } from "@/src/api";
import { SpringPress } from "@/src/components/spring-press";
import { SkeletonCircle } from "@/src/components/loading";

const DICEBEAR_FALLBACK = "https://api.dicebear.com/10.x/adventurer-neutral/png?seed=explorer&size=128&backgroundColor=transparent";

const rows: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  route?: string;
}[] = [
  { icon: "person-outline", label: "Personal information", route: "/profile-setup" },
  { icon: "location-outline", label: "Saved addresses", route: "/saved-addresses" },
  { icon: "notifications-outline", label: "Notifications", route: "/notifications" },
  { icon: "help-circle-outline", label: "Help", route: "/help" },
  { icon: "shield-checkmark-outline", label: "Privacy", route: "/privacy" },
  { icon: "document-text-outline", label: "Terms of Service", route: "/terms" },
  { icon: "log-out-outline", label: "Sign out" },
];

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileAddress, setProfileAddress] = useState<string | null>(null);
  const [tripCount, setTripCount] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);

  useEffect(() => {
    getUserEmail().then(setUserEmail);
    getUserName().then(setUserName);
    api.getProfile().then((p) => {
      if (p) {
        setUserName(p.full_name);
        setAvatarUrl(p.avatar_url);
        setProfileAddress(p.address);
        setUserPhone(p.phone);
      }
    }).catch(() => {});

    api.listRides().then((rides) => {
      const completed = rides.filter((r) => r.status === "completed");
      setTripCount(completed.length);
      const total = completed.reduce((s, r) => s + r.fare, 0);
      setTotalSaved(Math.round(total * 0.08));
      setTotalDistance(completed.length * 35);
    }).catch(() => {});
  }, []);

  const displayName = userName || "Explorer";

  const getAvatarSource = () => {
    if (avatarUrl && avatarUrl.startsWith("http")) return { uri: avatarUrl };
    if (avatarUrl && avatarUrl.startsWith("/") && process.env.EXPO_PUBLIC_BACKEND_URL) {
      return { uri: `${process.env.EXPO_PUBLIC_BACKEND_URL}${avatarUrl}` };
    }
    return { uri: DICEBEAR_FALLBACK };
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await api.logout();
            router.replace("/");
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root} testID="profile-screen">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headRow}>
          <Text style={styles.h1}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.card}>
          {avatarUrl ? (
            <Image source={getAvatarSource()} style={styles.avatar} />
          ) : (
            <SkeletonCircle size={56} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{userEmail || "Not signed in"}</Text>
            {userPhone ? (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={12} color={colors.textDim} />
                <Text style={styles.infoText}>{userPhone}</Text>
              </View>
            ) : null}
            {profileAddress ? (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={12} color={colors.textDim} />
                <Text style={styles.infoText} numberOfLines={1}>{profileAddress}</Text>
              </View>
            ) : null}
          </View>
          <SpringPress
            style={styles.editBtn}
            onPress={() => router.push("/profile-setup")}
            testID="edit-profile-button"
          >
            <Ionicons name="create-outline" size={16} color={colors.text} />
            <Text style={styles.editText}>Edit</Text>
          </SpringPress>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{tripCount}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalDistance} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>₹{totalSaved.toLocaleString("en-IN")}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.list}>
          {rows.map((row, i) => (
            <SpringPress
              key={row.label}
              style={[styles.row, i < rows.length - 1 && styles.rowDivider]}
              onPress={async () => {
                if (row.label === "Sign out") {
                  handleSignOut();
                } else if (row.route) {
                  router.push(row.route as any);
                }
              }}
            >
              <Ionicons name={row.icon} size={20} color={colors.textMuted} />
              <Text style={styles.rowLabel}>{row.label}</Text>
              {row.hint ? <Text style={styles.rowHint}>{row.hint}</Text> : null}
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </SpringPress>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginBottom: 20,
  },
  h1: { color: colors.text, fontSize: font.title, fontWeight: "600" },

  // Profile card
  card: {
    marginHorizontal: 20, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceAlt,
  },
  name: { color: colors.text, fontSize: 17, fontWeight: "600" },
  email: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  infoText: { color: colors.textDim, fontSize: font.caption, flex: 1 },
  editBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: spacing.md, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt,
  },
  editText: { color: colors.text, fontSize: font.small, fontWeight: "600" },

  // Stats
  statsRow: {
    flexDirection: "row", marginHorizontal: 20, marginTop: spacing.md, padding: spacing.md,
    borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { color: colors.text, fontSize: 16, fontWeight: "700" },
  statLabel: { color: colors.textMuted, fontSize: font.caption, marginTop: spacing.xs },
  statDivider: { width: 1, backgroundColor: colors.border },

  // Settings list
  list: {
    marginHorizontal: 20, marginTop: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, overflow: "hidden",
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: spacing.md, height: 52,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: "500" },
  rowHint: { color: colors.textDim, fontSize: font.small },
});
