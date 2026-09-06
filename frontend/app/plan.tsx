import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius } from "@/src/theme";
import { MapView, Marker, Polyline, PROVIDER_DEFAULT, MapPlaceholder } from "@/src/components/map-view";

const MAP_H_RATIO = 0.32;

type Stop = { id: string; label: string; sub: string; lat?: number; lng?: number };

const initial: Stop[] = [
  { id: "s1", label: "Sakleshpura Bus Stand", sub: "Pickup point", lat: 12.9664, lng: 75.7818 },
  { id: "s2", label: "Manjarabad Fort", sub: "Stop 1 · 12 km", lat: 12.9353, lng: 75.8029 },
  { id: "s3", label: "Bisle Ghat Viewpoint", sub: "Stop 2 · 34 km", lat: 12.9784, lng: 76.0541 },
];

export default function Plan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stops, setStops] = useState<Stop[]>(initial);
  const [input, setInput] = useState("");
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  useEffect(() => {
    const valid = stops.filter((s) => s.lat && s.lng);
    if (valid.length < 2) return;
    const coords = valid.map((s) => `${s.lng},${s.lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
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
  }, [stops]);

  const addStop = () => {
    if (!input.trim()) return;
    setStops([
      ...stops,
      {
        id: "s" + Date.now(),
        label: input.trim(),
        sub: `Stop ${stops.length} · added`,
      },
    ]);
    setInput("");
  };

  const removeStop = (id: string) => setStops(stops.filter((s) => s.id !== id));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= stops.length) return;
    const next = [...stops];
    [next[i], next[j]] = [next[j], next[i]];
    setStops(next);
  };

  const validStops = stops.filter((s) => s.lat && s.lng);
  const centerLat = validStops.length > 0 ? validStops.reduce((a, s) => a + s.lat!, 0) / validStops.length : 12.96;
  const centerLng = validStops.length > 0 ? validStops.reduce((a, s) => a + s.lng!, 0) / validStops.length : 75.78;

  return (
    <View style={styles.root} testID="plan-screen">
      <StatusBar style="light" />

      {/* Map */}
      <View style={[styles.map, { height: Math.round(400 * MAP_H_RATIO) + insets.top }]}>
        {Platform.OS !== "web" && MapView ? (
          <MapView
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: centerLat,
              longitude: centerLng,
              latitudeDelta: 0.15,
              longitudeDelta: 0.15,
            }}
          >
            {validStops.map((s, i) => (
              <Marker
                key={s.id}
                coordinate={{ latitude: s.lat!, longitude: s.lng! }}
                pinColor={i === 0 ? "#fff" : i === validStops.length - 1 ? colors.accent : colors.danger}
                title={s.label}
              />
            ))}
            {routeCoords.length > 0 && (
              <Polyline coordinates={routeCoords} strokeColor={colors.accent} strokeWidth={3} />
            )}
          </MapView>
        ) : (
          <MapPlaceholder style={StyleSheet.absoluteFill} />
        )}

        <View style={[styles.mapTop, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.mapIcon}
            onPress={() => router.back()}
            testID="plan-back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.mapChip}>
            <Ionicons name="locate" size={12} color={colors.accent} />
            <Text style={styles.mapChipText}>Sakleshpura, KA</Text>
          </View>
          <TouchableOpacity style={styles.mapIcon}>
            <Ionicons name="layers-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grabber} />
          <Text style={styles.title}>Plan your trip</Text>
          <Text style={styles.subtitle}>Add stops in the order you want to visit</Text>

          {/* Destination input */}
          <View style={styles.inputRow}>
            <View style={styles.inputBox}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Paste map link or type a place"
                placeholderTextColor={colors.textDim}
                style={styles.inputText}
                returnKeyType="done"
                onSubmitEditing={addStop}
                testID="destination-input"
              />
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={addStop}
              testID="add-stop-button"
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Stops list */}
          <View style={styles.stopsList}>
            {stops.map((s, i) => (
              <View
                key={s.id}
                style={[
                  styles.stopRow,
                  i < stops.length - 1 && styles.stopDivider,
                ]}
                testID={`stop-row-${s.id}`}
              >
                <View style={styles.stopIndicator}>
                  <View
                    style={[
                      styles.stopDot,
                      i === 0 && styles.stopDotFirst,
                      i === stops.length - 1 && styles.stopDotLast,
                    ]}
                  />
                  {i < stops.length - 1 && <View style={styles.stopLine} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stopLabel} numberOfLines={1}>{s.label}</Text>
                  <Text style={styles.stopSub}>{s.sub}</Text>
                </View>
                <View style={styles.stopActions}>
                  <TouchableOpacity
                    onPress={() => move(i, -1)}
                    style={styles.stopAction}
                    disabled={i === 0}
                    testID={`stop-up-${s.id}`}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={16}
                      color={i === 0 ? colors.textDim : "#fff"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => move(i, 1)}
                    style={styles.stopAction}
                    disabled={i === stops.length - 1}
                    testID={`stop-down-${s.id}`}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={i === stops.length - 1 ? colors.textDim : "#fff"}
                    />
                  </TouchableOpacity>
                  {stops.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeStop(s.id)}
                      style={styles.stopAction}
                      testID={`stop-remove-${s.id}`}
                    >
                      <Ionicons name="close" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => router.push("/vehicles")}
            testID="confirm-stops-button"
            activeOpacity={0.85}
          >
            <Text style={styles.confirmText}>Choose vehicle</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  map: {
    backgroundColor: "#0E1013",
    width: "100%",
    overflow: "hidden",
  },
  mapTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mapIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  mapChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapChipText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
    marginTop: -14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 14,
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 18 },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  inputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  inputText: { flex: 1, color: "#fff", fontSize: 14 },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  stopsList: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  stopDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  stopIndicator: {
    width: 20,
    alignItems: "center",
  },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  stopDotFirst: { backgroundColor: "#fff" },
  stopDotLast: { backgroundColor: colors.accent },
  stopLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: colors.border,
    marginTop: 2,
  },
  stopLabel: { color: "#fff", fontSize: 15, fontWeight: "600" },
  stopSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  stopActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  stopAction: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  confirmBtn: {
    marginTop: 20,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
