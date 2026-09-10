import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { api, Vehicle } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { LoadingScreen } from "@/src/components/loading";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";

export default function Vehicles() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<string>("v1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listVehicles()
      .then((v) => {
        setVehicles(v);
        if (v[0]) setSelected(v[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chosen = vehicles.find((v) => v.id === selected);

  const proceed = async () => {
    if (!chosen) return;
    await storage.setItem("checkout_vehicle_id", chosen.id);
    await storage.setItem("checkout_fare", chosen.fare);
    router.push("/checkout");
  };

  if (loading) return <LoadingScreen message="Loading vehicles..." />;

  return (
    <View style={styles.root} testID="vehicles-screen">
      <StatusBar style="light" />
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <SpringPress
          style={styles.iconBtn}
          onPress={() => router.back()}
          testID="vehicles-back"
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </SpringPress>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.topKicker}>3 stops · 46 km</Text>
          <Text style={styles.topTitle}>Choose a ride</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 140,
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
      >
        {vehicles.map((v, index) => {
          const isActive = v.id === selected;
          return (
            <FadeIn key={v.id} delay={index * 80}>
              <SpringPress
                style={[styles.card, isActive && styles.cardActive]}
                onPress={() => setSelected(v.id)}
                testID={`vehicle-${v.id}`}
              >
                <View style={[styles.vIcon, isActive && styles.vIconActive]}>
                  <Ionicons
                    name={v.icon}
                    size={26}
                    color={isActive ? colors.accent : colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.vName}>{v.name}</Text>
                    <Ionicons name="person" size={11} color={colors.textMuted} />
                    <Text style={styles.vSeats}>{v.seats}</Text>
                  </View>
                  <Text style={styles.vDesc}>{v.desc}</Text>
                  <Text style={styles.vEta}>Arrives in {v.eta}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.vFare}>
                    ₹{v.fare.toLocaleString("en-IN")}
                  </Text>
                  <Text style={styles.vFareSub}>est. fare</Text>
                </View>
              </SpringPress>
            </FadeIn>
          );
        })}
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.barLabel}>
            {chosen ? `${chosen.name} · Cash-free` : "Loading…"}
          </Text>
          <Text style={styles.barFare}>
            {chosen ? `₹${chosen.fare.toLocaleString("en-IN")}` : "—"}
          </Text>
        </View>
        <SpringPress
          style={styles.barBtn}
          onPress={proceed}
          testID="vehicles-continue-button"
        >
          <Text style={styles.barBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </SpringPress>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  topKicker: {
    color: colors.textMuted, fontSize: font.micro, fontWeight: "700",
    letterSpacing: 1.4, textTransform: "uppercase",
  },
  topTitle: { color: colors.text, fontSize: font.subtitle, fontWeight: "700", marginTop: 2 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, marginBottom: 10,
  },
  cardActive: {
    borderColor: colors.accent, borderWidth: 2, padding: 15,
    backgroundColor: "rgba(0,137,123,0.04)",
  },
  vIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surfaceAlt,
    alignItems: "center", justifyContent: "center",
  },
  vIconActive: { backgroundColor: "rgba(0,137,123,0.14)" },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  vName: { color: colors.text, fontSize: font.subtitle, fontWeight: "700", marginRight: 4 },
  vSeats: { color: colors.textMuted, fontSize: font.caption },
  vDesc: { color: colors.textMuted, fontSize: font.caption, marginTop: 2 },
  vEta: { color: colors.text, fontSize: font.micro, marginTop: 4, opacity: 0.7 },
  vFare: { color: colors.text, fontSize: font.subtitle, fontWeight: "700" },
  vFareSub: { color: colors.textDim, fontSize: 10, marginTop: 2 },
  bottomBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.md, paddingTop: 14, flexDirection: "row", alignItems: "center", gap: 12,
  },
  barLabel: { color: colors.textMuted, fontSize: font.micro, fontWeight: "600" },
  barFare: { color: colors.text, fontSize: font.title, fontWeight: "800", marginTop: 2 },
  barBtn: {
    height: 52, paddingHorizontal: 20, borderRadius: radius.md, backgroundColor: colors.accent,
    flexDirection: "row", alignItems: "center", gap: 8,
    ...shadows.accent,
  },
  barBtnText: { color: "#fff", fontSize: font.body, fontWeight: "700" },
});
