import { Platform, View, Text, StyleSheet } from "react-native";
import { colors, radius } from "@/src/theme";

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_DEFAULT: any = null;

if (Platform.OS !== "web") {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
  PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
}

function MapPlaceholder({ style }: { style?: any }) {
  return (
    <View style={[styles.placeholder, style]}>
      <Text style={styles.placeholderText}>Map (mobile only)</Text>
    </View>
  );
}

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
});

export { MapView, Marker, Polyline, PROVIDER_DEFAULT, MapPlaceholder };
