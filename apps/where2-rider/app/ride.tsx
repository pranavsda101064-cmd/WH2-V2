import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
let Haptics: any = null;
try { Haptics = require("expo-haptics"); } catch {}

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { api, Ride as RideType, RideStop } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { LoadingScreen } from "@/src/components/loading";
import { SpringPress } from "@/src/components/spring-press";
import { MapView, Marker, PROVIDER_DEFAULT, DARK_MAP_STYLE } from "@/src/components/map-view";

const POLL_INTERVAL = 5000;
const MAP_HEIGHT = "43%";
const BOOST_PRESETS = [0, 50, 100, 200];

export default function Ride() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ride, setRide] = useState<RideType | null>(null);
  const [driverLoc, setDriverLoc] = useState<{
    lat: number | null;
    lng: number | null;
  }>({ lat: null, lng: null });
  const [loading, setLoading] = useState(true);
  const [etaMinutes, setEtaMinutes] = useState(5);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [driverInfo, setDriverInfo] = useState<{
    name: string;
    phone?: string;
    photo_url?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_reg?: string;
  } | null>(null);
  const [boostAmount, setBoostAmount] = useState(0);
  const [boosting, setBoosting] = useState(false);
  const rideIdRef = useRef<string | null>(null);

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
        if (loc.lat !== null && loc.lng !== null) {
          setDriverLoc({ lat: loc.lat, lng: loc.lng });
        }
      } catch {
        // silent
      }
    }, POLL_INTERVAL);

    return () => clearInterval(poll);
  }, [activeRideId]);

  useEffect(() => {
    if (!ride?.id || !ride.driver_id) return;
    let cancelled = false;
    api.getRideDriver(ride.id)
      .then((d) => { if (!cancelled) setDriverInfo(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [ride?.id, ride?.driver_id]);

  useEffect(() => {
    if (!ride?.status) return;
    if (ride.status === "completed") {
      if (Haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (ride.status === "cancelled") {
      if (Haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (ride.status === "onboard") {
      if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (ride.status === "arrived") {
      if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [ride?.status]);

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

  const handleCancel = () => {
    Alert.alert(
      "Cancel ride?",
      "Are you sure you want to cancel this ride?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, cancel",
          style: "destructive",
          onPress: async () => {
            if (rideIdRef.current) {
              await api.updateRideStatus(rideIdRef.current, "cancelled").catch(() => {});
            }
            storage.removeItem("active_ride_id");
            router.replace("/(tabs)/home");
          },
        },
      ],
    );
  };

  const handleBoost = async (amount: number) => {
    if (!rideIdRef.current || boosting) return;
    setBoostAmount(amount);
    setBoosting(true);
    try {
      await api.boostRide(rideIdRef.current, amount);
    } catch {
      // silent — UI already updated
    }
    setBoosting(false);
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

        {/* Driver card */}
        <View style={styles.driverCard}>
          <View style={styles.driverPhoto}>
            <Ionicons name={status === "pending" ? "search" : "person"} size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.driverName}>
                {status === "pending" ? "Searching..." : driverInfo?.name || "Driver"}
              </Text>
              {ride?.ride_pin && (
                <View style={styles.pinBadge}>
                  <Ionicons name="key-outline" size={10} color={colors.accent} />
                  <Text style={styles.pinBadgeText}>{ride.ride_pin}</Text>
                </View>
              )}
            </View>
            <View style={styles.driverMeta}>
              <Ionicons name="car-sport" size={12} color="#fff" />
              <Text style={styles.driverPlate}>
                {status === "pending"
                  ? "Matched driver will appear here"
                  : driverInfo?.vehicle_reg || ride?.vehicle_id || "—"}
              </Text>
            </View>
            {driverInfo && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={10} color={colors.accent} />
                <Text style={styles.ratingText}>
                  {[driverInfo.vehicle_make, driverInfo.vehicle_model].filter(Boolean).join(" ") || "Vehicle"}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.actionRow}>
            <SpringPress
              style={styles.actBtn}
              testID="ride-message"
              onPress={() => router.push({
                pathname: "/chat" as any,
                params: {
                  rideId: activeRideId || "",
                  driverName: driverInfo?.name || "Driver",
                  driverPhone: driverInfo?.phone || "",
                },
              })}
            >
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
        ) : status === "pending" ? (
          <>
            {/* Boost section */}
            <View style={styles.boostSection}>
              <View style={styles.boostHeader}>
                <Ionicons name="trending-up" size={16} color={colors.accent} />
                <Text style={styles.boostTitle}>Boost your fare</Text>
              </View>
              <Text style={styles.boostSub}>Offer more to find a driver faster</Text>
              <View style={styles.boostRow}>
                {BOOST_PRESETS.map((amt) => {
                  const active = boostAmount === amt;
                  return (
                    <SpringPress
                      key={amt}
                      style={[styles.boostBtn, active && styles.boostBtnActive]}
                      onPress={() => handleBoost(amt)}
                      disabled={boosting}
                    >
                      <Text style={[styles.boostBtnText, active && styles.boostBtnTextActive]}>
                        {amt === 0 ? "Normal" : `+₹${amt}`}
                      </Text>
                    </SpringPress>
                  );
                })}
              </View>
              {boosting && (
                <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 8 }} />
              )}
            </View>

            {/* Cancel — prominent during pending */}
            <SpringPress
              style={styles.cancelFullBtn}
              onPress={handleCancel}
              testID="ride-cancel"
            >
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.cancelFullText}>Cancel Ride</Text>
            </SpringPress>

            {/* Secondary row */}
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
            </View>
          </>
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
              onPress={handleCancel}
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
  mapPlaceholderText: { color: colors.textDim, fontSize: font.small },
  pickupMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,137,123,0.2)",
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
    ...shadows.accent,
  },
  mapTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: spacing.md,
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
    ...shadows.accent,
  },
  etaText: { color: "#fff", fontSize: font.micro, fontWeight: "700", letterSpacing: 1.2 },
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
    fontSize: font.micro,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  headline: {
    color: colors.text,
    fontSize: font.title,
    fontWeight: "600",
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  driverCard: {
    marginTop: spacing.md,
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
  driverName: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  driverMeta: { flexDirection: "row", alignItems: "center", marginTop: 3, gap: 6 },
  driverPlate: { color: colors.textMuted, fontSize: font.caption, fontWeight: "600" },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(0,137,123,0.12)",
  },
  ratingText: { color: colors.text, fontSize: font.micro, fontWeight: "700" },
  pinBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, backgroundColor: "rgba(0,137,123,0.12)",
  },
  pinBadgeText: {
    color: colors.accent, fontSize: font.micro, fontWeight: "700", letterSpacing: 1,
  },
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
    backgroundColor: "rgba(0,137,123,0.15)",
    borderColor: colors.accent,
  },
  progText: { color: colors.textMuted, fontSize: font.micro, fontWeight: "600" },
  progLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
    marginHorizontal: spacing.xs,
  },
  progLineDone: { backgroundColor: colors.accent },
  boostSection: {
    marginTop: 16,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boostHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  boostTitle: { color: colors.text, fontSize: font.subtitle, fontWeight: "700" },
  boostSub: { color: colors.textMuted, fontSize: font.small, marginTop: 4 },
  boostRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  boostBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  boostBtnActive: {
    borderColor: colors.accent,
    backgroundColor: "rgba(0,137,123,0.08)",
  },
  boostBtnText: { color: colors.textMuted, fontSize: font.small, fontWeight: "600" },
  boostBtnTextActive: { color: colors.accent },
  cancelFullBtn: {
    marginTop: 12,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cancelFullText: { color: "#fff", fontSize: font.body, fontWeight: "700" },
  bottomActions: { flexDirection: "row", gap: 8, marginTop: 12 },
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
  shareBtn: { borderColor: "rgba(0,137,123,0.35)" },
  cancelBtn: { borderColor: "rgba(228,72,60,0.35)" },
  secondaryText: { color: colors.text, fontSize: font.small, fontWeight: "700" },
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
  doneText: { color: "#fff", fontSize: font.subtitle, fontWeight: "700" },
});
