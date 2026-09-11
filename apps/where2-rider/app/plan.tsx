import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { MapView, Marker, Polyline, PROVIDER_DEFAULT } from "@/src/components/map-view";

import { colors, radius, font, spacing, shadows } from "@/src/theme";
import { SpringPress } from "@/src/components/spring-press";
import { storage } from "@/src/utils/storage";
import { TOURIST_PLACES, type TouristPlace } from "@/src/utils/location";

const SAKLESHPURA = { latitude: 13.0358, longitude: 75.7827 };

type Stop = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

let counter = 0;
const nextId = () => `stop-${++counter}`;

export default function Plan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [stops, setStops] = useState<Stop[]>([]);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  // Search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Suggestions
  const [suggestedTag, setSuggestedTag] = useState<string>("All");
  const TAGS = ["All", ...Array.from(new Set(TOURIST_PLACES.map((p) => p.tag)))];
  const filteredSuggestions =
    suggestedTag === "All"
      ? TOURIST_PLACES
      : TOURIST_PLACES.filter((p) => p.tag === suggestedTag);

  // Fetch route when stops change
  useEffect(() => {
    if (stops.length < 2) {
      setRouteCoords([]);
      return;
    }
    const coords = stops.map((s) => `${s.lng},${s.lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.routes?.[0]?.geometry?.coordinates) {
          const line = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => ({ latitude: c[1], longitude: c[0] }),
          );
          setRouteCoords(line);
          // Fit map to all stops
          if (mapRef.current && stops.length > 1) {
            const allCoords = stops.map((s) => ({ latitude: s.lat, longitude: s.lng }));
            mapRef.current.fitToCoordinates(allCoords, {
              edgePadding: { top: 60, right: 40, bottom: 40, left: 40 },
              animated: true,
            });
          }
        }
      })
      .catch(() => {});
  }, [stops.length, stops.map((s) => `${s.lat},${s.lng}`).join(";")]);

  const addStop = useCallback((label: string, lat: number, lng: number) => {
    setStops((prev) => [...prev, { id: nextId(), label, lat, lng }]);
    setQuery("");
    setResults([]);
    Keyboard.dismiss();
  }, []);

  const removeStop = useCallback((id: string) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const moveStop = useCallback((id: string, dir: -1 | 1) => {
    setStops((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  }, []);

  // Nominatim search
  const handleSearchInput = useCallback((text: string) => {
    setQuery(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (text.length >= 3) {
      setSearching(true);
      searchTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&countrycodes=in`,
            { headers: { "User-Agent": "Where2App/1.0" } },
          );
          const data = await res.json();
          setResults(data);
        } catch {
          setResults([]);
        }
        setSearching(false);
      }, 300);
    } else {
      setResults([]);
      setSearching(false);
    }
  }, []);

  const handleSelectResult = (item: any) => {
    addStop(item.display_name.split(",")[0], parseFloat(item.lat), parseFloat(item.lon));
  };

  const handleSelectSuggestion = (place: TouristPlace) => {
    addStop(place.name, place.lat, place.lng);
  };

  const canContinue = stops.length >= 2;

  const handleContinue = async () => {
    if (!canContinue) return;
    try {
      await storage.setItem("route_stops", stops.map((s) => ({ label: s.label, lat: s.lat, lng: s.lng })));
      router.push("/vehicles");
    } catch {
      Alert.alert("Error", "Could not save route. Please try again.");
    }
  };

  // Load any existing stops from storage
  useEffect(() => {
    (async () => {
      const existing = await storage.getItem<{ label: string; lat: number; lng: number }[] | null>("route_stops", null);
      if (existing && existing.length > 0) {
        setStops(existing.map((s) => ({ id: nextId(), ...s })));
      }
    })();
  }, []);

  return (
    <View style={styles.root} testID="plan-screen">
      <StatusBar style="dark" />

      {/* Map */}
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            ...SAKLESHPURA,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          }}
          showsUserLocation={false}
        >
          {stops.map((stop, i) => (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.lat, longitude: stop.lng }}
              title={stop.label}
              pinColor={i === 0 ? "#4CAF50" : i === stops.length - 1 ? "#F44336" : colors.accent}
            />
          ))}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor={colors.accent}
              strokeWidth={4}
            />
          )}
        </MapView>
        <SpringPress style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </SpringPress>
      </View>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        {/* Search bar */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search a place..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={handleSearchInput}
            returnKeyType="search"
          />
          {searching && <ActivityIndicator size="small" color={colors.accent} />}
        </View>

        {/* Search results */}
        {results.length > 0 && (
          <View style={styles.resultsWrap}>
            {results.map((r) => (
              <SpringPress
                key={r.place_id}
                style={styles.resultItem}
                onPress={() => handleSelectResult(r)}
              >
                <Ionicons name="location" size={14} color={colors.accent} />
                <Text style={styles.resultText} numberOfLines={2}>
                  {r.display_name}
                </Text>
              </SpringPress>
            ))}
          </View>
        )}

        {/* Stops list */}
        {stops.length > 0 && (
          <View style={styles.stopsSection}>
            <Text style={styles.sectionTitle}>Your Route ({stops.length} stops)</Text>
            {stops.map((stop, i) => (
              <View key={stop.id} style={styles.stopRow}>
                <View style={styles.stopIndex}>
                  <Text style={styles.stopIndexText}>{i + 1}</Text>
                </View>
                <Text style={styles.stopLabel} numberOfLines={1}>
                  {stop.label}
                </Text>
                <View style={styles.stopActions}>
                  <SpringPress
                    style={[styles.stopActionBtn, i === 0 && { opacity: 0.3 }]}
                    onPress={() => moveStop(stop.id, -1)}
                    disabled={i === 0}
                  >
                    <Ionicons name="chevron-up" size={16} color={colors.textMuted} />
                  </SpringPress>
                  <SpringPress
                    style={[styles.stopActionBtn, i === stops.length - 1 && { opacity: 0.3 }]}
                    onPress={() => moveStop(stop.id, 1)}
                    disabled={i === stops.length - 1}
                  >
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                  </SpringPress>
                  <SpringPress style={styles.stopActionBtn} onPress={() => removeStop(stop.id)}>
                    <Ionicons name="close" size={16} color="#F44336" />
                  </SpringPress>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Suggested places */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.sectionTitle}>Suggested Places</Text>

          {/* Tag chips */}
          <View style={styles.tagRow}>
            {TAGS.map((tag) => (
              <SpringPress
                key={tag}
                style={[styles.tagChip, suggestedTag === tag && styles.tagChipActive]}
                onPress={() => setSuggestedTag(tag)}
              >
                <Text style={[styles.tagChipText, suggestedTag === tag && styles.tagChipTextActive]}>
                  {tag}
                </Text>
              </SpringPress>
            ))}
          </View>

          {/* Place chips */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={filteredSuggestions}
            keyExtractor={(item) => item.name}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <SpringPress
                style={styles.placeChip}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Text style={styles.placeChipName}>{item.name}</Text>
                <Text style={styles.placeChipTag}>{item.tag}</Text>
              </SpringPress>
            )}
          />
        </View>

        {/* Continue */}
        <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + spacing.sm }]}>
          <SpringPress
            style={[styles.cta, !canContinue && styles.ctaDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text style={styles.ctaText}>
              {canContinue ? `Continue with ${stops.length} stops` : "Add at least 2 stops"}
            </Text>
            {canContinue && <Ionicons name="arrow-forward" size={16} color="#fff" />}
          </SpringPress>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  mapWrap: { height: 300, width: "100%" },
  map: { flex: 1 },
  backBtn: {
    position: "absolute",
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },

  // Sheet
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -20,
    paddingTop: spacing.md,
    gap: spacing.md,
  },

  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: font.body, color: colors.text },

  // Results
  resultsWrap: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultText: { flex: 1, fontSize: font.small, color: colors.text, lineHeight: 18 },

  // Stops
  stopsSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: font.label,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  stopIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  stopIndexText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  stopLabel: { flex: 1, fontSize: font.small, fontWeight: "500", color: colors.text },
  stopActions: { flexDirection: "row", gap: 2 },
  stopActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  // Suggestions
  suggestionsSection: {
    gap: spacing.sm,
  },
  tagRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tagChipText: {
    fontSize: font.micro,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tagChipTextActive: { color: "#fff" },
  placeChip: {
    width: 150,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  placeChipName: { fontSize: font.small, fontWeight: "600", color: colors.text },
  placeChipTag: { fontSize: font.micro, color: colors.textMuted },

  // CTA
  ctaWrap: { paddingHorizontal: spacing.lg },
  cta: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadows.accent,
  },
  ctaDisabled: { backgroundColor: colors.border, elevation: 0 },
  ctaText: { fontSize: font.body, fontWeight: "700", color: "#fff" },
});
