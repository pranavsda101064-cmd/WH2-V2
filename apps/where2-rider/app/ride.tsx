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
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius } from "@/src/theme";
import { api, Ride as RideType, RideStop } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { LoadingScreen } from "@/src/components/loading";
import { SpringPress } from "@/src/components/spring-press";
import { MapView, Marker, PROVIDER_DEFAULT, DARK_MAP_STYLE } from "@/src/components/map-view";

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
  const [etaMinutes, setEtaMinutes] = useState(5);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const rideIdRef = useRef<string | null>(null);
  const pinRef = useRef<TextInput>(null);

  // Smooth pulsing dot
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.6, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1, duration: 800, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0.3, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 1, duration: 800, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]),
      ]),
    ).start();
  }, []);

  // ETA countdown
  useEffect(() => {
    if (ride?.status !== "arriving") return;
    const timer = setInterval(() => {
      setEtaMinutes((prev) => (prev > 1 ? prev - 1 : 1));
    }, 60000);
    return () => clearInterval(timer);
  }, [ride?.status]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rideId = await storage.getItem<string>("active_ride_id", "");
        if (!rideId || cancelled) return;
        rideIdRef.current = rideId;
        setActiveRideId(rideId);

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
    if (!activeRideId) return;

    const poll = setInterval(async () => {
      try {
        const [r, loc] = await Promise.all([
          api.getRide(activeRideId),
          api.getDriverLocation(activeRideId),
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
  }, [activeRideId]);

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
    status === "pending"
      ? "Looking for a driver..."
      : status === "arriving"
        ? `Arriving in ${etaMinutes} min`
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
            customMapStyle={DARK_MAP_STYLE}
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
                title="Pickup"
              >
                <View style={styles.pickupMarker}>
                  <View style={styles.pickupDot} />
                </View>
              </Marker>
            )}
            {drop.lat && drop.lng && (
              <Marker
                coordinate={{ latitude: drop.lat, longitude: drop.lng }}
                title="Drop-off"
              >
                <View style={styles.dropMarker}>
                  <View style={styles.dropDot} />
                </View>
              </Marker>
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
              {driverLoc.lat && driverLoc.lng
                ? `Driver at ${driverLoc.lat.toFixed(4)}, ${driverLoc.lng.toFixed(4)}`
                : "Waiting for driver location..."}
            </Text>
          </View>
        )}

        <View style={[styles.mapTop, { paddingTop: insets.top + 8 }]}>
          <SpringPress
            style={styles.mapIcon}
            onPress={() => router.back()}
            testID="ride-back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </SpringPress>
          <View style={styles.etaPill}>
            <Animated.View style={[styles.etaDot, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
            <Text style={styles.etaText}>
              {status === "pending"
                ? "FINDING DRIVER"
                : status === "arriving"
                  ? `ARRIVING IN ${etaMinutes} MIN`
                  : status === "onboard"
                    ? "IN TRANSIT"
                    : status.toUpperCase()}
            </Text>
          </View>
          <SpringPress style={styles.mapIcon} onPress={handleShare} testID="ride-share">
            <Ionicons name="share-outline" size={18} color="#fff" />
          </SpringPress>
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

        {/* Ride PIN display */}
        {status === "arriving" && ride?.ride_pin && (
          <SpringPress
            style={styles.pinCard}
            onPress={() => setShowPin(!showPin)}
          >
            <Ionicons name="key-outline" size={18} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pinLabel}>Your ride PIN</Text>
              <Text style={styles.pinValue}>{showPin ? ride.ride_pin : "••••"}</Text>
            </View>
            <Text style={styles.pinHint}>Tap to {showPin ? "hide" : "reveal"}</Text>
          </SpringPress>
        )}

        {/* PIN input */}
        {status === "arriving" && showPin && (
          <View style={styles.pinInputGroup}>
            <Text style={styles.pinInputLabel}>Enter rider's PIN to start ride:</Text>
            <Pressable onPress={() => pinRef.current?.focus()}>
              <View style={styles.pinInputRow}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.pinDigit,
                      pinInput[i] && styles.pinDigitFilled,
                    ]}
                  >
                    <Text style={styles.pinDigitText}>
                      {pinInput[i] || "•"}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
            <TextInput
              ref={pinRef}
              value={pinInput}
              onChangeText={(t) => {
                const digits = t.replace(/[^0-9]/g, "").slice(0, 4);
                setPinInput(digits);
                setPinError("");
              }}
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
              style={styles.pinHiddenInput}
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <SpringPress
              style={[styles.pinSubmitBtn, pinInput.length !== 4 && { opacity: 0.5 }]}
              onPress={handleVerifyPin}
            >
              <Text style={styles.pinSubmitText}>Start Ride</Text>
            </SpringPress>
          </View>
        )}

        {/* Driver card */}
        <View style={styles.driverCard}>
          <View style={styles.driverPhoto}>
            <Ionicons name={status === "pending" ? "search" : "person"} size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{status === "pending" ? "Searching..." : "Driver"}</Text>
            <View style={styles.driverMeta}>
              <Ionicons name="car-sport" size={12} color="#fff" />
              <Text style={styles.driverPlate}>{status === "pending" ? "Matched driver will appear here" : ride?.vehicle_id || "—"}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color={colors.accent} />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <SpringPress style={styles.actBtn} testID="ride-message">
              <Ionicons name="chatbubble-outline" size={18} color="#fff" />
            </SpringPress>
            <SpringPress
              style={[styles.actBtn, styles.actBtnAccent]}
              onPress={handleSOS}
              testID="ride-sos"
            >
              <Ionicons name="alert-circle" size={18} color="#fff" />
            </SpringPress>
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
          <SpringPress
            style={styles.doneBtn}
            onPress={() => router.replace("/rating")}
            testID="ride-complete-button"
          >
            <Text style={styles.doneText}>Rate your ride</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </SpringPress>
        ) : (
          <View style={styles.bottomActions}>
            <SpringPress style={styles.secondaryBtn} onPress={handleSOS} testID="ride-safety">
              <Ionicons name="shield-checkmark-outline" size={16} color="#fff" />
              <Text style={styles.secondaryText}>SOS</Text>
            </SpringPress>
            <SpringPress
              style={[styles.secondaryBtn, styles.shareBtn]}
              onPress={handleShare}
              testID="ride-share-btn"
            >
              <Ionicons name="share-outline" size={16} color="#fff" />
              <Text style={styles.secondaryText}>Share Trip</Text>
            </SpringPress>
            <SpringPress
              style={[styles.secondaryBtn, styles.cancelBtn]}
              onPress={() => router.replace("/(tabs)/home")}
              testID="ride-cancel"
            >
              <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
              <Text style={[styles.secondaryText, { color: colors.danger }]}>Cancel</Text>
            </SpringPress>
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
  pickupMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(30,107,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: "#fff",
  },
  dropMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(228,72,60,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  dropDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: "#fff",
  },
  driverMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
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
    borderColor: "rgba(255,255,255,0.1)",
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
    backgroundColor: "rgba(0,0,0,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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
  etaText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
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
  pinHiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
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
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(30,107,255,0.12)",
  },
  ratingText: { color: "#fff", fontSize: 11, fontWeight: "700" },
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
