import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius, font, spacing } from "@/src/theme";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";

const FAQ = [
  { q: "How do I book a ride?", a: "Tap 'Where to?' on the home screen, enter your pickup and drop locations, choose a vehicle, and confirm. Your driver will arrive within the estimated time." },
  { q: "Can I cancel a ride?", a: "Yes, you can cancel a ride before the driver arrives. Cancellations within 2 minutes of booking are free." },
  { q: "How is the fare calculated?", a: "Fares are based on distance, vehicle type, and any additional stops. The total is shown before you confirm the ride." },
  { q: "What payment methods are accepted?", a: "We accept UPI (Google Pay, PhonePe, Paytm), credit/debit cards, and cash payments." },
  { q: "Is the service available 24/7?", a: "Yes, Where2 operates 24 hours a day, 7 days a week in the Sakleshpura region." },
  { q: "How do I report an issue?", a: "Go to Profile > Help > Contact Support, or email us at support@where2.app. We respond within 24 hours." },
];

export default function Help() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
          <Text style={styles.h1}>Help</Text>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        {FAQ.map((item, i) => (
          <FadeIn key={i} delay={i * 60}>
            <SpringPress
              style={styles.faqCard}
              onPress={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <View style={styles.faqRow}>
                <Text style={styles.faqQ}>{item.q}</Text>
                <Ionicons
                  name={openIndex === i ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.textDim}
                />
              </View>
              {openIndex === i && (
                <Text style={styles.faqA}>{item.a}</Text>
              )}
            </SpringPress>
          </FadeIn>
        ))}

        <View style={styles.contactCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactSub}>Our support team is available 24/7</Text>
          </View>
          <SpringPress style={styles.contactBtn} onPress={() => Alert.alert("Contact Support", "Email us at support@where2.app or call +91 98765 43210")}>
            <Text style={styles.contactBtnText}>Contact us</Text>
          </SpringPress>
        </View>
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
  h1: { color: colors.text, fontSize: font.title, fontWeight: "600" },
  sectionTitle: { color: colors.textMuted, fontSize: font.small, fontWeight: "600", paddingHorizontal: 20, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
  faqCard: {
    marginHorizontal: 20, marginBottom: 10, padding: spacing.md, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  faqRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  faqQ: { color: colors.text, fontSize: font.body, fontWeight: "600", flex: 1, marginRight: 12 },
  faqA: { color: colors.textMuted, fontSize: font.label, lineHeight: 20, marginTop: 12 },
  contactCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: 20, marginTop: 20, padding: 18, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  contactTitle: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  contactSub: { color: colors.textMuted, fontSize: font.caption, marginTop: 2 },
  contactBtn: {
    paddingHorizontal: spacing.md, height: 36, borderRadius: 18, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  contactBtnText: { color: "#fff", fontSize: font.small, fontWeight: "600" },
});
