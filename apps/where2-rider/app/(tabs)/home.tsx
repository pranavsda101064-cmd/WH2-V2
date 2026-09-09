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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, font, spacing } from "@/src/theme";
import { pastTrips as mockTrips, savedRoutes } from "@/src/data/mock";
import { api, Package, Ride, getUserName } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { HomeSkeleton } from "@/src/components/loading";
import { FadeIn } from "@/src/components/fade-in";
import { SpringPress } from "@/src/components/spring-press";
import { TOURIST_PLACES } from "@/src/utils/location";

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
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  // Fetch from backend (falls back to mock inside api client)
  useEffect(() => {
    Promise.all([api.listPackages(), api.listRides()])
      .then(([p, t]) => { setPackages(p); setTrips(t); })
      .catch(() => {})
      .finally(() => setLoading(false));
    getUserName().then((n) => { if (n) setUserName(n); });
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

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: insets.top + 12 }}
        >
          <HomeSkeleton />
        </ScrollView>
      </View>
    );
  }

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
            <Text style={styles.name}>{userName || "Explorer"}</Text>
          </View>
          <SpringPress style={styles.iconBtn} onPress={() => router.push("/notifications")} testID="notifications-button">
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </SpringPress>
        </View>

        {/* Where to? search bar */}
        <SpringPress
          style={[styles.searchBar, { marginHorizontal: 16, marginTop: 4 }]}
          onPress={() => router.push("/location-picker?target=dropoff")}
          testID="search-bar"
        >
          <View style={styles.searchDot} />
          <Text style={styles.searchText}>Where to?</Text>
          <View style={styles.searchIconRight}>
            <Ionicons name="time-outline" size={16} color={colors.textDim} />
          </View>
        </SpringPress>

        {/* Quick Routes */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Quick routes</Text>
        </View>
        <FlatList
          data={savedRoutes}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FadeIn delay={80}>
              <SpringPress
                style={styles.routeCard}
                onPress={() => router.push("/location-picker?target=dropoff")}
              >
                <View style={styles.routeIcon}>
                  <Ionicons name={item.icon} size={18} color={colors.accent} />
                </View>
                <Text style={styles.routeFrom} numberOfLines={1}>{item.from}</Text>
                <Text style={styles.routeTo} numberOfLines={1}>{item.to}</Text>
                <View style={styles.routeTag}>
                  <Ionicons name="navigate-outline" size={10} color={colors.accent} />
                  <Text style={styles.routeTagText}>{item.tag}</Text>
                </View>
              </SpringPress>
            </FadeIn>
          )}
        />

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
              <SpringPress
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
              </SpringPress>
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
        <SpringPress
          style={styles.actionCard}
          onPress={() => router.push("/plan")}
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
        </SpringPress>

        {/* Popular tourist spots */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Popular places to visit</Text>
        </View>
        <FlatList
          data={TOURIST_PLACES.slice(0, 6)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <FadeIn delay={100}>
              <SpringPress
                style={styles.spotCard}
                onPress={async () => {
                  await storage.setItem("dropoff_location", JSON.stringify({ lat: item.lat, lng: item.lng, label: item.name }));
                  router.push("/location-picker?target=dropoff");
                }}
              >
                <View style={styles.spotTag}>
                  <Text style={styles.spotTagText}>{item.tag}</Text>
                </View>
                <Text style={styles.spotName}>{item.name}</Text>
                <Text style={styles.spotDesc} numberOfLines={1}>{item.description}</Text>
              </SpringPress>
            </FadeIn>
          )}
        />

        {/* Quick access card */}
        <SpringPress
          style={styles.quickCard}
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
        </SpringPress>

        {/* Previous Trips */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Your previous trips</Text>
          <SpringPress onPress={() => router.push("/(tabs)/trips")}>
            <Text style={styles.sectionAction}>See all</Text>
          </SpringPress>
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
              <SpringPress
                style={styles.tripCard}
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
              </SpringPress>
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
    paddingBottom: spacing.md,
  },
  hello: { color: colors.textMuted, fontSize: font.small },
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 26,
    height: 52,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  searchText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: font.subtitle,
    fontWeight: "500",
  },
  searchIconRight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  cardImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
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
    fontSize: font.micro,
    letterSpacing: 1.5,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  cardTitle: {
    color: "#fff",
    fontSize: font.h2,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  cardPrice: {
    color: "#fff",
    fontSize: font.label,
    fontWeight: "600",
    marginTop: 6,
    opacity: 0.95,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  dotActive: { backgroundColor: "#fff", width: 18 },
  actionCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
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
  actionTitle: { color: "#fff", fontSize: font.subtitle, fontWeight: "700" },
  actionSub: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  quickCard: {
    marginHorizontal: spacing.md,
    marginTop: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
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
  quickTitle: { color: "#fff", fontSize: font.body, fontWeight: "700" },
  quickSub: { color: colors.textMuted, fontSize: font.caption, marginTop: 2 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  sectionAction: { color: colors.accent, fontSize: font.small, fontWeight: "600" },
  routeCard: {
    width: 140, padding: 14, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  routeIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(30,107,255,0.12)",
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  routeFrom: { color: "#fff", fontSize: font.small, fontWeight: "700" },
  routeTo: { color: colors.textMuted, fontSize: font.caption, marginTop: 2 },
  routeTag: { flexDirection: "row", alignItems: "center",     gap: 4, marginTop: spacing.sm },
  routeTagText: { color: colors.accent, fontSize: font.micro, fontWeight: "600" },
  spotCard: {
    width: 150,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  spotTag: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(30,107,255,0.12)",
    marginBottom: spacing.sm,
  },
  spotTagText: { color: colors.accent, fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
  spotName: { color: "#fff", fontSize: font.label, fontWeight: "700" },
  spotDesc: { color: colors.textMuted, fontSize: font.caption, marginTop: spacing.xs },
  tripCard: {
    width: 200,
    height: 140,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  tripImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  tripShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
  },
  tripBody: { position: "absolute", left: 12, right: 12, bottom: 10 },
  tripTitle: { color: "#fff", fontSize: font.label, fontWeight: "700" },
  tripDate: { color: "rgba(255,255,255,0.7)", fontSize: font.micro, marginTop: 2 },
});
