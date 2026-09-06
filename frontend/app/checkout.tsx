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
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { MapView, Marker, Polyline, PROVIDER_DEFAULT, MapPlaceholder } from "@/src/components/map-view";

import { colors, radius } from "@/src/theme";
import { api } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { LoadingScreen } from "@/src/components/loading";

type PayMethod = "card" | "upi";

type LocationData = { lat: number; lng: number; label: string };

const DEFAULT_PICKUP = "Sakleshpura Bus Stand";
const DEFAULT_DROPOFF = "Bisle Ghat Viewpoint";

export default function Checkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [method, setMethod] = useState<PayMethod>("card");
  const [done, setDone] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [vehicleId, setVehicleId] = useState("v1");
  const [baseFare, setBaseFare] = useState(2199);
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [dropoff, setDropoff] = useState<LocationData | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  useEffect(() => {
    (async () => {
      const v = await storage.getItem<string>("checkout_vehicle_id", "v1");
      const f = await storage.getItem<number>("checkout_fare", 2199);
      const pRaw = await storage.getItem<string | null>("pickup_location", null);
      const dRaw = await storage.getItem<string | null>("dropoff_location", null);
      if (v) setVehicleId(v);
      if (f) setBaseFare(f);
      if (pRaw) setPickup(JSON.parse(pRaw));
      if (dRaw) setDropoff(JSON.parse(dRaw));
    })();
  }, []);

  useEffect(() => {
    if (pickup && dropoff) {
      const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`;
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (data.routes?.[0]?.geometry?.coordinates) {
            setRouteCoords(
              data.routes[0].geometry.coordinates.map((c: [number, number]) => ({
                latitude: c[1],
                longitude: c[0],
              })),
            );
          }
        })
        .catch(() => {});
    }
  }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng]);

  const pickupLabel = pickup?.label || DEFAULT_PICKUP;
  const dropoffLabel = dropoff?.label || DEFAULT_DROPOFF;
  const base = baseFare;
  const stopsFee = 200;
  const gst = Math.round((base + stopsFee) * 0.05);
  const total = base + stopsFee + gst;

  const pay = async () => {
    setPaying(true);
    setError("");
    try {
      const stops = [
        { label: pickupLabel, sub: "Pickup point", lat: pickup?.lat ?? undefined, lng: pickup?.lng ?? undefined },
        { label: dropoffLabel, sub: "Drop-off", lat: dropoff?.lat ?? undefined, lng: dropoff?.lng ?? undefined },
      ];
      const ride = await api.createRide({
        vehicle_id: vehicleId,
        stops,
        fare: total,
        payment_method: method,
      });
      await storage.setItem("active_ride_id", ride.id);
      await storage.removeItem("pickup_location");
      await storage.removeItem("dropoff_location");
      setDone(true);
      setTimeout(() => router.replace("/ride"), 1400);
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
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
        {/* Mini route map */}
        {pickup && dropoff && (
          <View style={styles.miniMapContainer}>
            {Platform.OS !== "web" && MapView ? (
              <MapView
                style={styles.miniMap}
                provider={PROVIDER_DEFAULT}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                initialRegion={{
                  latitude: (pickup.lat + dropoff.lat) / 2,
                  longitude: (pickup.lng + dropoff.lng) / 2,
                  latitudeDelta: Math.abs(pickup.lat - dropoff.lat) * 2.5 || 0.05,
                  longitudeDelta: Math.abs(pickup.lng - dropoff.lng) * 2.5 || 0.05,
                }}
              >
                <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} pinColor={colors.accent} />
                <Marker coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }} pinColor={colors.danger} />
                {routeCoords.length > 0 && (
                  <Polyline coordinates={routeCoords} strokeColor={colors.accent} strokeWidth={3} />
                )}
              </MapView>
            ) : (
              <MapPlaceholder style={styles.miniMap} />
            )}
          </View>
        )}

        {/* Route recap */}
        <View style={styles.card}>
          <Text style={styles.cardHead}>Trip</Text>
          <TouchableOpacity onPress={() => router.push("/location-picker?target=pickup")}>
            <RouteRow
              first
              color="#fff"
              label={pickupLabel}
              sub={pickup ? "GPS location set" : "Tap to set pickup"}
              editable
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/location-picker?target=dropoff")}>
            <RouteRow
              last
              color={colors.accent}
              label={dropoffLabel}
              sub={dropoff ? "GPS location set" : "Tap to set drop-off"}
              editable
            />
          </TouchableOpacity>
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
        {error ? (
          <Text style={{ color: colors.danger, fontSize: 13, marginTop: 8, marginLeft: 4 }}>{error}</Text>
        ) : null}
      </ScrollView>

      {/* Pay bar */}
      <View style={[styles.payBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.barLabel}>{method === "card" ? "Card •••• 4421" : "UPI · explorer@okhdfc"}</Text>
          <Text style={styles.barTotal}>₹{total.toLocaleString("en-IN")}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, paying && { opacity: 0.6 }]}
          onPress={pay}
          activeOpacity={0.85}
          disabled={paying}
          testID="pay-button"
        >
          <Text style={styles.payText}>{paying ? "Processing..." : "Pay"}</Text>
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
  editable,
}: {
  first?: boolean;
  last?: boolean;
  color: string;
  label: string;
  sub: string;
  editable?: boolean;
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
      {editable && (
        <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
      )}
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
  miniMapContainer: {
    height: 180,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniMap: { flex: 1 },
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
