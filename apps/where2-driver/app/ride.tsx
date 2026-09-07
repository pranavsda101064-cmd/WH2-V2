import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius } from "@/src/theme";
import { api, Ride as RideType, RideStop } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { LoadingScreen } from "@/src/components/loading";
import { MapView, Marker, PROVIDER_DEFAULT, MapPlaceholder } from "@/src/components/map-view";

const POLL_INTERVAL = 5000;
const MAP_HEIGHT = "52%";

export default function Ride() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ride, setRide] = useState<RideType | null>(null);
  const [driverLoc, setDriverLoc] = useState<{
    lat: number | null;
    lng: number | null;
  }>({ lat: null, lng: null });
  const [loading, setLoading] = useState(true);
  const [showPin, setShowPin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const pulse = useRef(new Animated.Value(0)).current;
  const rideIdRef = useRef<string | null>(null);

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [pulse]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rideId = await storage.getItem<string>("active_ride_id", "");
        if (!rideId || cancelled) return;
        rideIdRef.current = rideId;

        const r = await api.getRide(rideId);
        if (!cancelled) {
          setRide(r);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!rideIdRef.current) return;

    const poll = setInterval(async () => {
      try {
        const [r, loc] = await Promise.all([
          api.getRide(rideIdRef.current!),
          api.getDriverLocation(rideIdRef.current!),
        ]);
        setRide(r);
        if (loc.lat && loc.lng) {
          setDriverLoc({ lat: loc.lat, lng: loc.lng });
        }
      } catch {
        // silent
      }
    }, POLL_INTERVAL);

    return () => clearInterval(poll);
  }, [rideIdRef.current]);

  const handleVerifyPin = async () => {
    if (!rideIdRef.current || pinInput.length !== 4) return;
    setPinError("");
    try {
      await api.verifyRidePin(rideIdRef.current, pinInput);
      setShowPin(false);
      setRide((prev) => (prev ? { ...prev, status: "onboard" } : prev));
    } catch {
      setPinError("Invalid PIN. Try again.");
    }
  };

  const handleShare = async () => {
    if (!ride) return;
    try {
      await Share.share({
        message: `Track my Where2 ride: https://where2-wdu6.onrender.com/api/rides/${ride.id}/share`,
      });
    } catch {}
  };

  const handleSOS = () => {
    Linking.openURL("tel:112");
  };

  if (loading) return <LoadingScreen />;

  const stops: RideStop[] = ride?.stops || [];
  const status = ride?.status || "arriving";

  const statusLabel =
    status === "arriving"
      ? "Driver is on the way"
      : status === "onboard"
        ? "On the way to your destination"
        : status === "arrived"
          ? "You've arrived"
          : status === "completed"
            ? "Ride complete"
            : "Ride";

  const pickup = stops[0];
  const drop = stops[stops.length - 1];

  return (
    <View style={styles.root} testID="ride-screen">
      <StatusBar style="light" />

      {/* Map area */}
      <View style={styles.map}>
        {Platform.OS !== "web" && MapView && pickup && drop ? (
          <MapView
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: pickup.lat ?? 12.94,
              longitude: pickup.lng ?? 75.77,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            showsUserLocation={false}
          >
            {pickup.lat && pickup.lng && (
              <Marker
                coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
                pinColor={colors.accent}
                title="Pickup"
              />
            )}
            {drop.lat && drop.lng && (
              <Marker
                coordinate={{ latitude: drop.lat, longitude: drop.lng }}
                pinColor={colors.danger}
                title="Drop-off"
              />
            )}
            {driverLoc.lat && driverLoc.lng && (
              <Marker
                coordinate={{ latitude: driverLoc.lat, longitude: driverLoc.lng }}
                title="Driver"
              >
                <View style={styles.driverMarker}>
                  <Ionicons name="car-sport" size={16} color="#fff" />
                </View>
              </Marker>
            )}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="location" size={32} color={colors.accent} />
            <Text style={styles.mapPlaceholderText}>
              {driverLoc.lat
                ? `Driver at ${driverLoc.lat.toFixed(4)}, ${driverLoc.lng?.toFixed(4)}`
                : "Waiting for driver location..."}
            </Text>
          </View>
        )}

        <View style={[styles.mapTop, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.mapIcon}
            onPress={() => router.back()}
            testID="ride-back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.etaPill}>
            <View style={styles.etaDot} />
            <Text style={styles.etaText}>
              {status === "arriving" ? "DRIVER ON THE WAY" : status === "onboard" ? "IN TRANSIT" : status.toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity style={styles.mapIcon} onPress={handleShare} testID="ride-share">
            <Ionicons name="share-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sheet */}
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grabber} />

        <Text style={styles.kicker}>{statusLabel.toUpperCase()}</Text>

        {pickup && drop && (
          <Text style={styles.headline}>
            {pickup.label} → {drop.label}
          </Text>
        )}

        {/* Ride PIN display (rider sees this when arriving) */}
        {status === "arriving" && ride?.ride_pin && (
          <TouchableOpacity
            style={styles.pinCard}
            onPress={() => setShowPin(!showPin)}
          >
            <Ionicons name="key-outline" size={18} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pinLabel}>Your ride PIN</Text>
              <Text style={styles.pinValue}>{showPin ? ride.ride_pin : "••••"}</Text>
            </View>
            <Text style={styles.pinHint}>Tap to {showPin ? "hide" : "reveal"}</Text>
          </TouchableOpacity>
        )}

        {/* PIN input for driver */}
        {status === "arriving" && showPin && (
          <View style={styles.pinInputGroup}>
            <Text style={styles.pinInputLabel}>Enter rider's PIN to start ride:</Text>
            <View style={styles.pinInputRow}>
              {[0, 1, 2, 3].map((i) => (
                <Pressable
                  key={i}
                  style={[
                    styles.pinDigit,
                    pinInput[i] && styles.pinDigitFilled,
                  ]}
                  onPress={() => {
                    // Simple: clear and re-enter
                    setPinInput("");
                    setPinError("");
                  }}
                >
                  <Text style={styles.pinDigitText}>
                    {pinInput[i] || "•"}
                  </Text>
                </Pressable>
              ))}
            </View>
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <TouchableOpacity
              style={styles.pinSubmitBtn}
              onPress={handleVerifyPin}
            >
              <Text style={styles.pinSubmitText}>Start Ride</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Driver card */}
        <View style={styles.driverCard}>
          <View style={styles.driverPhoto}>
            <Ionicons name="person" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>Driver</Text>
            <View style={styles.driverMeta}>
              <Ionicons name="car-sport" size={12} color="#fff" />
              <Text style={styles.driverPlate}>{ride?.vehicle_id || "—"}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actBtn} testID="ride-message">
              <Ionicons name="chatbubble-outline" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actBtn, styles.actBtnAccent]}
              onPress={handleSOS}
              testID="ride-sos"
            >
              <Ionicons name="alert-circle" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Trip progress */}
        <View style={styles.progressRow}>
          {stops.map((stop, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", flex: i === stops.length - 1 ? 0 : 1 }}>
              <View
                style={[
                  styles.progStep,
                  status === "onboard" || status === "arrived" || status === "completed"
                    ? styles.progStepDone
                    : null,
                ]}
              >
                <Text style={styles.progText} numberOfLines={1}>
                  {stop.label}
                </Text>
              </View>
              {i < stops.length - 1 && (
                <View
                  style={[
                    styles.progLine,
                    (status === "onboard" || status === "arrived" || status === "completed") &&
                      styles.progLineDone,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {status === "completed" ? (
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.replace("/rating")}
            activeOpacity={0.85}
            testID="ride-complete-button"
          >
            <Text style={styles.doneText}>Rate your ride</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleSOS} testID="ride-safety">
              <Ionicons name="shield-checkmark-outline" size={16} color="#fff" />
              <Text style={styles.secondaryText}>SOS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, styles.shareBtn]}
              onPress={handleShare}
              testID="ride-share-btn"
            >
              <Ionicons name="share-outline" size={16} color="#fff" />
              <Text style={styles.secondaryText}>Share Trip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, styles.cancelBtn]}
              onPress={() => router.replace("/driver-dashboard")}
              testID="ride-cancel"
            >
              <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
              <Text style={[styles.secondaryText, { color: colors.danger }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  map: {
    height: MAP_HEIGHT as unknown as number,
    backgroundColor: "#0B0D10",
    overflow: "hidden",
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapPlaceholderText: { color: colors.textDim, fontSize: 13 },
  driverMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
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
  etaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  etaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  etaText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 14,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  headline: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  pinCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pinLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  pinValue: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: 6 },
  pinHint: { color: colors.textDim, fontSize: 11 },
  pinInputGroup: {
    marginTop: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pinInputLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 10 },
  pinInputRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  pinDigit: {
    width: 50,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pinDigitFilled: { borderColor: colors.accent },
  pinDigitText: { color: "#fff", fontSize: 24, fontWeight: "800" },
  pinError: { color: colors.danger, fontSize: 12, marginTop: 8, textAlign: "center" },
  pinSubmitBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  pinSubmitText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  driverCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  driverPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  driverName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  driverMeta: { flexDirection: "row", alignItems: "center", marginTop: 3, gap: 6 },
  driverPlate: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 8 },
  actBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  actBtnAccent: { backgroundColor: colors.danger, borderColor: colors.danger },
  progressRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progStep: {
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 100,
  },
  progStepDone: {
    backgroundColor: "rgba(30,107,255,0.15)",
    borderColor: colors.accent,
  },
  progText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  progLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
    marginHorizontal: 4,
  },
  progLineDone: { backgroundColor: colors.accent },
  bottomActions: { flexDirection: "row", gap: 8, marginTop: 20 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  shareBtn: { borderColor: "rgba(30,107,255,0.35)" },
  cancelBtn: { borderColor: "rgba(228,72,60,0.35)" },
  secondaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  doneBtn: {
    marginTop: 22,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  doneText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
