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
import { MapView, Marker, Polyline, PROVIDER_DEFAULT, MapPlaceholder, DARK_MAP_STYLE } from "@/src/components/map-view";
import * as Location from "expo-location";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import { FadeIn } from "@/src/components/fade-in";
import { SpringPress } from "@/src/components/spring-press";
import {
  isWithinServiceArea,
  TOURIST_PLACES,
  parseGoogleMapsUrl,
  resolveGoogleMapsUrl,
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
      const raw = await storage.getItem<string | null>(otherKey, null);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setOtherLocation(parsed);
        } catch {}
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

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { "User-Agent": "Where2App/1.0" } },
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const handleSearchInput = useCallback((text: string) => {
    setSearchQuery(text);

    // Clear existing timer
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    // Google Maps URL
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

    // Raw coordinates
    const coordMatch = text.match(/^\s*(-?\d{1,3}\.\d{2,7})\s*[,/]\s*(-?\d{1,3}\.\d{2,7})\s*$/);
    if (coordMatch) {
      applyLocation(parseFloat(coordMatch[1]), parseFloat(coordMatch[2]), "Pinned location");
      setSearchQuery("");
      return;
    }

    // Debounced search
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
      {/* Search bar */}
      <FadeIn delay={100}>
        <View style={[styles.searchContainer, { top: insets.top + 8 }]}>
        <View style={[styles.searchBox, outsideArea && styles.searchBoxError]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={target === "pickup" ? "Search pickup location..." : "Search destination..."}
            placeholderTextColor={colors.textDim}
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

        {searchQuery.length === 0 && (
          <View style={styles.hintRow}>
            <Ionicons name="link-outline" size={14} color={colors.textDim} />
            <Text style={styles.hintText}>Paste a Google Maps link or coordinates (lat, lng)</Text>
          </View>
        )}

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
      </FadeIn>

      {/* Outside area banner */}
      {outsideArea && (
        <View style={[styles.areaBanner, { top: insets.top + (searchResults.length > 0 ? 280 : 110) }]}>
          <Ionicons name="warning" size={18} color={colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.areaBannerTitle}>Outside service area</Text>
            <Text style={styles.areaBannerText}>Sorry, we haven&apos;t started service there yet. Pick a location near Sakleshpura.</Text>
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
          customMapStyle={DARK_MAP_STYLE}
        >
          {marker && (
            <Marker coordinate={marker}>
              <View style={[styles.customMarker, outsideArea && styles.customMarkerDanger]}>
                <View style={[styles.customMarkerDot, outsideArea && styles.customMarkerDotDanger]} />
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
      <SpringPress style={[styles.fab, { bottom: insets.bottom + 160 }]} onPress={useMyLocation}>
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
        <FadeIn delay={200}>
          <View
            style={[styles.suggestionsRow, { bottom: insets.bottom + 170 }]}
          >
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
        </FadeIn>
      )}

      {/* Bottom panel */}
      <FadeIn delay={250}>
        <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16 }]}>
        {marker && (
          <View style={[styles.pickedBox, outsideArea && styles.pickedBoxError]}>
            <Ionicons name="location" size={16} color={outsideArea ? colors.danger : colors.accent} />
            <Text style={styles.pickedLabel} numberOfLines={2}>{label || "Pin on map"}</Text>
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
                const loc = { lat: marker.latitude, lng: marker.longitude, label: label || "Selected location" };
                const key = target === "pickup" ? "pickup_location" : "dropoff_location";
                await storage.setItem(key, JSON.stringify(loc));
                router.back();
              }
            }}
          >
            <Text style={styles.confirmText}>Confirm Location</Text>
          </SpringPress>
        </View>
        </View>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1 },
  searchContainer: { position: "absolute", left: 12, right: 12, zIndex: 10 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8, height: 48,
    borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 12,
  },
  searchBoxError: { borderColor: colors.danger },
  searchInput: { flex: 1, color: "#fff", fontSize: font.body },
  hintRow: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, paddingHorizontal: 4,
  },
  hintText: { color: colors.textDim, fontSize: font.micro },
  resultsList: {
    marginTop: spacing.xs, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, overflow: "hidden",
  },
  resultItem: {
    flexDirection: "row", alignItems: "center", gap: 10, padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  resultText: { color: "#fff", fontSize: font.small, flex: 1 },
  areaBanner: {
    position: "absolute", left: 12, right: 12, flexDirection: "row",
    alignItems: "flex-start", gap: 10, padding: 12, borderRadius: radius.md,
    backgroundColor: "rgba(228,72,60,0.12)", borderWidth: 1,
    borderColor: "rgba(228,72,60,0.3)", zIndex: 5,
  },
  areaBannerTitle: { color: colors.danger, fontSize: font.small, fontWeight: "700" },
  areaBannerText: { color: colors.textMuted, fontSize: font.caption, marginTop: 2 },
  suggestionsRow: {
    position: "absolute", left: 0, right: 0, zIndex: 4,
  },
  suggestionChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    minWidth: 120,
  },
  suggestionTag: { color: colors.accent, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  suggestionName: { color: "#fff", fontSize: font.small, fontWeight: "600", marginTop: 3 },
  fab: {
    position: "absolute", right: 16, width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  loadingOverlay: {
    position: "absolute", bottom: 160, alignSelf: "center",
    backgroundColor: colors.surface, padding: spacing.sm, borderRadius: 20,
  },
  customMarker: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(30,107,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  customMarkerDanger: { backgroundColor: "rgba(228,72,60,0.2)" },
  customMarkerDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent,
    borderWidth: 2, borderColor: "#fff",
  },
  customMarkerDotDanger: { backgroundColor: colors.danger },
  bottomPanel: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.md, paddingTop: 14,
  },
  pickedBox: {
    flexDirection: "row", alignItems: "center", gap: 8, padding: 12,
    borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, marginBottom: 12,
  },
  pickedBoxError: { borderColor: colors.danger },
  pickedLabel: { color: "#fff", fontSize: font.small, flex: 1 },
  bottomActions: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  cancelText: { color: "#fff", fontSize: font.body, fontWeight: "700" },
  confirmBtn: {
    flex: 2, height: 50, borderRadius: radius.md, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
    ...shadows.accent,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmText: { color: "#fff", fontSize: font.body, fontWeight: "700" },
});
