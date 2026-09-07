import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius } from "@/src/theme";
import { api, getUserEmail, getUserName } from "@/src/api";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";

const rows: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  route?: string;
}[] = [
  { icon: "person-outline", label: "Personal information", route: "/profile-setup" },
  { icon: "card-outline", label: "Payments" },
  { icon: "location-outline", label: "Saved addresses", route: "/saved-addresses" },
  { icon: "notifications-outline", label: "Notifications", route: "/notifications" },
  { icon: "help-circle-outline", label: "Help", route: "/help" },
  { icon: "shield-checkmark-outline", label: "Privacy", route: "/privacy" },
  { icon: "log-out-outline", label: "Sign out" },
];

function AnimatedStat({ label, value, delay }: { label: string; value: string; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.stat}>
      <Animated.Text style={[styles.statValue, { opacity: anim }]}>
        {value}
      </Animated.Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headRow}>
          <Text style={styles.h1}>Profile</Text>
          <SpringPress style={styles.iconBtn} onPress={() => Alert.alert("Settings", "App settings coming soon!")}>
            <Ionicons name="settings-outline" size={18} color="#fff" />
          </SpringPress>
        </View>

        <FadeIn delay={50}>
          <View style={styles.card}>
            <Image source={getAvatarSource()} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.phone}>{userEmail || "Not signed in"}</Text>
              {profileAddress ? (
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={12} color={colors.textDim} />
                  <Text style={styles.addressText} numberOfLines={1}>{profileAddress}</Text>
                </View>
              ) : null}
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.rating}>4.92 rider rating</Text>
              </View>
            </View>
            <SpringPress
              style={styles.editBtn}
              onPress={() => router.push("/profile-setup")}
              testID="edit-profile-button"
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.editText}>Edit</Text>
            </SpringPress>
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <View style={styles.statsRow}>
            <AnimatedStat label="Trips" value={String(tripCount)} delay={150} />
            <View style={styles.statDivider} />
            <AnimatedStat label="Distance" value={`${totalDistance} km`} delay={250} />
            <View style={styles.statDivider} />
            <AnimatedStat label="Saved" value={`₹${totalSaved.toLocaleString("en-IN")}`} delay={350} />
          </View>
        </FadeIn>

        <FadeIn delay={150}>
          <View style={styles.list}>
            {rows.map((row, i) => (
              <SpringPress
                key={row.label}
                style={[styles.row, i < rows.length - 1 && styles.rowDivider]}
                onPress={async () => {
                  if (row.label === "Sign out") {
                    await api.logout();
                    router.replace("/");
                  } else if (row.route) {
                    router.push(row.route as any);
                  }
                }}
              >
                <Ionicons name={row.icon} size={20} color="#fff" />
                <Text style={styles.rowLabel}>{row.label}</Text>
                {row.hint && <Text style={styles.rowHint}>{row.hint}</Text>}
                <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
              </SpringPress>
            ))}
          </View>
        </FadeIn>
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
  h1: { color: "#fff", fontSize: 28, fontWeight: "800" },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  card: {
    marginHorizontal: 20, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceAlt,
  },
  name: { color: "#fff", fontSize: 17, fontWeight: "700" },
  phone: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  addressText: { color: colors.textDim, fontSize: 12, flex: 1 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rating: { color: colors.textMuted, fontSize: 12 },
  editBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.06)",
  },
  editText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  statsRow: {
    flexDirection: "row", marginHorizontal: 20, marginTop: 16, padding: 16,
    borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: colors.border },
  list: {
    marginHorizontal: 20, marginTop: 16, borderRadius: radius.lg, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, overflow: "hidden",
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, height: 52,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "500" },
  rowHint: { color: colors.textDim, fontSize: 13 },
});
