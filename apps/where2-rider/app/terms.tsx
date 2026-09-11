import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius, font, spacing } from "@/src/theme";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";

const SECTIONS = [
  {
    title: "Acceptance of Terms",
    body: "By accessing or using Where2, you agree to be bound by these Terms of Service. If you do not agree, do not use the application.",
  },
  {
    title: "Service Description",
    body: "Where2 is a tourist ride-hailing platform operating in Sakleshpura, Karnataka, India. We connect riders with local drivers for point-to-point transportation services.",
  },
  {
    title: "User Responsibilities",
    body: "You must provide accurate information during registration. Drivers must maintain valid licenses and vehicle documentation. Riders must treat drivers with respect and pay the agreed fare.",
  },
  {
    title: "Payments",
    body: "Fares are displayed before ride confirmation. Payment can be made via cash, card, or UPI as selected during checkout. Tips are optional and at your discretion.",
  },
  {
    title: "Safety",
    body: "Where2 provides safety features including ride PIN verification, trip sharing, and SOS alerts. However, we cannot guarantee your safety. Always exercise caution.",
  },
  {
    title: "Cancellation",
    body: "Riders may cancel a ride before the driver arrives. Drivers may decline ride requests. Repeated cancellations may result in account restrictions.",
  },
  {
    title: "Limitation of Liability",
    body: "Where2 acts as a platform connecting riders and drivers. We are not liable for the actions of drivers or riders during a ride. Our liability is limited to the service fee charged.",
  },
  {
    title: "Changes to Terms",
    body: "We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.",
  },
  {
    title: "Contact Us",
    body: "For questions about these Terms, contact us at support@where2.app or through the Help section in the app.",
  },
];

export default function Terms() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headRow}>
          <SpringPress style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </SpringPress>
          <Text style={styles.h1}>Terms of Service</Text>
        </View>

        <Text style={styles.updated}>Last updated: September 2026</Text>

        {SECTIONS.map((s, i) => (
          <FadeIn key={i} delay={i * 60}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <Text style={styles.cardBody}>{s.body}</Text>
            </View>
          </FadeIn>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: spacing.md, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  h1: { color: colors.text, fontSize: font.title, fontWeight: "600" },
  updated: { color: colors.textDim, fontSize: font.caption, paddingHorizontal: 20, marginBottom: 20 },
  card: {
    marginHorizontal: 20, marginBottom: 12, padding: 18, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { color: colors.text, fontSize: font.subtitle, fontWeight: "700", marginBottom: spacing.sm },
  cardBody: { color: colors.textMuted, fontSize: font.label, lineHeight: 21 },
});
