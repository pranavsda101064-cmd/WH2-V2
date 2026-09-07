import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius } from "@/src/theme";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";

const MOCK_NOTIFICATIONS = [
  { id: "n1", icon: "checkmark-circle" as const, title: "Ride confirmed", desc: "Your ride to Bisle Ghat is confirmed. Driver Ravi is on the way.", time: "2 min ago", read: false },
  { id: "n2", icon: "wallet" as const, title: "Payment received", desc: "₹2,499 charged to your UPI for the Estate Tour ride.", time: "1 hr ago", read: false },
  { id: "n3", icon: "star" as const, title: "Rate your ride", desc: "How was your trip to Manjarabad Fort? Tap to rate.", time: "Yesterday", read: true },
  { id: "n4", icon: "gift" as const, title: "Refer & earn", desc: "Invite a friend and get ₹200 off your next ride.", time: "2 days ago", read: true },
  { id: "n5", icon: "alert-circle" as const, title: "Schedule update", desc: "Monsoon season: Bisle Ghat routes may have delays.", time: "3 days ago", read: true },
  { id: "n6", icon: "shield-checkmark" as const, title: "Safety update", desc: "Your trip to Sakleshpura Lake was tracked successfully.", time: "1 week ago", read: true },
];

export default function Notifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState(MOCK_NOTIFICATIONS);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headRow}>
          <SpringPress style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </SpringPress>
          <Text style={styles.h1}>Notifications</Text>
          <SpringPress
            style={styles.markBtn}
            onPress={() => setItems(items.map((n) => ({ ...n, read: true })))}
          >
            <Text style={styles.markText}>Mark all read</Text>
          </SpringPress>
        </View>

        {items.map((n, i) => (
          <FadeIn key={n.id} delay={i * 60}>
            <SpringPress
              style={[styles.card, !n.read && styles.cardUnread]}
              onPress={() => setItems(items.map((x) => x.id === n.id ? { ...x, read: true } : x))}
            >
              <View style={[styles.iconWrap, !n.read && styles.iconWrapUnread]}>
                <Ionicons name={n.icon} size={20} color={!n.read ? "#fff" : colors.textDim} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{n.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{n.desc}</Text>
                <Text style={styles.cardTime}>{n.time}</Text>
              </View>
              {!n.read && <View style={styles.unreadDot} />}
            </SpringPress>
          </FadeIn>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 20, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  h1: { flex: 1, color: "#fff", fontSize: 22, fontWeight: "800" },
  markBtn: { paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  markText: { color: colors.accent, fontSize: 12, fontWeight: "600" },
  card: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    marginHorizontal: 20, marginBottom: 10, padding: 16, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  cardUnread: { borderColor: "rgba(30,107,255,0.3)", backgroundColor: "rgba(30,107,255,0.06)" },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt,
    alignItems: "center", justifyContent: "center",
  },
  iconWrapUnread: { backgroundColor: colors.accent },
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  cardDesc: { color: colors.textMuted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  cardTime: { color: colors.textDim, fontSize: 11, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 4 },
});
