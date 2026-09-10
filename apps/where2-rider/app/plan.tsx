import { useState } from "react";
import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { SpringPress } from "@/src/components/spring-press";

type StayItem = {
  id: string;
  stayNum: number;
  title: string;
  checkIn: string;
  checkOut: string;
  address: string;
  pickupLocation: string;
  image: string;
};

const INITIAL_STAYS: StayItem[] = [
  {
    id: "stay-1",
    stayNum: 1,
    title: "Greenwood Homestay",
    checkIn: "Sep 23",
    checkOut: "Sep 25",
    address: "156R Greenwood, 509 Kateesa",
    pickupLocation: "Local Homestay Stop",
    image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: "stay-2",
    stayNum: 2,
    title: "Hill View Stay",
    checkIn: "Aug 12",
    checkOut: "Aug 15",
    address: "Timasmpure Trip Road, Sakleshpur",
    pickupLocation: "Hill View Gate Pickup",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=70",
  },
];

export default function Plan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stays] = useState<StayItem[]>(INITIAL_STAYS);

  return (
    <View style={styles.root} testID="plan-screen">
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Hero Image Header */}
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=70",
            }}
            style={styles.heroImg}
          />
          <View style={styles.heroOverlay} />
          <View style={[styles.heroNav, { paddingTop: insets.top + 8 }]}>
            <SpringPress style={styles.navBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </SpringPress>
            <Text style={styles.heroTitle}>where2</Text>
            <SpringPress style={styles.navBtn} onPress={() => router.push("/notifications")}>
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
            </SpringPress>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text style={styles.pageTitle}>Plan Your Trip</Text>

          {/* Stays List */}
          {stays.map((stay) => (
            <View key={stay.id} style={styles.stayCard}>
              <View style={styles.stayHeader}>
                <Text style={styles.stayTag}>Stay {stay.stayNum}:</Text>
                <Text style={styles.stayName}>{stay.title}</Text>
              </View>
              <View style={styles.stayRow}>
                <Image source={{ uri: stay.image }} style={styles.stayImg} />
                <View style={styles.stayDetails}>
                  <Text style={styles.stayDate}>
                    Check in - {stay.checkIn}  |  Out: {stay.checkOut}
                  </Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.stayAddress} numberOfLines={2}>
                      {stay.address}
                    </Text>
                  </View>
                  <SpringPress
                    style={styles.pickupPill}
                    onPress={() => router.push("/location-picker?target=pickup")}
                  >
                    <Ionicons name="location" size={12} color={colors.accent} />
                    <Text style={styles.pickupPillText}>
                      Pickup: {stay.pickupLocation}
                    </Text>
                  </SpringPress>
                </View>
              </View>
            </View>
          ))}

          {/* Booking info */}
          <View style={styles.confirmCard}>
            <Text style={styles.confirmCardTitle}>Booking Details</Text>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.checkText}>
                This itinerary covers all your stays and route stops.
              </Text>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.checkText}>
                Confirmation sent to your driver and homestay host.
              </Text>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.checkText}>
                Free cancellation up to 2 hours before pickup.
              </Text>
            </View>
          </View>

          {/* Trip Rules */}
          <View style={styles.rulesCard}>
            <Text style={styles.rulesTitle}>Trip Guidelines</Text>
            <Text style={styles.ruleBullet}>
              Plastic-free zone: Please do not litter in Western Ghats eco-sensitive areas.
            </Text>
            <Text style={styles.ruleBullet}>
              Forest gates close at 6:00 PM for wildlife conservation.
            </Text>
            <Text style={styles.ruleBullet}>
              Carry a valid Government ID for homestay check-in.
            </Text>
          </View>

          {/* Confirm button */}
          <SpringPress
            style={styles.confirmBookingBtn}
            onPress={() => router.push("/vehicles")}
            testID="confirm-booking-btn"
          >
            <Text style={styles.confirmBookingText}>Confirm Booking</Text>
          </SpringPress>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  heroContainer: {
    height: 220, width: "100%", position: "relative",
  },
  heroImg: { width: "100%", height: "100%" },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  heroNav: {
    position: "absolute", left: 16, right: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },
  heroTitle: {
    color: "#FFFFFF", fontSize: 22, fontWeight: "700", letterSpacing: 1,
  },
  contentSection: {
    paddingHorizontal: 16, paddingTop: 16, gap: 16,
  },
  pageTitle: {
    color: colors.text, fontSize: font.title, fontWeight: "600",
  },
  stayCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  stayHeader: {
    flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10,
  },
  stayTag: { color: colors.accent, fontSize: font.label, fontWeight: "700" },
  stayName: { color: colors.text, fontSize: font.label, fontWeight: "600" },
  stayRow: { flexDirection: "row", gap: 12 },
  stayImg: { width: 80, height: 80, borderRadius: radius.md },
  stayDetails: { flex: 1, justifyContent: "space-between" },
  stayDate: { color: colors.textMuted, fontSize: font.caption, fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  stayAddress: { color: colors.text, fontSize: font.caption, fontWeight: "500" },
  pickupPill: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    backgroundColor: colors.surfaceTint, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: radius.pill, marginTop: 6,
  },
  pickupPillText: { color: colors.accent, fontSize: font.micro, fontWeight: "700" },
  confirmCard: {
    backgroundColor: colors.accent, borderRadius: radius.lg, padding: 16,
    gap: 10, ...shadows.accent,
  },
  confirmCardTitle: {
    color: "#FFFFFF", fontSize: font.subtitle, fontWeight: "600", marginBottom: 2,
  },
  checkItem: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  checkText: { color: "#FFFFFF", fontSize: font.small, lineHeight: 18, flex: 1 },
  rulesCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 8, ...shadows.sm,
  },
  rulesTitle: { color: colors.text, fontSize: font.subtitle, fontWeight: "600", marginBottom: 2 },
  ruleBullet: { color: colors.textMuted, fontSize: font.small, lineHeight: 20 },
  confirmBookingBtn: {
    backgroundColor: colors.accent, height: 52, borderRadius: radius.pill,
    alignItems: "center", justifyContent: "center", marginTop: 8, ...shadows.accent,
  },
  confirmBookingText: { color: "#FFFFFF", fontSize: font.body, fontWeight: "700" },
});
