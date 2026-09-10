import { useState } from "react";
import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { FadeIn } from "@/src/components/fade-in";
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
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Banner Hero Image Header with Logo "WHERE2" - Screen 1 */}
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
            <Text style={styles.heroTitle}>WHERE2</Text>
            <SpringPress style={styles.navBtn} onPress={() => router.push("/notifications")}>
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
            </SpringPress>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <FadeIn delay={100}>
            <Text style={styles.pageTitle}>Customisable Trip Details</Text>
          </FadeIn>

          {/* Stays List */}
          {stays.map((stay, i) => (
            <FadeIn key={stay.id} delay={150 + i * 50}>
              <View style={styles.stayCard}>
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
                    <TouchableOpacity
                      style={styles.pickupPill}
                      onPress={() => router.push("/location-picker?target=pickup")}
                    >
                      <Ionicons name="location" size={12} color={colors.accent} />
                      <Text style={styles.pickupPillText}>
                        Pickup Location: {stay.pickupLocation}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </FadeIn>
          ))}

          {/* Booking Confirmation Section - Green Card Screen 1 */}
          <FadeIn delay={250}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmCardTitle}>Booking Confirmation</Text>
              <View style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.checkText}>
                  This customized itinerary covers all your stays and route stops.
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.checkText}>
                  Instant confirmation sent directly to your driver and homestay host.
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.checkText}>
                  Zero cancellation charges up to 2 hours prior to pickup.
                </Text>
              </View>
            </View>
          </FadeIn>

          {/* Trip Rules Section */}
          <FadeIn delay={300}>
            <View style={styles.rulesCard}>
              <Text style={styles.rulesTitle}>Trip Rules & Guidelines</Text>
              <Text style={styles.ruleBullet}>
                • Plastic-free zone: Please do not litter plastic bottles or wrappers in Western Ghats eco-sensitive areas.
              </Text>
              <Text style={styles.ruleBullet}>
                • Forest gates close at 6:00 PM for night wildlife conservation.
              </Text>
              <Text style={styles.ruleBullet}>
                • Please carry a valid Government ID for homestay check-in verification.
              </Text>
            </View>
          </FadeIn>

          {/* Full Width Primary Action Bar - CONFIRM BOOKING Button */}
          <FadeIn delay={350}>
            <SpringPress
              style={styles.confirmBookingBtn}
              onPress={() => router.push("/vehicles")}
              testID="confirm-booking-btn"
            >
              <Text style={styles.confirmBookingText}>CONFIRM BOOKING</Text>
            </SpringPress>
          </FadeIn>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  heroContainer: {
    height: 220,
    width: "100%",
    position: "relative",
  },
  heroImg: { width: "100%", height: "100%" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  heroNav: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 3,
  },
  contentSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  stayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  stayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  stayTag: {
    color: colors.accent,
    fontSize: font.label,
    fontWeight: "800",
  },
  stayName: {
    color: colors.text,
    fontSize: font.label,
    fontWeight: "800",
  },
  stayRow: {
    flexDirection: "row",
    gap: 12,
  },
  stayImg: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
  },
  stayDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  stayDate: {
    color: colors.textMuted,
    fontSize: font.caption,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  stayAddress: {
    color: colors.text,
    fontSize: font.caption,
    fontWeight: "500",
  },
  pickupPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  pickupPillText: {
    color: colors.accent,
    fontSize: font.micro,
    fontWeight: "700",
  },
  confirmCard: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
    ...shadows.accent,
  },
  confirmCardTitle: {
    color: "#FFFFFF",
    fontSize: font.subtitle,
    fontWeight: "800",
    marginBottom: 2,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  checkText: {
    color: "#FFFFFF",
    fontSize: font.small,
    lineHeight: 18,
    flex: 1,
  },
  rulesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    ...shadows.sm,
  },
  rulesTitle: {
    color: colors.text,
    fontSize: font.subtitle,
    fontWeight: "800",
    marginBottom: 2,
  },
  ruleBullet: {
    color: colors.textMuted,
    fontSize: font.small,
    lineHeight: 20,
  },
  confirmBookingBtn: {
    backgroundColor: colors.accent,
    height: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    ...shadows.accent,
  },
  confirmBookingText: {
    color: "#FFFFFF",
    fontSize: font.body,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
