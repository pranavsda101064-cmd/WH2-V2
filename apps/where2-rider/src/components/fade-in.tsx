import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

type Direction = "up" | "down" | "left" | "right";

const OFFSET = 16;

export function FadeIn({
  children,
  delay = 0,
  duration = 400,
  direction = "up",
  scale,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: Direction;
  scale?: { from?: number; to?: number };
}) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(direction === "left" ? -OFFSET : direction === "right" ? OFFSET : 0);
  const translateY = useSharedValue(direction === "up" ? OFFSET : direction === "down" ? -OFFSET : 0);
  const scaleVal = useSharedValue(scale?.from ?? 1);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    opacity.value = withDelay(delay, withTiming(1, { duration, easing: ease }));
    translateX.value = withDelay(delay, withTiming(0, { duration, easing: ease }));
    translateY.value = withDelay(delay, withTiming(0, { duration, easing: ease }));
    if (scale) {
      scaleVal.value = withDelay(delay, withTiming(scale.to ?? 1, { duration, easing: ease }));
    }
  }, [delay, duration, scale?.to]);

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
