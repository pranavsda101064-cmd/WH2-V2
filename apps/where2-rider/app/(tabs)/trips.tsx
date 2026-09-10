import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius, font, spacing } from "@/src/theme";
import { pastTrips as mockTrips } from "@/src/data/mock";
import { api, Ride } from "@/src/api";
import { HomeSkeleton } from "@/src/components/loading";
import { FadeIn } from "@/src/components/fade-in";
import { SpringPress } from "@/src/components/spring-press";

type Filter = "all" | "active" | "completed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

function StatusBadge({ status }: { status: Ride["status"] }) {
  const config = {
    completed: { bg: "rgba(34,197,94,0.12)", color: colors.success, label: "Completed" },
    pending: { bg: "rgba(0,137,123,0.12)", color: colors.accent, label: "Pending" },
    arriving: { bg: "rgba(0,137,123,0.12)", color: colors.accent, label: "Arriving" },
    onboard: { bg: "rgba(0,137,123,0.12)", color: colors.accent, label: "On ride" },
    arrived: { bg: "rgba(0,137,123,0.12)", color: colors.accent, label: "Arrived" },
    cancelled: { bg: "rgba(228,72,60,0.12)", color: colors.danger, label: "Cancelled" },
  } as const;
  const c = config[status] || config.pending;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

export default function Trips() {
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const fetchData = async () => {
    const r = await api.listRides();
    setTrips(r);
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

  const filtered = useMemo(() => {
    if (filter === "all") return trips;
    if (filter === "active") return trips.filter((t) => t.status !== "completed" && t.status !== "cancelled");
    return trips.filter((t) => t.status === "completed");
  }, [trips, filter]);

  return (
    <View style={styles.root} testID="trips-screen">
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.h1}>Your Trips</Text>
        <Text style={styles.sub}>
          {loading ? "Loading..." : `${trips.length} ride${trips.length !== 1 ? "s" : ""} in Sakleshpura`}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = f.key === filter;
          return (
            <SpringPress
              key={f.key}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {f.label}
              </Text>
            </SpringPress>
          );
        })}
      </View>

      {loading ? (
        <HomeSkeleton />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 100,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item, index }) => {
            const mock = mockTrips[index % mockTrips.length];
            const title = item.stops?.[0]?.label ?? mock.title;
            return (
              <FadeIn delay={index * 60}>
                <SpringPress
                  style={styles.card}
                  testID={`trip-item-${item.id}`}
                >
                  <Image source={{ uri: mock.image }} style={styles.thumb} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.title} numberOfLines={1}>
                        {title}
                      </Text>
                      <StatusBadge status={item.status} />
                    </View>
                    <Text style={styles.date}>
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.meta}>
                        ₹{item.fare.toLocaleString("en-IN")}
                      </Text>
                      {item.stops && item.stops.length > 1 && (
                        <Text style={styles.metaDot}> · {item.stops.length} stops</Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
                </SpringPress>
              </FadeIn>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={48} color={colors.textDim} />
              <Text style={styles.emptyText}>No {filter !== "all" ? filter : ""} trips yet</Text>
              <Text style={styles.emptySub}>Your ride history will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  h1: { color: colors.text, fontSize: font.title, fontWeight: "600" },
  sub: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.xs },

  // Filter pills
  filterRow: {
    flexDirection: "row", gap: spacing.sm,
    paddingHorizontal: 20, paddingBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: radius.pill, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.accent, borderColor: colors.accent,
  },
  filterText: {
    fontSize: font.small, fontWeight: "600", color: colors.textMuted,
  },
  filterTextActive: { color: "#FFFFFF" },

  // Card
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
  },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: colors.text, fontSize: font.body, fontWeight: "600", flex: 1 },
  date: { color: colors.textMuted, fontSize: font.caption, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  meta: { color: colors.textMuted, fontSize: font.caption },
  metaDot: { color: colors.textMuted, fontSize: font.caption },

  // Badge
  badge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },

  // Empty
  empty: {
    alignItems: "center", justifyContent: "center",
    paddingTop: 80, gap: spacing.sm,
  },
  emptyText: { color: colors.text, fontSize: font.subtitle, fontWeight: "600" },
  emptySub: { color: colors.textMuted, fontSize: font.small },
});
