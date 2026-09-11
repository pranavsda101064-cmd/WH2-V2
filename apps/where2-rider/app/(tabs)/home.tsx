import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import {
  Alert,
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

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { pastTrips as mockTrips, savedRoutes } from "@/src/data/mock";
import { api, Package, Ride, getUserName } from "@/src/api";
import { storage } from "@/src/utils/storage";
import { reverseGeocode } from "@/src/utils/location";
import { HomeSkeleton } from "@/src/components/loading";
import { FadeIn } from "@/src/components/fade-in";
import { SpringPress } from "@/src/components/spring-press";
import { TOURIST_PLACES } from "@/src/utils/location";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CARD_W = SCREEN_W - 32;
const CAROUSEL_H = Math.round(SCREEN_H * 0.28);

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(0);
  const [packages, setPackages] = useState<Package[]>([]);
  const [trips, setTrips] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [pickupLoc, setPickupLoc] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [dropoffLoc, setDropoffLoc] = useState<{ lat: number; lng: number; label: string } | null>(null);

  useEffect(() => {
    Promise.all([api.listPackages(), api.listRides()])
      .then(([p, t]) => { setPackages(p); setTrips(t); })
      .catch(() => {})
      .finally(() => setLoading(false));
    getUserName().then((n) => { if (n) setUserName(n); });
  }, []);

  // Auto-detect GPS pickup on first load
  useEffect(() => {
    (async () => {
      const p = await storage.getItem<{ lat: number; lng: number; label: string } | null>("pickup_location", null);
      if (p) {
        setPickupLoc(p);
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const addr = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
            const detected = { lat: loc.coords.latitude, lng: loc.coords.longitude, label: addr || "Current location" };
            setPickupLoc(detected);
            await storage.setItem("pickup_location", detected);
          } catch {}
        }
      }
    })();
  }, []);

  // Re-read locations when screen comes into focus (after picking from location-picker)
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      (async () => {
        const p = await storage.getItem<{ lat: number; lng: number; label: string } | null>("pickup_location", null);
        const d = await storage.getItem<{ lat: number; lng: number; label: string } | null>("dropoff_location", null);
        if (p) setPickupLoc(p);
        if (d) setDropoffLoc(d);
      })();
    });
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
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
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Where2!?</Text>
            <Text style={styles.name}>{(userName || "Explorer").split(" ")[0]}</Text>
          </View>
          <SpringPress style={styles.iconBtn} onPress={() => router.push("/notifications")} testID="notifications-button">
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
          </SpringPress>
        </View>

        {/* Pickup + Dropoff Search */}
        <View style={styles.searchContainer}>
          <SpringPress
            style={styles.searchField}
            onPress={() => router.push("/location-picker?target=pickup")}
            testID="pickup-field"
          >
            <View style={styles.searchDot} />
            <Text style={[styles.searchFieldText, !pickupLoc && { color: colors.textMuted }]} numberOfLines={1}>
              {pickupLoc?.label || "Current location"}
            </Text>
          </SpringPress>

          <View style={styles.searchDivider} />

          <SpringPress
            style={styles.searchField}
            onPress={() => router.push("/location-picker?target=dropoff")}
            testID="dropoff-field"
          >
            <View style={[styles.searchDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.searchFieldText, !dropoffLoc && { color: colors.textMuted }]} numberOfLines={1}>
              {dropoffLoc?.label || "Where to?"}
            </Text>
          </SpringPress>
        </View>

        {/* Find Rides Button - shown when both pickup and dropoff are set */}
        {pickupLoc && dropoffLoc && (
          <SpringPress
            style={styles.findRidesBtn}
            onPress={() => router.push("/vehicles")}
            testID="find-rides-button"
          >
            <Text style={styles.findRidesText}>Find rides</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </SpringPress>
        )}

        {/* Nearby Locations Horizontal Scroll */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Nearby Locations</Text>
          <SpringPress onPress={() => router.push("/plan")}>
            <Text style={styles.sectionAction}>See all</Text>
          </SpringPress>
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
                style={styles.nearbyCard}
                onPress={() => router.push("/location-picker?target=dropoff")}
              >
                <View style={styles.nearbyIcon}>
                  <Ionicons name={item.icon} size={20} color={colors.accent} />
                </View>
                <Text style={styles.nearbyTitle} numberOfLines={1}>{item.to}</Text>
                <Text style={styles.nearbySub} numberOfLines={1}>{item.tag}</Text>
              </SpringPress>
            </FadeIn>
          )}
        />

        {/* Curated Trip Plans Section - Screen 2 */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Explore Routes</Text>
          <SpringPress onPress={() => router.push("/plan")}>
            <Text style={styles.sectionAction}>See all</Text>
          </SpringPress>
        </View>

        <View style={{ height: CAROUSEL_H }} testID="package-carousel">
          <FlatList
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
              const i = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 12));
              setActive(i);
            }}
            renderItem={({ item }) => (
              <SpringPress
                style={[styles.card, { width: CARD_W, height: CAROUSEL_H - 12 }]}
                onPress={() => router.push("/plan")}
                testID={`package-card-${item.id}`}
              >
                <Image source={{ uri: item.image }} style={styles.cardImg} />
                <LinearGradient
                  colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.75)"]}
                  style={styles.cardShade}
                />
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{item.duration} · {item.stops} STOPS</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title.toUpperCase()}
                  </Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardPrice}>₹{item.price.toLocaleString("en-IN")}</Text>
                    <View style={styles.readRoomBtn}>
                      <Text style={styles.readRoomText}>Read Details</Text>
                    </View>
                  </View>
                </View>
              </SpringPress>
            )}
          />
        </View>

        {/* Dots Indicator */}
        <View style={styles.dots}>
          {packages.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === active && styles.dotActive]}
            />
          ))}
        </View>

        {/* Action Card - Trip Route Builder */}
        <SpringPress
          style={styles.actionCard}
          onPress={() => router.push("/plan")}
          testID="plan-trip-button"
        >
          <View style={styles.actionIcon}>
            <Ionicons name="map" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Trip Route Builder</Text>
            <Text style={styles.actionSub}>Customize homestays, stops & rides</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </SpringPress>

        {/* Popular Tourist Destinations */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Popular Places</Text>
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
                  try {
                    await storage.setItem("dropoff_location", { lat: item.lat, lng: item.lng, label: item.name });
                    router.push("/location-picker?target=dropoff");
                  } catch {
                    Alert.alert("Error", "Could not set location. Please try again.");
                  }
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

        {/* Previous Trips */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent Rides</Text>
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
              <SpringPress style={styles.tripCard} testID={`past-trip-${item.id}`}>
                <Image source={{ uri: mock.image }} style={styles.tripImg} />
                <LinearGradient
                  colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]}
                  style={styles.tripShade}
                />
                <View style={styles.tripBody}>
                  <Text style={styles.tripTitle} numberOfLines={1}>{title}</Text>
                  <Text style={styles.tripDate}>₹{item.fare.toLocaleString("en-IN")}</Text>
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
    paddingBottom: spacing.sm,
  },
  hello: { color: colors.textMuted, fontSize: font.small, fontWeight: "500" },
  name: { color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  searchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderStrong,
  },
  searchFieldText: {
    flex: 1,
    color: colors.text,
    fontSize: font.body,
    fontWeight: "500",
  },
  searchDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 14,
  },
  findRidesBtn: {
    marginHorizontal: 16,
    marginTop: 10,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadows.accent,
  },
  findRidesText: {
    color: "#fff",
    fontSize: font.body,
    fontWeight: "700",
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "600" },
  sectionAction: { color: colors.accent, fontSize: font.small, fontWeight: "700" },
  nearbyCard: {
    width: 130,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  nearbyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  nearbyTitle: { color: colors.text, fontSize: font.small, fontWeight: "700" },
  nearbySub: { color: colors.textMuted, fontSize: font.caption, marginTop: 2 },
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  cardImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  cardShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "75%",
  },
  cardBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  cardBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  cardBody: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: font.title,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: font.small,
    fontWeight: "500",
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cardPrice: {
    color: "#FFFFFF",
    fontSize: font.title,
    fontWeight: "800",
  },
  readRoomBtn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  readRoomText: { color: "#FFFFFF", fontSize: font.caption, fontWeight: "700" },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
  },
  dotActive: { backgroundColor: colors.accent, width: 18 },
  actionCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...shadows.sm,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { color: colors.text, fontSize: font.subtitle, fontWeight: "800" },
  actionSub: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  spotCard: {
    width: 150,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  spotTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.surfaceTint,
    marginBottom: spacing.xs,
  },
  spotTagText: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  spotName: { color: colors.text, fontSize: font.label, fontWeight: "700" },
  spotDesc: { color: colors.textMuted, fontSize: font.caption, marginTop: 2 },
  tripCard: {
    width: 190,
    height: 130,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surface,
    ...shadows.sm,
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
  tripTitle: { color: "#FFFFFF", fontSize: font.label, fontWeight: "700" },
  tripDate: { color: "rgba(255,255,255,0.85)", fontSize: font.micro, marginTop: 2 },
});
