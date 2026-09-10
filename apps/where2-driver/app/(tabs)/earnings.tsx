import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius } from "@/src/theme";
import { api, Ride, DriverStats } from "@/src/api";
import { EarningsSkeleton } from "@/src/components/loading";
import { SpringPress } from "@/src/components/spring-press";
import { FadeIn } from "@/src/components/fade-in";

export default function Earnings() {
  const insets = useSafeAreaInsets();
  const [rides, setRides] = useState<Ride[]>([]);
  const [stats, setStats] = useState<DriverStats>({ earnings: 0, trips: 0, hours: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const [r, s] = await Promise.all([api.listDriverRides(), api.driverStats()]);
    setRides(r);
    setStats(s);
  };

  useEffect(() => {
    fetchData()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData().catch(() => {});
    setRefreshing(false);
  };

  const completedRides = rides.filter((r) => r.status === "completed");
  const totalEarnings = completedRides.reduce((sum, r) => sum + r.fare, 0);
  const totalTips = completedRides.reduce((sum, r) => sum + (r.tip || 0), 0);

  if (loading) return <EarningsSkeleton />;

  return (
    <View style={styles.root} testID="earnings-screen">
      <StatusBar style="light" />

      <FlatList
        data={rides}
        keyExtractor={(i) => i.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <>
            <FadeIn delay={0}>
              <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.h1}>Earnings</Text>
                <Text style={styles.sub}>
                  {completedRides.length} completed rides
                </Text>
              </View>
            </FadeIn>

            <FadeIn delay={100}>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>₹{totalEarnings.toLocaleString("en-IN")}</Text>
                  <Text style={styles.statLabel}>Total earned</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.trips}</Text>
                  <Text style={styles.statLabel}>Trips</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.hours.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Hours</Text>
                </View>
              </View>
            </FadeIn>

            {totalTips > 0 && (
              <FadeIn delay={150}>
                <View style={styles.tipBanner}>
                  <Ionicons name="heart" size={14} color={colors.accent} />
                  <Text style={styles.tipText}>₹{totalTips.toLocaleString("en-IN")} in tips</Text>
                </View>
              </FadeIn>
            )}

            <FadeIn delay={200}>
              <Text style={styles.sectionTitle}>Ride History</Text>
            </FadeIn>
          </>
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 100,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item, index }) => {
          const isCompleted = item.status === "completed";
          const isCancelled = item.status === "cancelled";
          const pickup = item.stops?.[0]?.label;
          const drop = item.stops?.[item.stops.length - 1]?.label;
          return (
            <FadeIn delay={250 + index * 80}>
              <SpringPress>
                <View style={styles.rideCard}>
                  <View style={styles.rideTop}>
                    <View style={styles.rideIcon}>
                      <Ionicons
                        name={isCompleted ? "checkmark-circle" : isCancelled ? "close-circle" : "time"}
                        size={18}
                        color={isCompleted ? colors.success : isCancelled ? colors.danger : colors.accent}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rideRoute} numberOfLines={1}>
                        {pickup && drop ? `${pickup} → ${drop}` : "Unknown route"}
                      </Text>
                      <Text style={styles.rideDate}>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[styles.rideFare, isCancelled && { color: colors.danger }]}>
                        {isCancelled ? "Cancelled" : `₹${item.fare.toLocaleString("en-IN")}`}
                      </Text>
                      <Text style={styles.ridePayment}>
                        {item.payment_method?.toUpperCase() || "—"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rideStatus}>
                    <View
                      style={[
                        styles.statusBadge,
                        isCompleted && styles.statusBadgeGreen,
                        isCancelled && styles.statusBadgeRed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isCompleted && { color: colors.success },
                          isCancelled && { color: colors.danger },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                    {item.tip ? (
                      <Text style={styles.tipLabel}>+₹{item.tip} tip</Text>
                    ) : null}
                  </View>
                </View>
              </SpringPress>
            </FadeIn>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color={colors.textDim} />
            <Text style={styles.emptyText}>No rides yet</Text>
            <Text style={styles.emptySub}>Your earnings will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  h1: { color: colors.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  statValue: { color: colors.text, fontSize: 18, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  tipBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: "rgba(0,137,123,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,137,123,0.2)",
  },
  tipText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  rideCard: {
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rideTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  rideIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  rideRoute: { color: colors.text, fontSize: 14, fontWeight: "600" },
  rideDate: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  rideFare: { color: colors.text, fontSize: 16, fontWeight: "800" },
  ridePayment: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  rideStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  statusBadgeGreen: { backgroundColor: "rgba(34,197,94,0.10)" },
  statusBadgeRed: { backgroundColor: "rgba(228,72,60,0.10)" },
  statusBadgeText: { color: colors.textMuted, fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  tipLabel: { color: colors.accent, fontSize: 11, fontWeight: "600" },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyText: { color: colors.text, fontSize: 18, fontWeight: "700" },
  emptySub: { color: colors.textMuted, fontSize: 13 },
});
