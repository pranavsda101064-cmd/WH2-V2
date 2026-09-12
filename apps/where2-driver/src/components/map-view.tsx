import { useRef, forwardRef, useImperativeHandle } from "react";
import { Platform, View, Text, StyleSheet } from "react-native";
import { colors, radius } from "@/src/theme";

const DARK_STYLE_URL = "https://openfreemap.org/style/dark";
const LIGHT_STYLE_URL = "https://openfreemap.org/style/liberty";

let MaplibreMap: any = null;
let MaplibreCamera: any = null;
let MaplibreMarker: any = null;
let UserLocationComponent: any = null;
let GeoJSONSourceComponent: any = null;
let LayerComponent: any = null;

if (Platform.OS !== "web") {
  try {
    const maplibre = require("@maplibre/maplibre-react-native");
    MaplibreMap = maplibre.Map;
    MaplibreCamera = maplibre.Camera;
    MaplibreMarker = maplibre.Marker;
    UserLocationComponent = maplibre.UserLocation;
    GeoJSONSourceComponent = maplibre.GeoJSONSource;
    LayerComponent = maplibre.Layer;
  } catch {}
}

function MapPlaceholder({ style }: { style?: any }) {
  return (
    <View style={[styles.placeholder, style]}>
      <Text style={styles.placeholderText}>Map (mobile only)</Text>
    </View>
  );
}

// ---------- Marker ----------
type MarkerProps = {
  coordinate: { latitude: number; longitude: number };
  pinColor?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  anchor?: { x: number; y: number } | string;
  flat?: boolean;
  onPress?: () => void;
};

function MapMarker({ coordinate, pinColor, children, onPress }: MarkerProps) {
  const lngLat = [coordinate.longitude, coordinate.latitude] as [number, number];
  return (
    <MaplibreMarker lngLat={lngLat} onPress={onPress}>
      {children || (
        <View style={[styles.defaultPin, { backgroundColor: pinColor || colors.accent }]} />
      )}
    </MaplibreMarker>
  );
}

// ---------- Polyline ----------
type PolylineProps = {
  coordinates: Array<{ latitude: number; longitude: number }>;
  strokeColor?: string;
  strokeWidth?: number;
  lineCap?: string;
  lineJoin?: string;
};

function MapPolyline({ coordinates, strokeColor, strokeWidth }: PolylineProps) {
  if (!coordinates || coordinates.length < 2) return null;
  const coords = coordinates.map((c) => [c.longitude, c.latitude]);
  const geojson = {
    type: "Feature" as const,
    geometry: { type: "LineString" as const, coordinates: coords },
    properties: {},
  };
  if (!GeoJSONSourceComponent || !LayerComponent) return null;
  return (
    <GeoJSONSourceComponent id={`polyline-${strokeColor}-${strokeWidth}`} lineMetrics data={geojson}>
      <LayerComponent
        id={`line-${strokeColor}-${strokeWidth}`}
        type="line"
        paint={{
          "line-color": strokeColor || colors.accent,
          "line-width": strokeWidth || 4,
          "line-cap": "round",
          "line-join": "round",
        }}
      />
    </GeoJSONSourceComponent>
  );
}

// ---------- MapView ----------
type MapViewProps = {
  style?: any;
  initialRegion?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  region?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  customMapStyle?: any;
  children?: React.ReactNode;
  onMapReady?: () => void;
};

type MapViewRef = {
  fitToCoordinates: (
    coords: Array<{ latitude: number; longitude: number }>,
    options?: { edgePadding?: { top: number; bottom: number; left: number; right: number }; animated?: boolean }
  ) => void;
  animateToRegion: (region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }, duration?: number) => void;
  animateToRegionAnimated: (region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => void;
  getCamera: () => any;
};

const MapView = forwardRef<MapViewRef, MapViewProps>(
  (
    {
      style,
      initialRegion,
      region,
      showsUserLocation,
      scrollEnabled = true,
      zoomEnabled = true,
      pitchEnabled = false,
      rotateEnabled = false,
      children,
    },
    ref
  ) => {
    const cameraRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      fitToCoordinates: (coords, options) => {
        if (!coords || coords.length === 0) return;
        const lats = coords.map((c) => c.latitude);
        const lngs = coords.map((c) => c.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const latDelta = (maxLat - minLat) * 0.5 + 0.01;
        const lngDelta = (maxLng - minLng) * 0.5 + 0.01;
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const zoom = Math.min(16, Math.max(10, 14 - Math.log2(Math.max(latDelta, lngDelta) * 100)));
        cameraRef.current?.setCamera({
          centerCoordinate: [centerLng, centerLat],
          zoomLevel: zoom,
          animationDuration: 500,
        });
      },
      animateToRegion: (reg, duration) => {
        cameraRef.current?.setCamera({
          centerCoordinate: [reg.longitude, reg.latitude],
          zoomLevel: 14 - Math.log2(Math.max(reg.latitudeDelta, reg.longitudeDelta) * 100),
          animationDuration: duration || 300,
        });
      },
      animateToRegionAnimated: (reg) => {
        cameraRef.current?.setCamera({
          centerCoordinate: [reg.longitude, reg.latitude],
          zoomLevel: 14 - Math.log2(Math.max(reg.latitudeDelta, reg.longitudeDelta) * 100),
          animationDuration: 300,
        });
      },
      getCamera: () => cameraRef.current,
    }));

    if (!MaplibreMap) {
      return <MapPlaceholder style={style} />;
    }

    const center = region
      ? [region.longitude, region.latitude]
      : initialRegion
      ? [initialRegion.longitude, initialRegion.latitude]
      : [75.7827, 13.0358];

    const zoom = region
      ? Math.min(18, Math.max(8, 14 - Math.log2(Math.max(region.latitudeDelta, region.longitudeDelta) * 100)))
      : initialRegion
      ? Math.min(18, Math.max(8, 14 - Math.log2(Math.max(initialRegion.latitudeDelta, initialRegion.longitudeDelta) * 100)))
      : 13;

    return (
      <MaplibreMap
        style={[{ flex: 1 }, style]}
        mapStyle={DARK_STYLE_URL}
        scrollEnabled={scrollEnabled}
        zoomEnabled={zoomEnabled}
        pitchEnabled={pitchEnabled}
        rotateEnabled={rotateEnabled}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MaplibreCamera
          ref={cameraRef}
          centerCoordinate={center as [number, number]}
          zoomLevel={zoom}
          animationMode="easeTo"
          animationDuration={0}
        />
        {showsUserLocation && UserLocationComponent && <UserLocationComponent animated visible />}
        {children}
      </MaplibreMap>
    );
  }
);

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholderText: { color: colors.textDim, fontSize: 14 },
  defaultPin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
});

export { MapView, MapMarker as Marker, MapPolyline as Polyline, MapPlaceholder, DARK_STYLE_URL as DARK_MAP_STYLE };
export const PROVIDER_DEFAULT = "maplibre";
export type { MapViewRef };
