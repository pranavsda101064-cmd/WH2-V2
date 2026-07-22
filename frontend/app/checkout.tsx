import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius } from "@/src/theme";
import { api } from "@/src/api";
import { storage } from "@/src/utils/storage";

type PayMethod = "card" | "upi";

export default function Checkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [method, setMethod] = useState<PayMethod>("card");
  const [done, setDone] = useState(false);
  const [vehicleId, setVehicleId] = useState("v1");
  const [baseFare, setBaseFare] = useState(2199);

  useEffect(() => {
    (async () => {
      const v = await storage.getItem<string>("checkout_vehicle_id", "v1");
      const f = await storage.getItem<number>("checkout_fare", 2199);
      if (v) setVehicleId(v);
      if (f) setBaseFare(f);
    })();
  }, []);

  const base = baseFare;
  const stopsFee = 200;
  const gst = Math.round((base + stopsFee) * 0.05);
  const total = base + stopsFee + gst;

  const pay = async () => {
    setDone(true);
    const ride = await api.createRide({
      vehicle_id: vehicleId,
      stops: [
        { label: "Sakleshpura Bus Stand", sub: "Pickup point" },
        { label: "Manjarabad Fort", sub: "Stop 1" },
        { label: "Bisle Ghat Viewpoint", sub: "Final stop · 46 km" },
      ],
      fare: total,
      payment_method: method,
    });
    await storage.setItem("active_ride_id", ride.id);
    setTimeout(() => {
      router.replace("/ride");
    }, 1400);
  };

  if (done) {
    return (
      <View style={styles.done} testID="checkout-success">
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </View>
        <Text style={styles.doneTitle}>Ride confirmed</Text>
        <Text style={styles.doneSub}>Your driver will be there shortly</Text>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="checkout-screen">
      <StatusBar style="light" />

      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
          testID="checkout-back"
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Confirm & Pay</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 130,
          paddingHorizontal: 16,
        }}
      >
        {/* Route recap */}
        <View style={styles.card}>
          <Text style={styles.cardHead}>Trip</Text>
          <RouteRow
            first
            color="#fff"
            label="Sakleshpura Bus Stand"
            sub="Pickup point"
          />
          <RouteRow color={colors.textMuted} label="Manjarabad Fort" sub="Stop 1" />
          <RouteRow
            last
            color={colors.accent}
            label="Bisle Ghat Viewpoint"
            sub="Final stop · 46 km"
          />
        </View>

        {/* Vehicle */}
        <View style={styles.card}>
          <View style={styles.vehicleRow}>
            <View style={styles.vIcon}>
              <Ionicons name="car-outline" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vName}>Sedan · Comfortable</Text>
              <Text style={styles.vSub}>4 seats · 3 min away</Text>
            </View>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.change}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fare breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardHead}>Fare breakdown</Text>
          <FareRow label="Base fare" value={base} />
          <FareRow label="Multi-stop fee" value={stopsFee} />
          <FareRow label="Taxes & GST" value={gst} />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toLocaleString("en-IN")}</Text>
          </View>
        </View>

        {/* Payment method */}
        <Text style={styles.sectionTitle}>Payment method</Text>
        <View style={styles.methodRow}>
          <MethodBtn
            id="card"
            active={method === "card"}
            onPress={() => setMethod("card")}
            icon="card-outline"
            label="Card"
            sub="•••• 4421"
          />
          <MethodBtn
            id="upi"
            active={method === "upi"}
            onPress={() => setMethod("upi")}
            icon="qr-code-outline"
            label="UPI"
            sub="explorer@okhdfc"
          />
        </View>
        <Text style={styles.legal}>
          Card & UPI only. Cash payments are not accepted.
        </Text>
      </ScrollView>

      {/* Pay bar */}
      <View style={[styles.payBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.barLabel}>{method === "card" ? "Card •••• 4421" : "UPI · explorer@okhdfc"}</Text>
          <Text style={styles.barTotal}>₹{total.toLocaleString("en-IN")}</Text>
        </View>
        <TouchableOpacity
          style={styles.payBtn}
          onPress={pay}
          activeOpacity={0.85}
          testID="pay-button"
        >
          <Text style={styles.payText}>Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RouteRow({
  first,
  last,
  color,
  label,
  sub,
}: {
  first?: boolean;
  last?: boolean;
  color: string;
  label: string;
  sub: string;
}) {
  return (
    <View style={styles.routeRow}>
      <View style={styles.routeIndicator}>
        <View
          style={[
            styles.routeDot,
            {
              backgroundColor: color,
              borderRadius: last ? 3 : 6,
              width: last ? 12 : 10,
              height: last ? 12 : 10,
            },
          ]}
        />
        {!last && <View style={styles.routeLine} />}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 8, paddingTop: first ? 0 : 0 }}>
        <Text style={styles.routeLabel}>{label}</Text>
        <Text style={styles.routeSub}>{sub}</Text>
      </View>
    </View>
  );
}

function FareRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.fareRow}>
      <Text style={styles.fareLabel}>{label}</Text>
      <Text style={styles.fareValue}>₹{value.toLocaleString("en-IN")}</Text>
    </View>
  );
}

function MethodBtn({
  active,
  onPress,
  icon,
  label,
  sub,
  id,
}: {
  active: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  id: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.method, active && styles.methodActive]}
      onPress={onPress}
      activeOpacity={0.85}
      testID={`method-${id}`}
    >
      <View style={styles.methodIcon}>
        <Ionicons name={icon} size={20} color={active ? colors.accent : "#fff"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.methodLabel}>{label}</Text>
        <Text style={styles.methodSub}>{sub}</Text>
      </View>
      <View
        style={[styles.radio, active && styles.radioActive]}
      >
        {active && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  topTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  cardHead: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  routeRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  routeIndicator: { width: 12, alignItems: "center", paddingTop: 4 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: {
    width: 2,
    height: 26,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  routeLabel: { color: "#fff", fontSize: 14, fontWeight: "600" },
  routeSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  vehicleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  vIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  vName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  vSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  change: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  fareLabel: { color: colors.textMuted, fontSize: 13 },
  fareValue: { color: "#fff", fontSize: 13, fontWeight: "500" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { color: "#fff", fontSize: 15, fontWeight: "700" },
  totalValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 8,
    marginLeft: 4,
  },
  methodRow: { flexDirection: "column", gap: 10 },
  method: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodActive: { borderColor: colors.accent, borderWidth: 2, padding: 13 },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  methodLabel: { color: "#fff", fontSize: 15, fontWeight: "700" },
  methodSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: colors.accent },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  legal: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 12,
    marginLeft: 4,
  },
  payBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  barLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  barTotal: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 2 },
  payBtn: {
    height: 54,
    paddingHorizontal: 32,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  payText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  done: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  doneTitle: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  doneSub: { color: colors.textMuted, fontSize: 15, marginTop: 8, textAlign: "center" },
});
