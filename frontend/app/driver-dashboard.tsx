import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
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

import { colors, radius } from "@/src/theme";
import { api, DriverRequest, DriverStats } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { LoadingScreen } from "@/src/components/loading";

const POLL_INTERVAL = 10000;

export default function DriverDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [online, setOnline] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [stats, setStats] = useState<DriverStats>({ earnings: 0, trips: 0, hours: 0 });
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([api.listDriverRequests(), api.driverStats()]);
      setRequests(r);
      setStats(s);
    } catch {}
  }, []);

  useEffect(() => {
    fetchRequests().finally(() => setLoading(false));
  }, [fetchRequests]);

  useEffect(() => {
    if (requests.length > 0 && !selected) setSelected(requests[0].id);
  }, [requests, selected]);

  useEffect(() => {
    if (online) {
      pollRef.current = setInterval(fetchRequests, POLL_INTERVAL);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [online, fetchRequests]);

  const accept = async (id: string) => {
    const ride = await api.acceptRequest(id).catch(() => null);
    if (ride?.id) await storage.setItem("active_ride_id", ride.id);
    setRequests((prev) => prev.filter((x) => x.id !== id));
    setSelected(null);
    router.push("/ride");
  };

  const decline = async (id: string) => {
    await api.declineRequest(id).catch(() => {});
    setRequests((prev) => prev.filter((x) => x.id !== id));
    setSelected((prev) => (prev === id ? null : prev));
  };

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  return (
    <View style={styles.root} testID="driver-dashboard">
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} testID="dashboard-back">
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.headKicker}>Sakleshpura · Hassan</Text>
            <Text style={styles.headTitle}>Driver dashboard</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/driver")} testID="dashboard-profile">
            <Ionicons name="person-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Online toggle */}
        <View style={[styles.toggleCard, online && styles.toggleCardOn]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleLabel, online && { color: colors.accent }]}>
              {online ? "YOU'RE ONLINE" : "YOU'RE OFFLINE"}
            </Text>
            <Text style={styles.toggleSub}>
              {online ? "Receiving ride requests" : "Go online to earn"}
            </Text>
          </View>
          <Switch
            value={online}
            onValueChange={setOnline}
            trackColor={{ false: "#2A2C30", true: colors.accentDim }}
            thumbColor={online ? colors.accent : "#f4f3f4"}
            ios_backgroundColor="#2A2C30"
            testID="dashboard-online-toggle"
          />
        </View>

        {/* Today stats */}
        <View style={styles.statsRow}>
          <Stat label="Earnings" value={`₹${stats.earnings.toLocaleString("en-IN")}`} accent />
          <View style={styles.statDivider} />
          <Stat label="Trips" value={String(stats.trips)} />
          <View style={styles.statDivider} />
          <Stat label="Hours" value={stats.hours.toFixed(1)} />
        </View>

        {/* Incoming */}
        <View style={styles.sectionHead}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={styles.liveDot} />
            <Text style={styles.sectionTitle}>Incoming requests</Text>
          </View>
          <Text style={styles.sectionCount}>{requests.length} live</Text>
        </View>

        {!online && (
          <View style={styles.offlineNotice}>
            <Ionicons name="moon-outline" size={16} color={colors.textMuted} />
            <Text style={styles.offlineText}>
              You&apos;re offline. Go online to receive new ride requests.
            </Text>
          </View>
        )}

        {online && requests.length === 0 && (
          <View style={styles.offlineNotice}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={styles.offlineText}>Waiting for ride requests...</Text>
          </View>
        )}

        {online &&
          requests.map((r) => {
            const isActive = selected === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                activeOpacity={0.9}
                style={[styles.reqCard, isActive && styles.reqCardActive]}
                onPress={() => setSelected(isActive ? null : r.id)}
                testID={`request-${r.id}`}
              >
                <View style={styles.reqTop}>
                  <View style={styles.riderPhoto}>
                    <Ionicons name="person" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.riderName}>{r.rider}</Text>
                    <View style={styles.riderMeta}>
                      <Ionicons name="star" size={10} color="#fff" />
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
                  <RouteRow color="#fff" label={r.pickup} sub="Pickup" isFirst />
                  <RouteRow color={colors.accent} label={r.drop} sub="Drop-off" />
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
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => accept(r.id)}
                      testID={`accept-${r.id}`}
                    >
                      <Text style={styles.acceptText}>Accept ride</Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={[styles.statValue, accent && { color: colors.accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  headKicker: { color: colors.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1.4 },
  headTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 2 },
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
  toggleSub: { color: "#fff", fontSize: 15, fontWeight: "700", marginTop: 4 },
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
  statValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
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
  sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
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
  },
  reqCardActive: { borderColor: colors.accent, borderWidth: 2, padding: 15 },
  reqTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  riderPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  riderName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  riderMeta: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  riderRating: { color: "#fff", fontSize: 11, marginLeft: 3 },
  riderDot: { color: colors.textDim, fontSize: 11 },
  riderTag: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  fareLg: { color: "#fff", fontSize: 18, fontWeight: "800" },
  fareSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  route: { marginTop: 14, gap: 2 },
  routeRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  routeIndicator: { width: 10, alignItems: "center", paddingTop: 4 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { width: 2, height: 22, backgroundColor: colors.border, marginTop: 4 },
  routeLabel: { color: "#fff", fontSize: 13, fontWeight: "600" },
  routeSub: { color: colors.textMuted, fontSize: 11, marginTop: 1, marginBottom: 8 },
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
    flex: 2,
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
