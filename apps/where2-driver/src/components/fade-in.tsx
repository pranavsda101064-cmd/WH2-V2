import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

export function FadeIn({
  children,
  delay = 0,
  duration = 400,
  direction = "up",
  scale = false,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right";
  scale?: boolean;
}) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(
    direction === "left" ? -20 : direction === "right" ? 20 : 0,
  );
  const translateY = useSharedValue(
    direction === "up" ? 20 : direction === "down" ? -20 : 0,
  );
  const scaleVal = useSharedValue(scale ? 0.92 : 1);

  useEffect(() => {
    const easing = Easing.out(Easing.cubic);
    opacity.value = withDelay(delay, withTiming(1, { duration, easing }));
    translateX.value = withDelay(delay, withTiming(0, { duration, easing }));
    translateY.value = withDelay(delay, withTiming(0, { duration, easing }));
    if (scale) {
      scaleVal.value = withDelay(delay, withTiming(1, { duration, easing }));
    }
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scaleVal.value },
    ],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
