import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "@/src/theme";

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
}

export function LoadingBar() {
  return (
    <View style={styles.bar}>
      <ActivityIndicator size="small" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    gap: 12,
  },
  text: {
    color: colors.textMuted,
    fontSize: 14,
  },
  bar: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
