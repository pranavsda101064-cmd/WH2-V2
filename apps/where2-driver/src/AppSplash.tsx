import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { colors } from "./theme";

const BAR_WIDTH = 180;
const BAR_HEIGHT = 3;
const BAR_TRACK = "rgba(255,255,255,0.25)";

export default function AppSplash() {
  const translateX = useRef(new Animated.Value(-BAR_WIDTH)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: BAR_WIDTH,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -BAR_WIDTH,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [translateX]);

  return (
    <View style={s.container}>
      <Image source={require("../assets/images/icon.png")} style={s.logo} />
      <Text style={s.tagline}>Your way around Sakleshpura</Text>
      <View style={s.barTrack}>
        <Animated.View
          style={[s.barFill, { transform: [{ translateX }] }]}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 20,
  },
  tagline: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    opacity: 0.85,
    marginBottom: 40,
    letterSpacing: 0.3,
  },
  barTrack: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: BAR_TRACK,
    overflow: "hidden",
  },
  barFill: {
    width: 60,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: "#FFFFFF",
  },
});
