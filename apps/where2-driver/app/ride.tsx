import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
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
import * as Haptics from "expo-haptics";

import { colors, radius } from "@/src/theme";
import { api, Ride as RideType, RideStop } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { LoadingScreen } from "@/src/components/loading";
import { FadeIn } from "@/src/components/fade-in";
import { SpringPress } from "@/src/components/spring-press";
import { MapView, Marker, PROVIDER_DEFAULT, DARK_MAP_STYLE } from "@/src/components/map-view";

const POLL_INTERVAL = 5000;
const MAP_HEIGHT = "50%";

export default function Ride() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [ride, setRide] = useState<RideType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const pinRef = useRef<TextInput>(null);

  useEffect(() => {
    if (status === "completed" || status === "cancelled") return;
    pulse.setValue(0);
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [status, pulse]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rideId = await storage.getItem<string>("active_ride_id", "");
        if (!rideId || cancelled) return;
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
        const r = await api.getRide(activeRideId);
        setRide(r);
      } catch {
        // silent
      }
    }, POLL_INTERVAL);

    return () => clearInterval(poll);
  }, [activeRideId]);

  useEffect(() => {
    if (status === "completed" || status === "cancelled") return;

    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      Alert.alert(
        "Cancel ride?",
        "Are you sure you want to cancel this ride?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes, cancel",
            style: "destructive",
            onPress: async () => {
              if (activeRideId) {
                await api.updateRideStatus(activeRideId, "cancelled").catch(() => {});
              }
              handleBackToDashboard();
            },
          },
        ],
      );
      return true;
    });

    return () => handler.remove();
  }, [activeRideId, status]);

  const handleStatusUpdate = async (nextStatus: RideType["status"]) => {
    if (!activeRideId || updating) return;
    setUpdating(true);
    try {
      const updated = await api.updateRideStatus(activeRideId, nextStatus);
      setRide(updated);
      if (nextStatus === "completed") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      if (nextStatus === "onboard") {
        setShowPinInput(false);
        setPinInput("");
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to update ride status. Try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyPin = async () => {
    if (!activeRideId || pinInput.length !== 4) return;
    setPinError("");
    try {
      await api.verifyRidePin(activeRideId, pinInput);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await handleStatusUpdate("onboard");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPinError("Invalid PIN. Ask rider to check and re-enter.");
    }
  };

  const handleSOS = () => {
    Alert.alert(
      "Emergency SOS",
      "This will call 112 (emergency services). Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call 112", style: "destructive", onPress: () => Linking.openURL("tel:112") },
      ],
    );
  };

  const handleBackToDashboard = () => {
    storage.removeItem("active_ride_id");
    router.replace("/(tabs)");
  };

  if (loading) return <LoadingScreen message="Loading ride..." />;

  const stops: RideStop[] = ride?.stops || [];
  const status = ride?.status || "arriving";
  const pickup = stops[0];
  const drop = stops[stops.length - 1];

  const statusLabel =
    status === "arriving" || status === "pending"
      ? "HEADING TO PICKUP"
      : status === "arrived"
        ? "AT PICKUP"
        : status === "onboard"
          ? "TRIP IN PROGRESS"
          : status === "completed"
            ? "RIDE COMPLETE"
            : status.toUpperCase();

  const statusDescription =
    status === "arriving" || status === "pending"
      ? "Navigate to the rider's pickup location"
      : status === "arrived"
        ? "You've arrived. Ask rider for their 4-digit PIN to start the trip."
        : status === "onboard"
          ? "Take the rider to their destination"
          : status === "completed"
            ? "Great work! Here's your trip summary."
            : "";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root} testID="driver-ride-screen">
        <StatusBar style="light" />

        {/* Map area */}
        <View style={styles.map}>
          {Platform.OS !== "web" && MapView && pickup ? (
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
              showsUserLocation={true}
            >
              {pickup.lat && pickup.lng && (
                <Marker
                  coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
                  pinColor={colors.accent}
                  title="Pickup"
                  description={pickup.label}
                />
              )}
              {drop?.lat && drop?.lng && status === "onboard" && (
                <Marker
                  coordinate={{ latitude: drop.lat, longitude: drop.lng }}
                  pinColor={colors.danger}
                  title="Drop-off"
                  description={drop.label}
                />
              )}
            </MapView>
          ) : (
            <View style={styles.mapFallback}>
              <Ionicons name="map-outline" size={40} color={colors.textMuted} />
              <Text style={styles.mapFallbackText}>Map unavailable</Text>
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
            <View style={styles.statusPill}>
              <Animated.View style={[
                styles.statusDot,
                status === "onboard" && styles.statusDotGreen,
                status === "completed" && styles.statusDotGray,
                { opacity: (status === "arriving" || status === "pending") ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) : 1 },
              ]} />
              <Text style={styles.statusPillText}>{statusLabel}</Text>
            </View>
            <TouchableOpacity style={styles.mapIcon} onPress={handleSOS} testID="ride-sos-map">
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom sheet */}
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grabber} />

          <FadeIn delay={100}>
            <Text style={styles.kicker}>{statusLabel}</Text>
          </FadeIn>
          <FadeIn delay={150}>
            <Text style={styles.description}>{statusDescription}</Text>
          </FadeIn>

          {/* Route summary */}
          {pickup && drop && (
            <FadeIn delay={200}>
              <View style={styles.routeCard}>
              <View style={styles.routeRow}>
                <View style={styles.routeIndicator}>
                  <View style={[styles.routeDot, { backgroundColor: colors.accent }]} />
                  <View style={styles.routeLine} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel} numberOfLines={1}>{pickup.label}</Text>
                  <Text style={styles.routeSub}>Pickup</Text>
                </View>
              </View>
              <View style={styles.routeRow}>
                <View style={styles.routeIndicator}>
                  <View style={[styles.routeDot, { backgroundColor: colors.danger }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel} numberOfLines={1}>{drop.label}</Text>
                  <Text style={styles.routeSub}>Drop-off</Text>
                </View>
              </View>
              </View>
            </FadeIn>
          )}

          {/* Arrived at pickup — show PIN input */}
          {status === "arrived" && (
            <View style={styles.pinSection}>
              {!showPinInput ? (
                <TouchableOpacity
                  style={styles.showPinBtn}
                  onPress={() => {
                    setShowPinInput(true);
                    setTimeout(() => pinRef.current?.focus(), 300);
                  }}
                  testID="show-pin-input"
                >
                  <Ionicons name="key-outline" size={18} color={colors.accent} />
                  <Text style={styles.showPinBtnText}>Enter rider's PIN to start trip</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.accent} />
                </TouchableOpacity>
              ) : (
                <View style={styles.pinInputGroup}>
                  <Text style={styles.pinLabel}>Ask rider for their 4-digit PIN</Text>
                  <TextInput
                    ref={pinRef}
                    style={styles.hiddenInput}
                    value={pinInput}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, "").slice(0, 4);
                      setPinInput(cleaned);
                      setPinError("");
                    }}
                    keyboardType="number-pad"
                    maxLength={4}
                    autoFocus
                    testID="pin-text-input"
                  />
                  <View style={styles.pinDigitRow}>
                    {[0, 1, 2, 3].map((i) => (
                      <Pressable
                        key={i}
                        style={[
                          styles.pinDigit,
                          pinInput[i] !== undefined && styles.pinDigitFilled,
                        ]}
                        onPress={() => pinRef.current?.focus()}
                      >
                        <Text style={styles.pinDigitText}>
                          {pinInput[i] !== undefined ? "•" : ""}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
                  <TouchableOpacity
                    style={[styles.verifyBtn, pinInput.length !== 4 && styles.verifyBtnDisabled]}
                    onPress={handleVerifyPin}
                    disabled={pinInput.length !== 4 || updating}
                    testID="verify-pin-button"
                  >
                    <Text style={styles.verifyBtnText}>
                      {updating ? "Verifying..." : "Verify PIN & Start Trip"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Fare summary on completed */}
          {status === "completed" && (
            <View style={styles.fareSummary}>
              <View style={styles.fareHeader}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={styles.fareHeaderText}>Trip Complete</Text>
              </View>
              <View style={styles.fareDivider} />
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Total fare</Text>
                <Text style={styles.fareValue}>₹{ride?.fare.toLocaleString("en-IN") || "—"}</Text>
              </View>
              {ride?.tip ? (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Tip earned</Text>
                  <Text style={[styles.fareValueSmall, { color: colors.accent }]}>+₹{ride.tip}</Text>
                </View>
              ) : null}
              <View style={styles.fareDivider} />
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Payment</Text>
                <Text style={styles.fareValueSmall}>{ride?.payment_method?.toUpperCase() || "—"}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Route</Text>
                <Text style={styles.fareValueSmall} numberOfLines={1}>
                  {pickup?.label} → {drop?.label}
                </Text>
              </View>
              {ride?.created_at && (
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Duration</Text>
                  <Text style={styles.fareValueSmall}>
                    {(() => {
                      const mins = Math.round((Date.now() - new Date(ride.created_at).getTime()) / 60000);
                      if (mins < 60) return `${mins} min`;
                      return `${Math.floor(mins / 60)}h ${mins % 60}m`;
                    })()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Status action button */}
          {status === "arriving" && (
            <FadeIn delay={300}>
              <SpringPress
                style={[styles.actionBtn, updating && styles.actionBtnDisabled]}
                onPress={() => handleStatusUpdate("arrived")}
                testID="arrived-button"
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>
                  {updating ? "Updating..." : "Arrived at Pickup"}
                </Text>
              </SpringPress>
            </FadeIn>
          )}

          {status === "completed" && (
            <FadeIn delay={300}>
              <SpringPress
                style={styles.actionBtn}
                onPress={handleBackToDashboard}
                testID="back-to-dashboard-button"
              >
                <Ionicons name="arrow-back" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Back to Dashboard</Text>
              </SpringPress>
            </FadeIn>
          )}

          {/* Bottom actions (during trip) */}
          {status !== "completed" && (
            <FadeIn delay={400}>
              <View style={styles.bottomActions}>
                <SpringPress style={styles.sosBtn} onPress={handleSOS} testID="ride-sos-bottom">
                  <Ionicons name="shield-checkmark-outline" size={16} color={colors.danger} />
                  <Text style={styles.sosBtnText}>SOS</Text>
                </SpringPress>
                {status !== "arrived" && (
                  <SpringPress
                    style={styles.cancelBtn}
                    onPress={() => {
                      Alert.alert(
                        "Cancel ride?",
                        "This will cancel the current ride.",
                        [
                          { text: "No", style: "cancel" },
                          {
                            text: "Yes, cancel",
                            style: "destructive",
                            onPress: async () => {
                              if (activeRideId) {
                                await api.updateRideStatus(activeRideId, "cancelled").catch(() => {});
                              }
                              handleBackToDashboard();
                            },
                          },
                        ],
                      );
                    }}
                    testID="ride-cancel"
                  >
                    <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                    <Text style={[styles.sosBtnText, { color: colors.danger }]}>Cancel Ride</Text>
                  </SpringPress>
                )}
              </View>
            </FadeIn>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  map: {
    height: MAP_HEIGHT as unknown as number,
    backgroundColor: "#0B0D10",
    overflow: "hidden",
  },
  mapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapFallbackText: { color: colors.textDim, fontSize: 13 },
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
  statusPill: {
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  statusDotGreen: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
  },
  statusDotGray: {
    backgroundColor: colors.textMuted,
    shadowOpacity: 0,
  },
  statusPillText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
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
  description: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },

  /* Route card */
  routeCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  routeRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  routeIndicator: { width: 10, alignItems: "center", paddingTop: 4 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { width: 2, height: 20, backgroundColor: colors.border, marginTop: 4 },
  routeLabel: { color: "#fff", fontSize: 14, fontWeight: "600" },
  routeSub: { color: colors.textMuted, fontSize: 11, marginTop: 2, marginBottom: 8 },

  /* PIN section */
  pinSection: { marginTop: 16 },
  showPinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  showPinBtnText: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "600" },
  pinInputGroup: {
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pinLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 12 },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  pinDigitRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  pinDigit: {
    width: 54,
    height: 60,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pinDigitFilled: { borderColor: colors.accent, backgroundColor: "rgba(30,107,255,0.10)" },
  pinDigitText: { color: "#fff", fontSize: 26, fontWeight: "800" },
  pinError: { color: colors.danger, fontSize: 12, marginTop: 10, textAlign: "center" },
  verifyBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  /* Fare summary */
  fareSummary: {
    marginTop: 16,
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  fareHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fareHeaderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  fareDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fareLabel: { color: colors.textMuted, fontSize: 13 },
  fareValue: { color: "#fff", fontSize: 22, fontWeight: "800" },
  fareValueSmall: { color: "#fff", fontSize: 14, fontWeight: "600" },

  /* Action button */
  actionBtn: {
    marginTop: 20,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  /* Bottom actions */
  bottomActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  sosBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(228,72,60,0.35)",
    backgroundColor: colors.surface,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(228,72,60,0.35)",
    backgroundColor: colors.surface,
  },
  sosBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
