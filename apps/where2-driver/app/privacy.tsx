import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius } from "@/src/theme";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";

const SECTIONS = [
  {
    title: "Information We Collect",
    body: "When you use Where2, we collect your name, email, phone number, and location data to provide ride services. Drivers also provide vehicle and document information for verification.",
  },
  {
    title: "How We Use Your Information",
    body: "Your information is used to connect riders with drivers, calculate fares, ensure safety during rides, and improve our services. Location data is used for real-time ride tracking and route optimization.",
  },
  {
    title: "Data Sharing",
    body: "We share your pickup/drop location and name with your assigned driver only during an active ride. We do not sell your personal data to third parties.",
  },
  {
    title: "Data Security",
    body: "All data is encrypted in transit and at rest. We use industry-standard security measures to protect your personal information from unauthorized access.",
  },
  {
    title: "Location Tracking",
    body: "Location data is collected during active rides for safety and tracking purposes. Background location is not tracked when no ride is active.",
  },
  {
    title: "Your Rights",
    body: "You can request access to your data, update your profile information, or request deletion of your account at any time by contacting support@where2.app.",
  },
  {
    title: "Contact Us",
    body: "For privacy-related inquiries, email us at privacy@where2.app or reach out through the Help section in the app.",
  },
];

export default function Privacy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headRow}>
          <SpringPress style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </SpringPress>
          <Text style={styles.h1}>Privacy Policy</Text>
        </View>

        <FadeIn delay={50}>
          <Text style={styles.updated}>Last updated: September 2026</Text>
        </FadeIn>

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
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 16, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  h1: { color: colors.text, fontSize: 22, fontWeight: "800" },
  updated: { color: colors.textDim, fontSize: 12, paddingHorizontal: 20, marginBottom: 20 },
  card: {
    marginHorizontal: 20, marginBottom: 12, padding: 18, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 8 },
  cardBody: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
});
