import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
let Haptics: any = null;
try { Haptics = require("expo-haptics"); } catch {}

import { LinearGradient } from "expo-linear-gradient";

import { colors, radius } from "@/src/theme";
import { api, DriverRequest, DriverStats, getUserName } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { DashboardSkeleton } from "@/src/components/loading";
import { useLocationTracker } from "@/src/hooks/use-location-tracker";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";
import { RequestSheet } from "@/src/components/request-sheet";
import { StatCard, SectionHeader, QuickAction } from "@/src/components/ui";
import { playNotificationSound } from "@/src/utils/notification-sound";

const PREVIEW_REQUEST: DriverRequest = {
  id: "preview-request",
  pickup: "Sakleshpura Bus Stand",
  drop: "Bisle Ghat Viewpoint",
  distance: "46 km",
  duration: "1h 40m",
  fare: 2199,
  rider: "Aditi S.",
  rating: 4.9,
  tag: "3 stops",
};

const POLL_INTERVAL = 10000;
const REQUEST_TIMEOUT = 30;

export default function DriverDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [online, setOnline] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [stats, setStats] = useState<DriverStats>({ earnings: 0, trips: 0, hours: 0 });
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const countdownsRef = useRef<Map<string, number>>(new Map());
  const [countdowns, setCountdowns] = useState<Map<string, number>>(new Map());
  const prevCountRef = useRef(0);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [busy, setBusy] = useState<{ id: string; kind: "accept" | "decline" } | null>(null);
  const [driverName, setDriverName] = useState("");
  const seenRef = useRef<Set<string>>(new Set());

  // Dev preview: insert a mock request so the sheet can be reviewed offline
  const previewRequest = useCallback(() => {
    const id = `preview-${Date.now()}`;
    const mock = { ...PREVIEW_REQUEST, id };
    seenRef.current.add(id);
    setRequests((prev) => (prev.some((r) => r.id === id) ? prev : [mock, ...prev]));
    startTimer(id);
    setSheetId(id);
    setSelected(id);
    playNotificationSound();
    if (Haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [startTimer]);

  useLocationTracker();

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearInterval(t));
    timersRef.current.clear();
    countdownsRef.current.clear();
  }, []);

  const startTimer = useCallback(
    (id: string) => {
      if (timersRef.current.has(id)) return;
      countdownsRef.current.set(id, REQUEST_TIMEOUT);
      setCountdowns((prev) => new Map(prev).set(id, REQUEST_TIMEOUT));

      const timer = setInterval(() => {
        const remaining = (countdownsRef.current.get(id) ?? REQUEST_TIMEOUT) - 1;
        countdownsRef.current.set(id, remaining);
        setCountdowns((prev) => new Map(prev).set(id, remaining));

        if (remaining <= 0) {
          clearInterval(timer);
          timersRef.current.delete(id);
          countdownsRef.current.delete(id);
          api.declineRequest(id).catch(() => {});
          setRequests((prev) => prev.filter((r) => r.id !== id));
          setCountdowns((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
        }
      }, 1000);
      timersRef.current.set(id, timer);
    },
    [],
  );

  const fetchRequests = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([api.listDriverRequests(), api.driverStats()]);
      const newIds = new Set(r.map((req) => req.id));

      timersRef.current.forEach((timer, id) => {
        if (!newIds.has(id)) {
          clearInterval(timer);
          timersRef.current.delete(id);
          countdownsRef.current.delete(id);
        }
      });

      r.forEach((req) => {
        if (!timersRef.current.has(req.id)) {
          startTimer(req.id);
        }
      });

      if (r.length > prevCountRef.current && prevCountRef.current > 0) {
        playNotificationSound();
        if (Haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      prevCountRef.current = r.length;

      setRequests(r);
      setStats(s);
    } catch {}
  }, [startTimer]);

  const toggleOnline = useCallback(
    async (val: boolean) => {
      setOnline(val);
      await storage.setItem("driver_online", val);
      api.updateOnlineStatus(val).catch(() => {});
    },
    [],
  );

  useEffect(() => {
    storage.getItem<boolean>("driver_online", true).then((saved) => {
      const isOnline = saved !== null ? saved : true;
      setOnline(isOnline);
      api.updateOnlineStatus(isOnline).catch(() => {});
    });
  }, []);

  useEffect(() => {
    fetchRequests().finally(() => setLoading(false));
    getUserName().then((n) => {
      if (n) setDriverName(n.split(" ")[0]);
    });
  }, [fetchRequests]);

  useEffect(() => {
    if (requests.length > 0 && !selected) setSelected(requests[0].id);
  }, [requests, selected]);

  // Auto-open the bottom sheet for brand-new incoming requests
  useEffect(() => {
    if (!online) return;
    const fresh = requests.find((r) => !seenRef.current.has(r.id));
    if (fresh) {
      seenRef.current.add(fresh.id);
      setSheetId(fresh.id);
      setSelected(fresh.id);
    }
    if (sheetId && !requests.some((r) => r.id === sheetId)) {
      setSheetId(null);
    }
  }, [requests, online, sheetId]);

  useEffect(() => {
    if (online) {
      pollRef.current = setInterval(fetchRequests, POLL_INTERVAL);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [online, fetchRequests]);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const accept = async (id: string) => {
    if (timersRef.current.has(id)) {
      clearInterval(timersRef.current.get(id)!);
      timersRef.current.delete(id);
      countdownsRef.current.delete(id);
    }
    if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBusy({ id, kind: "accept" });
    const ride = await api.acceptRequest(id).catch(() => null);
    setBusy(null);
    if (ride?.id) {
      await storage.setItem("active_ride_id", ride.id);
      setRequests((prev) => prev.filter((x) => x.id !== id));
      setCountdowns((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      setSelected(null);
      setSheetId((prev) => (prev === id ? null : prev));
      router.push("/ride");
    } else {
      // Accept failed — keep request visible so driver can retry
      if (Haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Failed to accept", "Could not accept this ride request. Please try again.");
      // Restart the timer so they still have time to accept/decline
      startTimer(id);
    }
  };

  const decline = async (id: string) => {
    if (timersRef.current.has(id)) {
      clearInterval(timersRef.current.get(id)!);
      timersRef.current.delete(id);
      countdownsRef.current.delete(id);
    }
    if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBusy({ id, kind: "decline" });
    const result = await api.declineRequest(id).catch(() => null);
    setBusy(null);
    if (!result) {
      // Decline failed — keep request visible
      if (Haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Failed to decline", "Could not decline this ride request. Please try again.");
      startTimer(id);
      return;
    }
    setRequests((prev) => prev.filter((x) => x.id !== id));
    setCountdowns((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setSelected((prev) => (prev === id ? null : prev));
    setSheetId((prev) => (prev === id ? null : prev));
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <View style={styles.root} testID="driver-dashboard">
      <LinearGradient
        colors={["rgba(0,137,123,0.07)", "rgba(0,137,123,0.02)", colors.bg]}
        locations={[0, 0.35, 0.55]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 80,
        }}
      >
        {/* Header with driver profile snippet */}
        <FadeIn delay={0}>
          <View style={styles.header}>
            <View style={styles.avatarSm}>
              <Text style={styles.avatarSmText}>
                {(driverName || "D").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headKicker}>SAKLESHPURA DRIVER</Text>
              <Text style={styles.headTitle}>
                {driverName ? `Namaste, ${driverName}` : "Driver Dashboard"}
              </Text>
            </View>
            <View style={[styles.statusPill, online ? styles.statusPillOn : styles.statusPillOff]}>
              <View style={[styles.statusDot, online ? styles.statusDotOn : styles.statusDotOff]} />
              <Text style={[styles.statusText, online ? styles.statusTextOn : styles.statusTextOff]}>
                {online ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
        </FadeIn>

        {/* Duty toggle */}
        <FadeIn delay={100}>
          <View style={[styles.toggleCard, online && styles.toggleCardOn]}>
            <View style={[styles.dutyIcon, online && styles.dutyIconOn]}>
              <Ionicons
                name={online ? "car-sport" : "car-sport-outline"}
                size={24}
                color={online ? "#fff" : colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, online && { color: colors.accent }]}>
                {online ? "YOU'RE ON DUTY" : "YOU'RE OFFLINE"}
              </Text>
              <Text style={styles.toggleSub}>
                {online ? "Receiving ride requests" : "Go online to earn"}
              </Text>
            </View>
            <Switch
              value={online}
              onValueChange={toggleOnline}
              trackColor={{ false: "#2A2C30", true: colors.accentDim }}
              thumbColor={online ? colors.accent : "#f4f3f4"}
              ios_backgroundColor="#2A2C30"
              testID="dashboard-online-toggle"
            />
          </View>
        </FadeIn>

        {/* Today stats */}
        <FadeIn delay={200}>
          <View style={styles.statsGrid}>
            <StatCard label="Earnings" value={`₹${stats.earnings.toLocaleString("en-IN")}`} icon="wallet" />
            <StatCard label="Trips" value={String(stats.trips)} icon="car" tint={colors.accentDim} />
            <StatCard label="Hours" value={stats.hours.toFixed(1)} icon="time" tint={colors.pending} />
          </View>
        </FadeIn>

        {/* Quick actions */}
        <FadeIn delay={250}>
          <View style={styles.qaGrid}>
            <QuickAction
              icon="wallet-outline"
              label="My Earnings"
              onPress={() => router.push("/(tabs)/earnings")}
              testID="qa-earnings"
            />
            <QuickAction
              icon="document-text-outline"
              label="Documents"
              onPress={() => router.push("/(tabs)/profile")}
              testID="qa-documents"
            />
            <QuickAction
              icon="receipt-outline"
              label="Expenses"
              onPress={() => router.push("/expenses")}
              testID="qa-expenses"
            />
            <QuickAction
              icon="eye-outline"
              label="Demo request"
              onPress={previewRequest}
              testID="qa-preview"
            />
          </View>
        </FadeIn>

        {/* Incoming */}
        <FadeIn delay={300}>
          <SectionHeader
            title="Incoming requests"
            right={`${requests.length} live`}
            dot={online && requests.length > 0}
          />
        </FadeIn>

        {!online && (
          <FadeIn delay={350}>
            <View style={styles.offlineNotice}>
              <Ionicons name="moon-outline" size={16} color={colors.textMuted} />
              <Text style={styles.offlineText}>
                You&apos;re offline. Go online to receive new ride requests.
              </Text>
            </View>
          </FadeIn>
        )}

        {online && requests.length === 0 && (
          <FadeIn delay={350}>
            <View style={styles.offlineNotice}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={styles.offlineText}>Waiting for ride requests...</Text>
            </View>
          </FadeIn>
        )}

        {online &&
          requests
            .filter((r) => r.id !== sheetId)
            .map((r, i) => {
            const isActive = selected === r.id;
            const remaining = countdowns.get(r.id) ?? REQUEST_TIMEOUT;
            const progress = remaining / REQUEST_TIMEOUT;
            return (
              <FadeIn key={r.id} delay={400 + i * 100}>
                <SpringPress
                  onPress={() => setSelected(isActive ? null : r.id)}
                  testID={`request-${r.id}`}
                >
                  <View
                    style={[styles.reqCard, isActive && styles.reqCardActive]}
                  >
                    {/* Countdown bar */}
                    <View style={styles.countdownBg}>
                      <View
                        style={[
                          styles.countdownFill,
                          {
                            width: `${progress * 100}%`,
                            backgroundColor:
                              progress > 0.5
                                ? colors.accent
                                : progress > 0.25
                                  ? colors.pending
                                  : colors.danger,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.reqTop}>
                      <View style={styles.riderPhoto}>
                        <Ionicons name="person" size={16} color={colors.textMuted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.riderName}>{r.rider}</Text>
                        <View style={styles.riderMeta}>
                          <Ionicons name="star" size={10} color={colors.accent} />
                          <Text style={styles.riderRating}>{r.rating.toFixed(1)}</Text>
                          <Text style={styles.riderDot}> · </Text>
                          <Text style={styles.riderTag}>{r.tag}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.fareLg}>₹{r.fare.toLocaleString("en-IN")}</Text>
                        <Text style={styles.fareSub}>{r.distance} · {r.duration}</Text>
                      </View>
                    </View>

                    <View style={styles.route}>
                      <RouteRow color={colors.text} label={r.pickup} sub="Pickup" isFirst />
                      <RouteRow color={colors.accent} label={r.drop} sub="Drop-off" />
                    </View>

                    {/* Route preview */}
                    <View style={styles.routePreview}>
                      <View style={styles.routePreviewDot} />
                      <View style={styles.routePreviewLine} />
                      <Ionicons name="location" size={10} color={colors.danger} />
                      <View style={styles.routePreviewInfo}>
                        <Text style={styles.routePreviewDistance}>{r.distance}</Text>
                        <Text style={styles.routePreviewDuration}>{r.duration}</Text>
                      </View>
                    </View>

                    {isActive && (
                      <View style={styles.reqActions}>
                        <TouchableOpacity
                          style={styles.declineBtn}
                          testID={`decline-${r.id}`}
                          onPress={() => decline(r.id)}
                        >
                          <Text style={styles.declineText}>Decline</Text>
                        </TouchableOpacity>
                        <SpringPress
                          onPress={() => accept(r.id)}
                          testID={`accept-${r.id}`}
                          style={{ flex: 2 }}
                        >
                          <View style={styles.acceptBtn}>
                            <Text style={styles.acceptText}>Accept ride</Text>
                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                          </View>
                        </SpringPress>
                      </View>
                    )}
                  </View>
                </SpringPress>
              </FadeIn>
            );
          })}
      </ScrollView>

      <RequestSheet
        request={requests.find((r) => r.id === sheetId) ?? null}
        remaining={sheetId ? (countdowns.get(sheetId) ?? REQUEST_TIMEOUT) : REQUEST_TIMEOUT}
        total={REQUEST_TIMEOUT}
        accepting={busy?.id === sheetId && busy?.kind === "accept"}
        declining={busy?.id === sheetId && busy?.kind === "decline"}
        onAccept={accept}
        onDecline={decline}
        onClose={() => setSheetId(null)}
      />
    </View>
  );
}

function RouteRow({ color, label, sub, isFirst }: { color: string; label: string; sub: string; isFirst?: boolean }) {
  return (
    <View style={styles.routeRow}>
      <View style={styles.routeIndicator}>
        <View style={[styles.routeDot, { backgroundColor: color }]} />
        {isFirst && <View style={styles.routeLine} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.routeLabel} numberOfLines={1}>{label}</Text>
        <Text style={styles.routeSub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headKicker: { color: colors.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1.4 },
  headTitle: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 2 },
  avatarSm: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarSmText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  statusPillOn: { backgroundColor: colors.surfaceTint, borderColor: colors.accent },
  statusPillOff: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusDotOn: { backgroundColor: colors.accent },
  statusDotOff: { backgroundColor: colors.textDim },
  statusText: { fontSize: 12, fontWeight: "800" },
  statusTextOn: { color: colors.accentDim },
  statusTextOff: { color: colors.textMuted },
  dutyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  dutyIconOn: { backgroundColor: colors.accent },
  statsGrid: {
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  qaGrid: {
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  toggleCard: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleCardOn: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  toggleLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.6 },
  toggleSub: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 4 },
  statsRow: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  statValue: { color: colors.text, fontSize: 18, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  sectionHead: {
    marginTop: 26,
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  sectionCount: { color: colors.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  offlineNotice: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  offlineText: { color: colors.textMuted, fontSize: 13, flex: 1 },
  reqCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  reqCardActive: { borderColor: colors.accent, borderWidth: 2, padding: 15 },
  countdownBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.surfaceAlt,
  },
  countdownFill: {
    height: 3,
    borderRadius: 1.5,
  },
  reqTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  riderPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  riderName: { color: colors.text, fontSize: 14, fontWeight: "700" },
  riderMeta: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  riderRating: { color: colors.textMuted, fontSize: 11, marginLeft: 3 },
  riderDot: { color: colors.textDim, fontSize: 11 },
  riderTag: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  fareLg: { color: colors.text, fontSize: 18, fontWeight: "800" },
  fareSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  route: { marginTop: 14, gap: 2 },
  routeRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  routeIndicator: { width: 10, alignItems: "center", paddingTop: 4 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { width: 2, height: 22, backgroundColor: colors.border, marginTop: 4 },
  routeLabel: { color: colors.text, fontSize: 13, fontWeight: "600" },
  routeSub: { color: colors.textMuted, fontSize: 11, marginTop: 1, marginBottom: 8 },
  routePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  routePreviewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  routePreviewLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    borderStyle: "dashed",
  },
  routePreviewInfo: {
    flexDirection: "row",
    gap: 6,
  },
  routePreviewDistance: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  routePreviewDuration: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  reqActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  declineBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  declineText: { color: colors.danger, fontSize: 13, fontWeight: "700" },
  acceptBtn: {
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  acceptText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});
