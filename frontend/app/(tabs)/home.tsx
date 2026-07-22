import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius } from "@/src/theme";
import { pastTrips as mockTrips } from "@/src/data/mock";
import { api, Package, Ride } from "@/src/api";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CARD_W = SCREEN_W - 32;
const CAROUSEL_H = Math.round(SCREEN_H * 0.3); // 30vh

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [active, setActive] = useState(0);
  const [packages, setPackages] = useState<Package[]>([]);
  const [trips, setTrips] = useState<Ride[]>([]);

  // Fetch from backend (falls back to mock inside api client)
  useEffect(() => {
    api.listPackages().then(setPackages);
    api.listRides().then(setTrips);
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (packages.length === 0) return;
    const t = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % packages.length;
        listRef.current?.scrollToOffset({
          offset: next * (CARD_W + 12),
          animated: true,
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [packages.length]);

  return (
    <View style={styles.root} testID="home-screen">
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Namaste,</Text>
            <Text style={styles.name}>Explorer</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} testID="notifications-button">
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 30vh Carousel */}
        <View style={{ height: CAROUSEL_H }} testID="package-carousel">
          <FlatList
            ref={listRef}
            data={packages}
            horizontal
            pagingEnabled
            snapToInterval={CARD_W + 12}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            keyExtractor={(i) => i.id}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(
                e.nativeEvent.contentOffset.x / (CARD_W + 12),
              );
              setActive(i);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.card, { width: CARD_W, height: CAROUSEL_H - 16 }]}
                onPress={() => router.push("/plan")}
                testID={`package-card-${item.id}`}
              >
                <Image source={{ uri: item.image }} style={styles.cardImg} />
                <LinearGradient
                  colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.85)"]}
                  style={styles.cardShade}
                />
                <View style={styles.cardBody}>
                  <Text style={styles.cardKicker}>
                    {item.duration.toUpperCase()} · {item.stops} STOPS
                  </Text>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardPrice}>
                    ₹{item.price.toLocaleString("en-IN")}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Dots */}
        <View style={styles.dots}>
          {packages.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === active && styles.dotActive]}
            />
          ))}
        </View>

        {/* Plan Your Trip */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/plan")}
          activeOpacity={0.85}
          testID="plan-trip-button"
        >
          <View style={styles.actionIcon}>
            <Ionicons name="navigate" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Plan Your Trip</Text>
            <Text style={styles.actionSub}>Add stops, choose a ride, go</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Quick access card */}
        <TouchableOpacity
          style={styles.quickCard}
          activeOpacity={0.85}
          onPress={() => router.push("/ride")}
          testID="track-ride-card"
        >
          <View style={styles.quickIcon}>
            <Ionicons name="pulse" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickTitle}>Track a live ride</Text>
            <Text style={styles.quickSub}>See your driver on the map</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
        </TouchableOpacity>

        {/* Previous Trips */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Your previous trips</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/trips")}>
            <Text style={styles.sectionAction}>See all</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={trips.slice(0, 6)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          keyExtractor={(t) => t.id}
          renderItem={({ item, index }) => {
            const mock = mockTrips[index % mockTrips.length];
            const title = item.stops?.[0]?.label ?? mock.title;
            return (
              <TouchableOpacity
                style={styles.tripCard}
                activeOpacity={0.85}
                testID={`past-trip-${item.id}`}
              >
                <Image source={{ uri: mock.image }} style={styles.tripImg} />
                <LinearGradient
                  colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.85)"]}
                  style={styles.tripShade}
                />
                <View style={styles.tripBody}>
                  <Text style={styles.tripTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.tripDate}>
                    ₹{item.fare.toLocaleString("en-IN")}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  hello: { color: colors.textMuted, fontSize: 13 },
  name: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
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
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  cardImg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  cardShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
  },
  cardBody: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
  },
  cardKicker: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  cardPrice: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
    opacity: 0.95,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  dotActive: { backgroundColor: "#fff", width: 18 },
  actionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  actionSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  quickCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(30,107,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  quickSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  sectionAction: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  tripCard: {
    width: 200,
    height: 140,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  tripImg: { ...StyleSheet.absoluteFillObject },
  tripShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
  },
  tripBody: { position: "absolute", left: 12, right: 12, bottom: 10 },
  tripTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  tripDate: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 },
});
