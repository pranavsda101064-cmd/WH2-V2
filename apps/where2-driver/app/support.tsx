import { useState } from "react";
import { useRouter } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";
import { SectionHeader } from "@/src/components/ui";

const FAQS = [
  {
    q: "How do I receive ride requests?",
    a: "Go online from the dashboard toggle. New requests appear instantly with a 30-second countdown — accept before it expires.",
  },
  {
    q: "When do I get paid?",
    a: "Trip fares add to your wallet balance on completion. Withdraw to your registered bank account anytime from the Wallet screen.",
  },
  {
    q: "How do document verifications work?",
    a: "Upload clear photos of your license, Aadhaar, RC and permits during onboarding. Our admin team reviews them — usually within 24 hours.",
  },
  {
    q: "What if a rider doesn't show up?",
    a: "Wait 5 minutes at the pickup point, then decline the ride from the ride screen. You won't be penalized.",
  },
  {
    q: "How is my rating calculated?",
    a: "Riders rate each trip 1–5 stars. Your profile shows the running average across all completed trips.",
  },
];

export default function Support() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <View style={x.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={0}>
          <View style={x.header}>
            <SpringPress style={x.iconBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </SpringPress>
            <View style={{ flex: 1 }}>
              <Text style={x.kicker}>WE&apos;RE HERE TO HELP</Text>
              <Text style={x.title}>Support Center</Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <View style={x.helpCard}>
            <View style={x.helpIcon}>
              <Ionicons name="headset-outline" size={28} color="#fff" />
            </View>
            <Text style={x.helpTitle}>Talk to us</Text>
            <Text style={x.helpSub}>Driver helpline · 8am – 10pm IST</Text>
            <View style={x.helpActions}>
              <SpringPress
                style={x.helpBtnLight}
                onPress={() => Linking.openURL("tel:112")}
                testID="support-call"
              >
                <Ionicons name="call-outline" size={16} color={colors.accentDim} />
                <Text style={x.helpBtnLightText}>Call</Text>
              </SpringPress>
              <SpringPress
                style={x.helpBtnSolid}
                onPress={() => Linking.openURL("mailto:support@where2.app?subject=Driver%20support")}
                testID="support-email"
              >
                <Ionicons name="mail-outline" size={16} color="#fff" />
                <Text style={x.helpBtnSolidText}>Email</Text>
              </SpringPress>
            </View>
          </View>
        </FadeIn>

        <SectionHeader title="FAQs" right={`${FAQS.length} topics`} />

        <View style={x.faqList}>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <FadeIn key={f.q} delay={Math.min(i * 60, 240)}>
                <SpringPress style={x.faq} onPress={() => setOpen(isOpen ? null : i)}>
                  <View style={x.faqRow}>
                    <Text style={x.faqQ}>{f.q}</Text>
                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={colors.textDim}
                    />
                  </View>
                  {isOpen ? <Text style={x.faqA}>{f.a}</Text> : null}
                </SpringPress>
              </FadeIn>
            );
          })}
        </View>

        <FadeIn delay={200}>
          <Text style={x.version}>Where2 Driver · v1.0.0 · Sakleshpura, Karnataka</Text>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const x = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  kicker: { color: colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 2 },
  helpCard: {
    marginHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    padding: spacing.md,
    alignItems: "center",
    ...shadows.glow(colors.accentGlow),
  },
  helpIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  helpTitle: { color: "#fff", fontSize: font.h3, fontWeight: "800", marginTop: 10 },
  helpSub: { color: "rgba(255,255,255,0.75)", fontSize: font.small, marginTop: 2 },
  helpActions: { flexDirection: "row", gap: 8, marginTop: 14, width: "100%" },
  helpBtnLight: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  helpBtnLightText: { color: colors.accentDim, fontSize: font.label, fontWeight: "800" },
  helpBtnSolid: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  helpBtnSolidText: { color: "#fff", fontSize: font.label, fontWeight: "800" },
  faqList: { paddingHorizontal: 16, marginTop: 4, gap: 8 },
  faq: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  faqRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  faqQ: { flex: 1, color: colors.text, fontSize: font.label, fontWeight: "700" },
  faqA: { color: colors.textMuted, fontSize: font.small, lineHeight: 20, marginTop: 8 },
  version: {
    color: colors.textDim,
    fontSize: font.caption,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
