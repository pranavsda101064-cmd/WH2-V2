import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius } from "@/src/theme";
import { pastTrips as mockTrips } from "@/src/data/mock";
import { api, Ride } from "@/src/api";

export default function Trips() {
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useState<Ride[]>([]);

  useEffect(() => {
    api.listRides().then(setTrips);
  }, []);

  return (
    <View style={styles.root} testID="trips-screen">
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.h1}>Your Trips</Text>
        <Text style={styles.sub}>{trips.length} rides in Sakleshpura</Text>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(i) => i.id}
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
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
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
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  h1: { color: "#fff", fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
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
  title: { color: "#fff", fontSize: 15, fontWeight: "700" },
  date: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  meta: { color: colors.textMuted, fontSize: 12 },
});
