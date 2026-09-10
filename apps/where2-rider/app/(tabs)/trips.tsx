import { useEffect, useState } from "react";
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

export default function Trips() {
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <View style={styles.root} testID="trips-screen">
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.h1}>Your Trips</Text>
        <Text style={styles.sub}>
          {loading ? "Loading..." : `${trips.length} rides in Sakleshpura`}
        </Text>
      </View>

      {loading ? (
        <HomeSkeleton />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(i) => i.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 100,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item, index }) => {
            const mock = mockTrips[index % mockTrips.length];
            const title = item.stops?.[0]?.label ?? mock.title;
            const isCompleted = item.status === "completed";
            return (
              <FadeIn delay={index * 60}>
                <SpringPress
                  style={styles.card}
                  testID={`trip-item-${item.id}`}
                >
                  <Image source={{ uri: mock.image }} style={styles.thumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={styles.date}>
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })}
                    </Text>
                    <View style={styles.metaRow}>
                      <Ionicons
                        name={isCompleted ? "checkmark-circle" : "time"}
                        size={12}
                        color={isCompleted ? colors.success : colors.accent}
                      />
                      <Text style={styles.meta}>
                        {isCompleted ? "Completed" : item.status} · ₹
                        {item.fare.toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
                </SpringPress>
              </FadeIn>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="map-outline" size={48} color={colors.textDim} />
              <Text style={styles.emptyText}>No trips yet</Text>
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
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  h1: { color: colors.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
  sub: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.xs },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  thumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  title: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  date: { color: colors.textMuted, fontSize: font.caption, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  meta: { color: colors.textMuted, fontSize: font.caption },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: spacing.sm,
  },
  emptyText: { color: colors.text, fontSize: 18, fontWeight: "700" },
  emptySub: { color: colors.textMuted, fontSize: font.small },
});
