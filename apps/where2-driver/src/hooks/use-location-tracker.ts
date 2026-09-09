import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { Platform } from "react-native";
import { storage } from "@/src/utils/storage";
import { api } from "@/src/api";

const ACTIVE_RIDE_KEY = "active_ride_id";
const LOCATION_INTERVAL = 6000; // 6 seconds

export function useLocationTracker() {
  const rideIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startTracking() {
      try {
        const rideId = await storage.getItem<string>(ACTIVE_RIDE_KEY, "");
        if (!rideId || cancelled) return;
        rideIdRef.current = rideId;

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        if (Platform.OS === "android") {
          await Location.requestBackgroundPermissionsAsync();
        }

        const sendLocation = async () => {
          try {
            if (!rideIdRef.current) return;
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            await api.updateDriverLocation(
              rideIdRef.current,
              loc.coords.latitude,
              loc.coords.longitude,
              loc.coords.heading ?? undefined,
              loc.coords.speed ? loc.coords.speed * 3.6 : undefined,
            );
          } catch {
            // silent — network may be flaky
          }
        };

        await sendLocation();
        intervalRef.current = setInterval(sendLocation, LOCATION_INTERVAL);
      } catch {
        // permission denied or location unavailable
      }
    }

    startTracking();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
}
