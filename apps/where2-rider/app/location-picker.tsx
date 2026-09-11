import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MapView, Marker, Polyline, PROVIDER_DEFAULT, MapPlaceholder } from "@/src/components/map-view";
import * as Location from "expo-location";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import { SpringPress } from "@/src/components/spring-press";
import {
  isWithinServiceArea,
  TOURIST_PLACES,
  parseGoogleMapsUrl,
  resolveGoogleMapsUrl,
  reverseGeocode,
} from "@/src/utils/location";

const SAKLESHPURA = { latitude: 13.0358, longitude: 75.7827 };

export default function LocationPicker() {
  const router = useRouter();
  const { target = "dropoff" } = useLocalSearchParams<{ target: "pickup" | "dropoff" }>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [region, setRegion] = useState({
    ...SAKLESHPURA,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [outsideArea, setOutsideArea] = useState(false);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(target === "dropoff");
  const [parsingUrl, setParsingUrl] = useState(false);

  const [otherLocation, setOtherLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      const otherKey = target === "pickup" ? "dropoff_location" : "pickup_location";
      const raw = await storage.getItem<{ lat: number; lng: number; label: string } | null>(otherKey, null);
      if (raw) {
        setOtherLocation(raw);
      }

      // Load current target location if it already exists
      const currentKey = target === "pickup" ? "pickup_location" : "dropoff_location";
      const current = await storage.getItem<{ lat: number; lng: number; label: string } | null>(currentKey, null);
      if (current) {
        const savedRegion = {
          latitude: current.lat,
          longitude: current.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        setRegion(savedRegion);
        setMarker({ latitude: current.lat, longitude: current.lng });
        setLabel(current.label);
        const within = isWithinServiceArea(current.lat, current.lng);
        setOutsideArea(!within);
        mapRef.current?.animateToRegion(savedRegion, 500);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setLoading(true);
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const newRegion = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          };
          setRegion(newRegion);
          setMarker({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          const addr = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
          setLabel(addr);
          const within = isWithinServiceArea(loc.coords.latitude, loc.coords.longitude);
          setOutsideArea(!within);
          mapRef.current?.animateToRegion(newRegion, 500);
        } catch {}
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (marker && otherLocation) {
      fetchRoute(
        { latitude: marker.latitude, longitude: marker.longitude },
        { latitude: otherLocation.lat, longitude: otherLocation.lng },
      );
    } else {
      setRouteCoords([]);
    }
  }, [marker?.latitude, marker?.longitude, otherLocation?.lat, otherLocation?.lng]);

  const fetchRoute = async (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
  ) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.[0]?.geometry?.coordinates) {
        const coords = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => ({ latitude: c[1], longitude: c[0] }),
        );
        setRouteCoords(coords);
        if (coords.length > 1) {
          mapRef.current?.fitToCoordinates([from, to], {
            edgePadding: { top: 100, right: 60, bottom: 200, left: 60 },
            animated: true,
          });
        }
      }
    } catch {}
  };

  const handleSearchInput = useCallback((text: string) => {
    setSearchQuery(text);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (text.includes("google.com/maps") || text.includes("maps.app.goo.gl") || text.includes("goo.gl/maps")) {
      setParsingUrl(true);
      resolveGoogleMapsUrl(text).then((resolved) => {
        const coords = parseGoogleMapsUrl(resolved);
        setParsingUrl(false);
        if (coords) {
          applyLocation(coords.lat, coords.lng, "Pasted location");
          setSearchQuery("");
        } else {
          Alert.alert("Could not parse", "Could not extract location from this link.");
        }
      });
      return;
    }

    const coordMatch = text.match(/^\s*(-?\d{1,3}\.\d{2,7})\s*[,/]\s*(-?\d{1,3}\.\d{2,7})\s*$/);
    if (coordMatch) {
      applyLocation(parseFloat(coordMatch[1]), parseFloat(coordMatch[2]), "Pinned location");
      setSearchQuery("");
      return;
    }

    if (text.length >= 3) {
      searchTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&countrycodes=in`,
            { headers: { "User-Agent": "Where2App/1.0" } },
          );
          const data = await res.json();
          setSearchResults(data);
        } catch {
          setSearchResults([]);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }
  }, []);

  const applyLocation = async (lat: number, lng: number, searchLabel?: string) => {
    const within = isWithinServiceArea(lat, lng);
    setOutsideArea(!within);
    const newRegion = { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    setRegion(newRegion);
    setMarker({ latitude: lat, longitude: lng });
    mapRef.current?.animateToRegion(newRegion, 500);
    if (!searchLabel) {
      setLoading(true);
      const addr = await reverseGeocode(lat, lng);
      setLabel(addr);
      setLoading(false);
    } else {
      setLabel(searchLabel);
    }
  };

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    await applyLocation(latitude, longitude);
  };

  const handleSearchSelect = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const within = isWithinServiceArea(lat, lng);
    setOutsideArea(!within);
    const newRegion = { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    setRegion(newRegion);
    setMarker({ latitude: lat, longitude: lng });
    setLabel(item.display_name);
    setSearchResults([]);
    setSearchQuery("");
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  const handleSuggestionSelect = (place: typeof TOURIST_PLACES[0]) => {
    applyLocation(place.lat, place.lng, `${place.name} — ${place.description}`);
    setShowSuggestions(false);
  };

  const useMyLocation = async () => {
    setLoading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await applyLocation(loc.coords.latitude, loc.coords.longitude);
    } catch {
      Alert.alert("Error", "Could not get your location");
    }
    setLoading(false);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.searchContainer, { top: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Choose Location</Text>
        <View style={[styles.searchBox, outsideArea && styles.searchBoxError]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a location..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearchInput}
          />
          {parsingUrl && <ActivityIndicator size="small" color={colors.accent} />}
          {!parsingUrl && searchQuery.length > 0 && (
            <SpringPress onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </SpringPress>
          )}
        </View>

        {searchResults.length > 0 && (
          <View style={styles.resultsList}>
            {searchResults.map((item, i) => (
              <SpringPress key={i} style={styles.resultItem} onPress={() => handleSearchSelect(item)}>
                <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                <Text style={styles.resultText} numberOfLines={2}>{item.display_name}</Text>
              </SpringPress>
            ))}
          </View>
        )}
      </View>

      {/* Outside area banner */}
      {outsideArea && (
        <View style={[styles.areaBanner, { top: insets.top + (searchResults.length > 0 ? 280 : 130) }]}>
          <Ionicons name="warning" size={18} color={colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.areaBannerTitle}>Outside service area</Text>
            <Text style={styles.areaBannerText}>Pick a location near Sakleshpura.</Text>
          </View>
        </View>
      )}

      {/* Map */}
      {Platform.OS !== "web" && MapView ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
          provider={PROVIDER_DEFAULT}
        >
          {marker && (
            <Marker coordinate={marker}>
              <View style={[styles.customMarker, outsideArea && styles.customMarkerDanger]}>
                <Text style={styles.markerBadgeText}>A</Text>
              </View>
            </Marker>
          )}
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeColor={colors.accent} strokeWidth={4} />
          )}
        </MapView>
      ) : (
        <MapPlaceholder style={styles.map} />
      )}

      {/* My location FAB */}
      <SpringPress style={[styles.fab, { bottom: insets.bottom + 175 }]} onPress={useMyLocation}>
        <Ionicons name="locate" size={22} color={colors.accent} />
      </SpringPress>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      )}

      {/* Tourist suggestions */}
      {showSuggestions && !marker && (
        <View style={[styles.suggestionsRow, { bottom: insets.bottom + 180 }]}>
          <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8 }}>
            {TOURIST_PLACES.slice(0, 4).map((place) => (
              <SpringPress
                key={place.name}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionSelect(place)}
              >
                <Text style={styles.suggestionTag}>{place.tag}</Text>
                <Text style={styles.suggestionName}>{place.name}</Text>
              </SpringPress>
            ))}
          </View>
        </View>
      )}

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16 }]}>
          {marker && (
            <View style={styles.locationCard}>
              <View style={styles.nodeBadge}>
                <Text style={styles.nodeBadgeText}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationCardTitle}>Selected Location</Text>
                <Text style={styles.locationCardSub} numberOfLines={1}>
                  {label || "Tap map to select"}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.bottomActions}>
            <SpringPress style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </SpringPress>
            <SpringPress
              style={[styles.confirmBtn, (!marker || outsideArea) && styles.confirmBtnDisabled]}
              disabled={!marker || outsideArea}
              onPress={async () => {
                if (marker) {
                  try {
                    const loc = { lat: marker.latitude, lng: marker.longitude, label: label || "Selected location" };
                    const key = target === "pickup" ? "pickup_location" : "dropoff_location";
                    await storage.setItem(key, loc);
                    if (target === "dropoff") {
                      router.replace("/vehicles");
                    } else {
                      router.back();
                    }
                  } catch {
                    Alert.alert("Error", "Could not save location. Please try again.");
                  }
                }
              }}
            >
              <Text style={styles.confirmText}>Confirm Location</Text>
            </SpringPress>
          </View>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1 },
  searchContainer: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 10,
    gap: 6,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    ...shadows.sm,
  },
  searchBoxError: { borderColor: colors.danger },
  searchInput: { flex: 1, color: colors.text, fontSize: font.body },
  resultsList: {
    marginTop: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.md,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  resultText: { color: colors.text, fontSize: font.small, flex: 1 },
  areaBanner: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: "rgba(228,72,60,0.12)",
    borderWidth: 1,
    borderColor: "rgba(228,72,60,0.3)",
    zIndex: 5,
  },
  areaBannerTitle: { color: colors.danger, fontSize: font.small, fontWeight: "700" },
  areaBannerText: { color: colors.textMuted, fontSize: font.caption, marginTop: 2 },
  suggestionsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 4,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
    ...shadows.sm,
  },
  suggestionTag: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  suggestionName: { color: colors.text, fontSize: font.small, fontWeight: "600", marginTop: 3 },
  fab: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  loadingOverlay: {
    position: "absolute",
    bottom: 160,
    alignSelf: "center",
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 20,
    ...shadows.sm,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    ...shadows.accent,
  },
  customMarkerDanger: { backgroundColor: colors.danger },
  markerBadgeText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: 14,
    ...shadows.lg,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  nodeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  locationCardTitle: { color: colors.text, fontSize: font.label, fontWeight: "600" },
  locationCardSub: { color: colors.textMuted, fontSize: font.caption, marginTop: 2 },
  bottomActions: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  confirmBtn: {
    flex: 2,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.accent,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmText: { color: "#FFFFFF", fontSize: font.body, fontWeight: "700" },
});
